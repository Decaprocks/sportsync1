-- ============================================================
-- SportSync Indexes
-- B-Tree Indexes for Query Optimization
-- ============================================================

USE sportsync;

-- ============================================================
-- Note: Many indexes are already created in the schema (01_schema.sql)
-- This file creates additional composite and covering indexes
-- for frequently executed queries and query optimization
-- ============================================================

-- Composite index for booking searches (resource + date + time)
CREATE INDEX idx_booking_resource_datetime 
ON bookings (resource_id, booking_date, start_time, end_time);

-- Composite index for player matchmaking queries
CREATE INDEX idx_player_sport_rating 
ON players (sport_preference, skill_rating);

-- Composite index for match lookups by player
CREATE INDEX idx_match_player1_date 
ON matches (player1_id, match_date);

CREATE INDEX idx_match_player2_date 
ON matches (player2_id, match_date);

-- Index for match result filtering
CREATE INDEX idx_match_status_result 
ON matches (status, result);

-- Index for venue search by city and rating
CREATE INDEX idx_venue_city_rating 
ON venues (city, rating);

-- Index for booking status filtering
CREATE INDEX idx_booking_status 
ON bookings (status);

-- Index for match history timeline
CREATE INDEX idx_history_recorded 
ON match_history (recorded_at);

SELECT '✅ Additional indexes created successfully!' AS status;
