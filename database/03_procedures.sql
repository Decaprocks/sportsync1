-- ============================================================
-- SportSync Stored Procedures
-- Business logic implemented at database level
-- ============================================================

USE sportsync;

DROP PROCEDURE IF EXISTS Update_ELO;
DROP PROCEDURE IF EXISTS Book_Resource;
DROP PROCEDURE IF EXISTS Get_Nearby_Players;
DROP PROCEDURE IF EXISTS Get_Player_Stats;

-- ============================================================
-- PROCEDURE 1: Update_ELO
-- ELO Rating Formula: R_new = R_old + K × (Actual − Expected)
-- K = 32 (standard for new/casual players)
-- Expected = 1 / (1 + 10^((R_opponent - R_self) / 400))
-- ============================================================
DELIMITER //

CREATE PROCEDURE Update_ELO(IN p_match_id INT)
BEGIN
    DECLARE v_p1_id INT;
    DECLARE v_p2_id INT;
    DECLARE v_result VARCHAR(20);
    DECLARE v_p1_rating INT;
    DECLARE v_p2_rating INT;
    DECLARE v_p1_expected DECIMAL(10,4);
    DECLARE v_p2_expected DECIMAL(10,4);
    DECLARE v_p1_actual DECIMAL(10,4);
    DECLARE v_p2_actual DECIMAL(10,4);
    DECLARE v_p1_new_rating INT;
    DECLARE v_p2_new_rating INT;
    DECLARE v_K INT DEFAULT 32;
    
    -- Get match details
    SELECT player1_id, player2_id, result 
    INTO v_p1_id, v_p2_id, v_result
    FROM matches WHERE match_id = p_match_id;
    
    -- Get current ratings
    SELECT skill_rating INTO v_p1_rating FROM players WHERE player_id = v_p1_id;
    SELECT skill_rating INTO v_p2_rating FROM players WHERE player_id = v_p2_id;
    
    -- Calculate expected scores
    SET v_p1_expected = 1.0 / (1.0 + POW(10, (v_p2_rating - v_p1_rating) / 400.0));
    SET v_p2_expected = 1.0 / (1.0 + POW(10, (v_p1_rating - v_p2_rating) / 400.0));
    
    -- Determine actual scores based on result
    IF v_result = 'player1_win' THEN
        SET v_p1_actual = 1.0;
        SET v_p2_actual = 0.0;
    ELSEIF v_result = 'player2_win' THEN
        SET v_p1_actual = 0.0;
        SET v_p2_actual = 1.0;
    ELSE -- draw
        SET v_p1_actual = 0.5;
        SET v_p2_actual = 0.5;
    END IF;
    
    -- Calculate new ratings: R_new = R_old + K × (Actual − Expected)
    SET v_p1_new_rating = ROUND(v_p1_rating + v_K * (v_p1_actual - v_p1_expected));
    SET v_p2_new_rating = ROUND(v_p2_rating + v_K * (v_p2_actual - v_p2_expected));
    
    -- Minimum rating floor of 100
    IF v_p1_new_rating < 100 THEN SET v_p1_new_rating = 100; END IF;
    IF v_p2_new_rating < 100 THEN SET v_p2_new_rating = 100; END IF;
    
    -- Update player ratings
    UPDATE players SET skill_rating = v_p1_new_rating WHERE player_id = v_p1_id;
    UPDATE players SET skill_rating = v_p2_new_rating WHERE player_id = v_p2_id;
    
    -- Update win/loss/draw counts
    IF v_result = 'player1_win' THEN
        UPDATE players SET wins = wins + 1 WHERE player_id = v_p1_id;
        UPDATE players SET losses = losses + 1 WHERE player_id = v_p2_id;
    ELSEIF v_result = 'player2_win' THEN
        UPDATE players SET wins = wins + 1 WHERE player_id = v_p2_id;
        UPDATE players SET losses = losses + 1 WHERE player_id = v_p1_id;
    ELSE
        UPDATE players SET draws = draws + 1 WHERE player_id = v_p1_id;
        UPDATE players SET draws = draws + 1 WHERE player_id = v_p2_id;
    END IF;
    
    -- Log rating changes in match_history
    INSERT INTO match_history (match_id, player_id, old_rating, new_rating, rating_change)
    VALUES (p_match_id, v_p1_id, v_p1_rating, v_p1_new_rating, v_p1_new_rating - v_p1_rating);
    
    INSERT INTO match_history (match_id, player_id, old_rating, new_rating, rating_change)
    VALUES (p_match_id, v_p2_id, v_p2_rating, v_p2_new_rating, v_p2_new_rating - v_p2_rating);
    
    -- Update match status
    UPDATE matches SET status = 'completed' WHERE match_id = p_match_id;
    
END //

