-- ============================================================
-- SportSync Views
-- Pre-defined queries for analytics and reporting
-- ============================================================

USE sportsync;

DROP VIEW IF EXISTS v_leaderboard;
DROP VIEW IF EXISTS v_recent_matches;
DROP VIEW IF EXISTS v_venue_availability;
DROP VIEW IF EXISTS v_player_summary;

-- ============================================================
-- VIEW 1: Leaderboard
-- Ranks players by skill rating, wins, and win percentage
-- ============================================================
CREATE VIEW v_leaderboard AS
SELECT 
    p.player_id,
    u.name AS player_name,
    p.skill_rating,
    p.wins,
    p.losses,
    p.draws,
    (p.wins + p.losses + p.draws) AS total_matches,
    CASE 
        WHEN (p.wins + p.losses + p.draws) > 0 
        THEN ROUND(p.wins * 100.0 / (p.wins + p.losses + p.draws), 1)
        ELSE 0 
    END AS win_percentage,
    p.sport_preference,
    p.location,
    RANK() OVER (ORDER BY p.skill_rating DESC) AS `rank`
FROM players p
JOIN users u ON p.player_id = u.user_id
ORDER BY p.skill_rating DESC;

-- ============================================================
-- VIEW 2: Recent Matches
-- Last 50 matches with player names and venue details
-- ============================================================
CREATE VIEW v_recent_matches AS
SELECT 
    m.match_id,
    m.match_date,
    m.sport,
    u1.name AS player1_name,
    p1.skill_rating AS player1_rating,
    u2.name AS player2_name,
    p2.skill_rating AS player2_rating,
    v.name AS venue_name,
    m.result,
    m.score,
    m.status
FROM matches m
JOIN users u1 ON m.player1_id = u1.user_id
JOIN users u2 ON m.player2_id = u2.user_id
JOIN players p1 ON m.player1_id = p1.player_id
JOIN players p2 ON m.player2_id = p2.player_id
LEFT JOIN venues v ON m.venue_id = v.venue_id
ORDER BY m.match_date DESC, m.created_at DESC
LIMIT 50;

-- ============================================================
-- VIEW 3: Venue Availability Summary
-- Shows resources with their booking count for today
-- ============================================================
CREATE VIEW v_venue_availability AS
SELECT 
    v.venue_id,
    v.name AS venue_name,
    v.city,
    v.location,
    r.resource_id,
    r.name AS resource_name,
    r.type AS resource_type,
    r.sport_type,
    r.price_per_hour,
    r.is_available,
    (
        SELECT COUNT(*) 
        FROM bookings b 
        WHERE b.resource_id = r.resource_id 
          AND b.booking_date = CURDATE()
          AND b.status = 'confirmed'
    ) AS bookings_today
FROM venues v
JOIN resources r ON v.venue_id = r.venue_id
WHERE v.is_active = TRUE;

-- ============================================================
-- VIEW 4: Player Summary with Rank
-- Used for player profiles and dashboards
-- ============================================================
CREATE VIEW v_player_summary AS
SELECT 
    p.player_id,
    u.name,
    u.email,
    p.skill_rating,
    p.wins,
    p.losses,
    p.draws,
    p.sport_preference,
    p.location,
    p.age,
    p.gender,
    (p.wins + p.losses + p.draws) AS total_matches,
    CASE 
        WHEN (p.wins + p.losses + p.draws) > 0 
        THEN ROUND(p.wins * 100.0 / (p.wins + p.losses + p.draws), 1)
        ELSE 0 
    END AS win_percentage,
    (
        SELECT COUNT(*) 
        FROM bookings b 
        WHERE b.player_id = p.player_id 
          AND b.status = 'confirmed'
          AND b.booking_date >= CURDATE()
    ) AS upcoming_bookings
FROM players p
JOIN users u ON p.player_id = u.user_id;

SELECT '✅ Views created successfully!' AS status;
