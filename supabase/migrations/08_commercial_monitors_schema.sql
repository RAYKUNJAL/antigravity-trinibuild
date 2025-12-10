-- JOB APPLICATIONS
create table if not exists public.job_applications (
  id uuid default uuid_generate_v4() primary key,
  job_id uuid references public.jobs(id) not null,
  applicant_id uuid references public.profiles(id) not null,
  cover_letter text,
  resume_url text,
  status text default 'pending', -- pending, reviewed, accepted, rejected
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.job_applications enable row level security;

drop policy if exists "Applicants can view their own applications" on public.job_applications;
create policy "Applicants can view their own applications"
  on public.job_applications for select
  using ( auth.uid() = applicant_id );

drop policy if exists "Applicants can create applications" on public.job_applications;
create policy "Applicants can create applications"
  on public.job_applications for insert
  with check ( auth.uid() = applicant_id );

drop policy if exists "Job posters can view applications for their jobs" on public.job_applications;
create policy "Job posters can view applications for their jobs"
  on public.job_applications for select
  using (
    exists (
      select 1 from public.jobs
      where id = job_applications.job_id
      and employer_id = auth.uid()
    )
  );

drop policy if exists "Admins can view all applications" on public.job_applications;
create policy "Admins can view all applications"
  on public.job_applications for select
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role in ('admin', 'super_admin')
    )
  );

-- TICKETS TABLE
create table if not exists public.tickets (
  id uuid default uuid_generate_v4() primary key,
  event_id uuid references public.events(id) not null,
  user_id uuid references public.profiles(id) not null,
  tier_name text, -- e.g. "VIP", "General"
  price decimal(10,2) not null,
  status text default 'valid', -- valid, used, refunded
  qr_code text, -- distinct code for scanning
  purchased_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.tickets enable row level security;

drop policy if exists "Users can view their own tickets" on public.tickets;
create policy "Users can view their own tickets"
  on public.tickets for select
  using ( auth.uid() = user_id );

drop policy if exists "Users can purchase tickets" on public.tickets;
create policy "Users can purchase tickets"
  on public.tickets for insert
  with check ( auth.uid() = user_id );

drop policy if exists "Event hosts can view tickets for their events" on public.tickets;
create policy "Event hosts can view tickets for their events"
  on public.tickets for select
  using (
    exists (
      select 1 from public.events
      where id = tickets.event_id
      and host_id = auth.uid()
    )
  );

drop policy if exists "Admins can view all tickets" on public.tickets;
create policy "Admins can view all tickets"
  on public.tickets for select
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role in ('admin', 'super_admin')
    )
  );

-- SUPPORT MESSAGES
create table if not exists public.support_messages (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id), -- Optional, can be guest
  email text, -- For guest
  subject text,
  message text,
  status text default 'new', -- new, in_progress, resolved
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.support_messages enable row level security;

drop policy if exists "Admins can manage support messages" on public.support_messages;
create policy "Admins can manage support messages"
  on public.support_messages for all
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role in ('admin', 'super_admin')
    )
  );

drop policy if exists "Anyone can insert support messages" on public.support_messages;
create policy "Anyone can insert support messages"
  on public.support_messages for insert
  with check (true);

-- AUTOMATIONS LOG
create table if not exists public.automation_logs (
  id uuid default uuid_generate_v4() primary key,
  automation_name text,
  status text, -- success, failed
  details text,
  executed_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.automation_logs enable row level security;

drop policy if exists "Admins can view automation logs" on public.automation_logs;
create policy "Admins can view automation logs"
  on public.automation_logs for select
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role in ('admin', 'super_admin')
    )
  );

-- KEYWORD ENGINE SCHEMA