-- ============================================================
-- PROCEDURE 2: Book_Resource
-- Transaction-wrapped booking with concurrency control
-- Uses SELECT ... FOR UPDATE for row-level locking
-- Demonstrates ACID properties
-- ============================================================
CREATE PROCEDURE Book_Resource(
    IN p_resource_id INT,
    IN p_player_id INT,
    IN p_date DATE,
    IN p_start TIME,
    IN p_end TIME,
    OUT p_booking_id INT,
    OUT p_status VARCHAR(100)
)
proc_label: BEGIN
    DECLARE v_overlap INT DEFAULT 0;
    DECLARE v_resource_exists INT DEFAULT 0;
    DECLARE v_is_available BOOLEAN;
    DECLARE v_price DECIMAL(10,2);
    DECLARE v_hours DECIMAL(5,2);
    DECLARE v_total DECIMAL(10,2);
    
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        SET p_booking_id = 0;
        SET p_status = 'ERROR: Transaction rolled back due to conflict';
    END;
    
    START TRANSACTION;
    
    -- Lock the resource row (Concurrency Control)
    SELECT COUNT(*), is_available, price_per_hour 
    INTO v_resource_exists, v_is_available, v_price
    FROM resources 
    WHERE resource_id = p_resource_id 
    FOR UPDATE;
    
    -- Validate resource exists
    IF v_resource_exists = 0 THEN
        SET p_status = 'ERROR: Resource not found';
        ROLLBACK;
        LEAVE proc_label;
    END IF;
    
    -- Validate resource is available
    IF v_is_available = FALSE THEN
        SET p_status = 'ERROR: Resource is not available';
        ROLLBACK;
        LEAVE proc_label;
    END IF;
    
    -- Check for overlapping bookings (Double Booking Prevention)
    SELECT COUNT(*) INTO v_overlap
    FROM bookings
    WHERE resource_id = p_resource_id
      AND booking_date = p_date
      AND status IN ('confirmed', 'pending')
      AND (
          (p_start >= start_time AND p_start < end_time) OR
          (p_end > start_time AND p_end <= end_time) OR
          (p_start <= start_time AND p_end >= end_time)
      )
    FOR UPDATE;
    
    IF v_overlap > 0 THEN
        SET p_status = 'ERROR: Time slot already booked (double booking prevented)';
        ROLLBACK;
        LEAVE proc_label;
    END IF;
    
    -- Calculate total price
    SET v_hours = TIMESTAMPDIFF(MINUTE, p_start, p_end) / 60.0;
    SET v_total = v_price * v_hours;
    
    -- Insert booking (ACID - Atomicity)
    INSERT INTO bookings (resource_id, player_id, booking_date, start_time, end_time, status, total_price)
    VALUES (p_resource_id, p_player_id, p_date, p_start, p_end, 'confirmed', v_total);
    
    SET p_booking_id = LAST_INSERT_ID();
    SET p_status = 'SUCCESS: Booking confirmed';
    
    -- COMMIT transaction (ACID - Durability)
    COMMIT;
    
END //

-- ============================================================
-- PROCEDURE 3: Get Nearby Players for Matchmaking
-- ============================================================
CREATE PROCEDURE Get_Nearby_Players(
    IN p_location VARCHAR(200),
    IN p_sport VARCHAR(50),
    IN p_player_id INT
)
BEGIN
    SELECT 
        p.player_id,
        u.name,
        p.skill_rating,
        p.location,
        p.sport_preference,
        p.wins,
        p.losses,
        p.gender,
        p.age
    FROM players p
    JOIN users u ON p.player_id = u.user_id
    WHERE p.player_id != p_player_id
      AND (p.location LIKE CONCAT('%', p_location, '%') OR p_location IS NULL)
      AND (p.sport_preference = p_sport OR p.sport_preference = 'general' OR p_sport = 'general')
    ORDER BY ABS(p.skill_rating - (SELECT skill_rating FROM players WHERE player_id = p_player_id)) ASC
    LIMIT 20;
END //

-- ============================================================
-- PROCEDURE 4: Get Player Statistics
-- ============================================================
CREATE PROCEDURE Get_Player_Stats(IN p_player_id INT)
BEGIN
    -- Player info
    SELECT 
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
        CASE WHEN (p.wins + p.losses + p.draws) > 0 
             THEN ROUND(p.wins * 100.0 / (p.wins + p.losses + p.draws), 1)
             ELSE 0 
        END AS win_percentage
    FROM players p
    JOIN users u ON p.player_id = u.user_id
    WHERE p.player_id = p_player_id;
    
    -- Recent rating history
    SELECT old_rating, new_rating, rating_change, recorded_at
    FROM match_history
    WHERE player_id = p_player_id
    ORDER BY recorded_at DESC
    LIMIT 10;
END //

DELIMITER ;

SELECT '✅ Stored procedures created successfully!' AS status;
