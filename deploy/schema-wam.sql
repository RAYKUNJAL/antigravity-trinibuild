-- Wam + honesty columns for self-hosted Juvay (PostgreSQL on the VPS).
-- No test rows. Fail-closed payments live in wam_payments.

ALTER TABLE stores ADD COLUMN IF NOT EXISTS accepts_pickup boolean DEFAULT false;
ALTER TABLE stores ADD COLUMN IF NOT EXISTS pickup_address text;
ALTER TABLE stores ADD COLUMN IF NOT EXISTS wam_handle text;
ALTER TABLE stores ADD COLUMN IF NOT EXISTS exact_cash_note boolean DEFAULT true;
ALTER TABLE stores ADD COLUMN IF NOT EXISTS island text;

ALTER TABLE users ADD COLUMN IF NOT EXISTS island text;

CREATE TABLE IF NOT EXISTS wam_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  store_id uuid REFERENCES stores(id) ON DELETE SET NULL,
  purpose text NOT NULL,
  amount_cents int NOT NULL,
  face_cents int NOT NULL,
  currency text DEFAULT 'TTD',
  status text DEFAULT 'pending' CHECK (status IN ('pending','recorded','rejected','duplicate')),
  idempotency_key text UNIQUE,
  wam_event_id text UNIQUE,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_wam_payments_user ON wam_payments(user_id);
CREATE INDEX IF NOT EXISTS idx_wam_payments_event ON wam_payments(wam_event_id);
