-- ============================================================================
-- TRINIBUILD RIDES GPS TRACKING SCHEMA
-- ============================================================================
-- Tables for real-time driver location tracking, trip management, and ETA

-- ============================================================================
-- TABLE: driver_locations
-- Stores real-time driver GPS coordinates
-- ============================================================================
CREATE TABLE IF NOT EXISTS driver_locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  latitude NUMERIC NOT NULL,
  longitude NUMERIC NOT NULL,
  accuracy INT,
  speed NUMERIC,
  heading INT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  UNIQUE(driver_id)
);

-- Index for fast location lookups
CREATE INDEX IF NOT EXISTS idx_driver_locations_updated_at 
  ON driver_locations(updated_at DESC);

-- ============================================================================
-- TABLE: trips
-- Stores all trip information and history
-- ============================================================================
CREATE TABLE IF NOT EXISTS trips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  passenger_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  pickup_location TEXT NOT NULL, -- Format: "lat,lng"
  dropoff_location TEXT NOT NULL, -- Format: "lat,lng"
  
  status VARCHAR DEFAULT 'requesting',
  -- requesting: waiting for driver
  -- accepted: driver accepted
  -- arriving: driver arriving at pickup
  -- in_progress: trip in progress
  -- completed: trip finished
  -- cancelled: trip cancelled
  
  start_time TIMESTAMPTZ,
  end_time TIMESTAMPTZ,
  
  fare NUMERIC NOT NULL,
  distance_m INT,
  duration_minutes INT,
  
  rating_by_passenger INT,
  rating_by_driver INT,
  passenger_notes TEXT,
  driver_notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for trip lookups
CREATE INDEX IF NOT EXISTS idx_trips_driver_id 
  ON trips(driver_id);
CREATE INDEX IF NOT EXISTS idx_trips_passenger_id 
  ON trips(passenger_id);
CREATE INDEX IF NOT EXISTS idx_trips_status 
  ON trips(status);
CREATE INDEX IF NOT EXISTS idx_trips_created_at 
  ON trips(created_at DESC);

-- ============================================================================
-- TABLE: trip_routes
-- Stores waypoints and route information for each trip
-- ============================================================================
CREATE TABLE IF NOT EXISTS trip_routes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  waypoints JSONB, -- Array of {lat, lng, timestamp}
  
  distance_m INT,
  duration_minutes INT,
  eta_minutes INT,
  
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Index for route lookups
CREATE INDEX IF NOT EXISTS idx_trip_routes_trip_id 
  ON trip_routes(trip_id);

-- ============================================================================
-- TABLE: driver_stats
-- Aggregate statistics for drivers
-- ============================================================================
CREATE TABLE IF NOT EXISTS driver_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  
  total_trips INT DEFAULT 0,
  total_distance_km NUMERIC DEFAULT 0,
  total_earnings NUMERIC DEFAULT 0,
  avg_rating NUMERIC DEFAULT 5,
  rating_count INT DEFAULT 0,
  
  completed_trips INT DEFAULT 0,
  cancelled_trips INT DEFAULT 0,
  
  online_hours INT DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Index for driver stats
CREATE INDEX IF NOT EXISTS idx_driver_stats_driver_id 
  ON driver_stats(driver_id);

-- ============================================================================
-- TABLE: driver_availability
-- Tracks driver online/offline status
-- ============================================================================
CREATE TABLE IF NOT EXISTS driver_availability (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  
  is_online BOOLEAN DEFAULT FALSE,
  current_location_lat NUMERIC,
  current_location_lng NUMERIC,
  service_types TEXT[], -- ['rides', 'delivery', 'food']
  
  last_seen_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Index for availability queries
CREATE INDEX IF NOT EXISTS idx_driver_availability_is_online 
  ON driver_availability(is_online);

-- ============================================================================
-- ENABLE ROW LEVEL SECURITY
-- ============================================================================
ALTER TABLE driver_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE trip_routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE driver_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE driver_availability ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================================================

-- driver_locations: Drivers can see their own location, passengers can see their current driver's location
CREATE POLICY driver_locations_select ON driver_locations
  FOR SELECT
  USING (
    auth.uid() = driver_id OR -- Driver can see own location
    auth.uid() IN (
      SELECT passenger_id FROM trips 
      WHERE driver_id = driver_locations.driver_id 
      AND status IN ('arriving', 'in_progress')
    ) -- Passenger can see current driver's location
  );

CREATE POLICY driver_locations_update ON driver_locations
  FOR UPDATE
  USING (auth.uid() = driver_id);

-- trips: Users can see trips they're involved in
CREATE POLICY trips_select ON trips
  FOR SELECT
  USING (auth.uid() = driver_id OR auth.uid() = passenger_id);

CREATE POLICY trips_insert ON trips
  FOR INSERT
  WITH CHECK (auth.uid() = passenger_id OR auth.uid() = driver_id);

CREATE POLICY trips_update ON trips
  FOR UPDATE
  USING (auth.uid() = driver_id OR auth.uid() = passenger_id);

-- trip_routes: Users can see routes for trips they're involved in
CREATE POLICY trip_routes_select ON trip_routes
  FOR SELECT
  USING (
    trip_id IN (
      SELECT id FROM trips 
      WHERE driver_id = auth.uid() OR passenger_id = auth.uid()
    )
  );

-- driver_stats: Public read, users can only update their own
CREATE POLICY driver_stats_select ON driver_stats
  FOR SELECT
  USING (true); -- Public stats

CREATE POLICY driver_stats_update ON driver_stats
  FOR UPDATE
  USING (auth.uid() = driver_id);

-- driver_availability: Public read (for finding drivers), drivers can update own
CREATE POLICY driver_availability_select ON driver_availability
  FOR SELECT
  USING (true); -- Public for finding drivers

CREATE POLICY driver_availability_update ON driver_availability
  FOR UPDATE
  USING (auth.uid() = driver_id);

CREATE POLICY driver_availability_insert ON driver_availability
  FOR INSERT
  WITH CHECK (auth.uid() = driver_id);

-- ============================================================================
-- TRIGGERS FOR UPDATED_AT
-- ============================================================================
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER driver_locations_update_timestamp
BEFORE UPDATE ON driver_locations
FOR EACH ROW
EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER trips_update_timestamp
BEFORE UPDATE ON trips
FOR EACH ROW
EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER driver_stats_update_timestamp
BEFORE UPDATE ON driver_stats
FOR EACH ROW
EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER driver_availability_update_timestamp
BEFORE UPDATE ON driver_availability
FOR EACH ROW
EXECUTE FUNCTION update_timestamp();

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================
