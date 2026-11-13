-- Shared live-tracking schema for Juvay.
-- Vertical-agnostic: fish trucks, bakery vans, parcels, mechanics, etc.
-- kind: route (many stops) | delivery (pickup → dropoff) | visit (provider to one address).
-- Neutral naming: provider / vehicle. Do not bake a vertical into this schema.
-- No seed / demo rows. Apply on the Juvay Postgres, then restart the API.
--
-- Fresh Catch / bakery / any vertical creates a job with POST /api/routes
-- (seller JWT, Premium or tracking add-on) and attaches order refs on stops.
-- Customers watch GET /api/track/:token. Drivers run /driver/route/:id.
--
-- Paid gate: plan_tier premium (legacy pro/starter/business treated as premium).
-- Premium includes 1 live-tracked vehicle.
-- Extra vehicles: stores.tracking_extra_vehicles, add-on priced in services/juvayPlans.ts
-- (TRACKING_EXTRA_VEHICLE_PRICE_TTD). Max active+planned jobs = 1 + tracking_extra_vehicles.
-- Customer track pages stay free. TRACKING_REQUIRE_PAID defaults true.
-- Do not invent a live add-on checkout in this migration.

ALTER TABLE stores ADD COLUMN IF NOT EXISTS tracking_addon boolean NOT NULL DEFAULT false;
ALTER TABLE stores ADD COLUMN IF NOT EXISTS tracking_extra_vehicles integer NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS delivery_routes (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kind          text NOT NULL CHECK (kind IN ('route', 'delivery', 'visit')),
  seller_user_id text,
  store_id      text,
  driver_user_id text NOT NULL,
  provider_label text,
  status        text NOT NULL DEFAULT 'planned' CHECK (status IN ('planned', 'active', 'ended')),
  started_at    timestamptz,
  ended_at      timestamptz,
  -- Vertical-specific refs (order batch, depot, etc.) live here — not as first-class columns.
  metadata      jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_delivery_routes_driver ON delivery_routes (driver_user_id);
CREATE INDEX IF NOT EXISTS idx_delivery_routes_seller ON delivery_routes (seller_user_id);
CREATE INDEX IF NOT EXISTS idx_delivery_routes_store  ON delivery_routes (store_id);
CREATE INDEX IF NOT EXISTS idx_delivery_routes_status ON delivery_routes (status);

CREATE TABLE IF NOT EXISTS route_stops (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  route_id      uuid NOT NULL REFERENCES delivery_routes(id) ON DELETE CASCADE,
  sequence      int  NOT NULL,
  role          text NOT NULL DEFAULT 'stop'
                  CHECK (role IN ('pickup', 'dropoff', 'stop', 'visit')),
  order_ref     text,
  -- Unguessable per-stop (per-order) token for /track/:token. Unique.
  share_token   text NOT NULL UNIQUE,
  status        text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'next', 'delivered')),
  label         text,
  lat           double precision,
  lng           double precision,
  delivered_at  timestamptz,
  created_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE (route_id, sequence)
);

CREATE INDEX IF NOT EXISTS idx_route_stops_route ON route_stops (route_id, sequence);
CREATE INDEX IF NOT EXISTS idx_route_stops_token ON route_stops (share_token);
CREATE INDEX IF NOT EXISTS idx_route_stops_order ON route_stops (order_ref);

CREATE TABLE IF NOT EXISTS driver_locations (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  route_id     uuid NOT NULL REFERENCES delivery_routes(id) ON DELETE CASCADE,
  lat          double precision NOT NULL,
  lng          double precision NOT NULL,
  accuracy     double precision,
  heading      double precision,
  speed        double precision,
  recorded_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_driver_locations_route_time
  ON driver_locations (route_id, recorded_at DESC);

CREATE TABLE IF NOT EXISTS tracking_alert_events (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  route_id   uuid NOT NULL REFERENCES delivery_routes(id) ON DELETE CASCADE,
  stop_id    uuid REFERENCES route_stops(id) ON DELETE CASCADE,
  event      text NOT NULL
               CHECK (event IN ('on_the_way', 'two_stops_away', 'next_stop', 'delivered')),
  at         timestamptz NOT NULL DEFAULT now(),
  -- Honest: no SMS / WhatsApp sender ships with this cut.
  sent       boolean NOT NULL DEFAULT false,
  channel    text,
  note       text
);

CREATE INDEX IF NOT EXISTS idx_tracking_alert_events_stop ON tracking_alert_events (stop_id, at);

-- Retention: drop location points older than 7 days.
-- The API also purges on write (purgeOldLocations). A daily cron is fine:
--   DELETE FROM driver_locations WHERE recorded_at < now() - interval '7 days';