-- 1. Keyword Searches (Raw Logs)
create table if not exists public.keyword_searches (
  id uuid default uuid_generate_v4() primary key,
  keyword_text text,
  keyword_normalized text,
  search_source text,
  user_id uuid references public.profiles(id),
  session_id text,
  detected_location text,
  location_slug text,
  results_count integer default 0,
  result_vertical text[],
  clicked_result_id text,
  clicked_result_type text,
  time_to_click_seconds integer,
  bounced boolean default true,
  converted boolean default false,
  conversion_type text,
  pages_viewed_after integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.keyword_searches enable row level security;

drop policy if exists "Admins view searches" on public.keyword_searches;
create policy "Admins view searches" on public.keyword_searches for select using (exists (select 1 from public.profiles where id = auth.uid() and role in ('admin', 'super_admin')));

drop policy if exists "Anyone insert searches" on public.keyword_searches;
create policy "Anyone insert searches" on public.keyword_searches for insert with check (true);

drop policy if exists "Anyone update own session searches" on public.keyword_searches;
create policy "Anyone update own session searches" on public.keyword_searches for update using (true);

-- 2. Keyword Metrics (View)
create or replace view public.keyword_metrics as
select
  keyword_normalized,
  date(created_at) as date,
  count(*) as search_volume,
  count(clicked_result_id) as total_clicks,
  avg(case when clicked_result_id is not null then 1 else 0 end) as ctr,
  avg(case when converted then 1 else 0 end) as conversion_rate,
  false as is_rising, -- Placeholder
  false as is_falling, -- Placeholder
  0 as volume_change_percent, -- Placeholder
  50 as opportunity_score -- Placeholder
from public.keyword_searches
group by keyword_normalized, date(created_at);

-- 3. Keyword Gaps
create table if not exists public.keyword_gaps (
  id uuid default uuid_generate_v4() primary key,
  keyword_normalized text,
  gap_type text,
  search_volume_30d integer,
  current_results_count integer,
  gap_severity text, -- low, medium, high, critical
  recommended_action text,
  status text default 'open',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
alter table public.keyword_gaps enable row level security;

drop policy if exists "Admins manage gaps" on public.keyword_gaps;
create policy "Admins manage gaps" on public.keyword_gaps for all using (exists (select 1 from public.profiles where id = auth.uid() and role in ('admin', 'super_admin')));

-- 4. Location Heatmap (Table for caching or View)
create table if not exists public.location_keyword_heatmap (
  id uuid default uuid_generate_v4() primary key,
  location_slug text,
  location_name text,
  total_searches integer,
  top_keywords jsonb, -- Array of {keyword, volume}
  rising_keywords jsonb,
  date date default current_date
);
alter table public.location_keyword_heatmap enable row level security;

drop policy if exists "Admins view heatmap" on public.location_keyword_heatmap;
create policy "Admins view heatmap" on public.location_keyword_heatmap for select using (exists (select 1 from public.profiles where id = auth.uid() and role in ('admin', 'super_admin')));

-- 5. Keyword Alerts
create table if not exists public.keyword_alerts (
  id uuid default uuid_generate_v4() primary key,
  alert_type text,
  keyword text,
  message text,
  severity text, -- info, warning, critical
  status text default 'new',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  viewed_at timestamp with time zone
);
alter table public.keyword_alerts enable row level security;

drop policy if exists "Admins manage alerts" on public.keyword_alerts;
create policy "Admins manage alerts" on public.keyword_alerts for all using (exists (select 1 from public.profiles where id = auth.uid() and role in ('admin', 'super_admin')));

-- 6. Keyword Suggestions
create table if not exists public.keyword_suggestions (
  id uuid default uuid_generate_v4() primary key,
  keyword text,
  suggestion_type text,
  estimated_volume integer,
  difficulty_score integer,
  opportunity_score integer,
  suggested_title text,
  target_location text,
  status text default 'pending',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
alter table public.keyword_suggestions enable row level security;

drop policy if exists "Admins manage suggestions" on public.keyword_suggestions;
create policy "Admins manage suggestions" on public.keyword_suggestions for all using (exists (select 1 from public.profiles where id = auth.uid() and role in ('admin', 'super_admin')));
