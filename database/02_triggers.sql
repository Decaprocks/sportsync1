-- ============================================================
-- SportSync Triggers
-- Implements business rules via database-level enforcement
-- ============================================================

USE sportsync;

-- Drop existing triggers
DROP TRIGGER IF EXISTS trg_check_eligibility;
DROP TRIGGER IF EXISTS trg_update_elo_after_result;
DROP TRIGGER IF EXISTS trg_prevent_double_booking;

-- ============================================================
-- TRIGGER 1: Check Eligibility Before Match Creation
-- Rule: Beginner (<1000) cannot face Pro (>2000)
-- Rule: Players must have same sport preference
-- ============================================================
DELIMITER //

CREATE TRIGGER trg_check_eligibility
BEFORE INSERT ON matches
FOR EACH ROW
BEGIN
    DECLARE p1_rating INT;
    DECLARE p2_rating INT;
    DECLARE p1_sport VARCHAR(50);
    DECLARE p2_sport VARCHAR(50);
    
    -- Get player ratings and sport preferences
    SELECT skill_rating, sport_preference INTO p1_rating, p1_sport 
    FROM players WHERE player_id = NEW.player1_id;
    
    SELECT skill_rating, sport_preference INTO p2_rating, p2_sport 
    FROM players WHERE player_id = NEW.player2_id;
    
    -- Rule 1: Skill gap check (Beginner vs Pro)
    IF (p1_rating < 1000 AND p2_rating > 2000) OR 
       (p2_rating < 1000 AND p1_rating > 2000) THEN
        SIGNAL SQLSTATE '45000' 
        SET MESSAGE_TEXT = 'ELIGIBILITY ERROR: Beginner (rating < 1000) cannot compete against Pro (rating > 2000). Skill gap too large.';
    END IF;
    
    -- Rule 2: Same sport preference (unless match sport is specified)
    IF p1_sport != 'general' AND p2_sport != 'general' AND p1_sport != p2_sport THEN
        SIGNAL SQLSTATE '45000' 
        SET MESSAGE_TEXT = 'ELIGIBILITY ERROR: Players must have the same sport preference for matchmaking.';
    END IF;
END //

DELIMITER ;

-- ============================================================
-- TRIGGER 2: Update ELO Ratings After Match Result
-- Calls the Update_ELO procedure when match result is set
-- ============================================================
DELIMITER //

CREATE TRIGGER trg_update_elo_after_result
AFTER UPDATE ON matches
FOR EACH ROW
BEGIN
    -- Only fire when result changes from pending to an actual result
    IF OLD.result = 'pending' AND NEW.result != 'pending' AND NEW.result != 'cancelled' THEN
        CALL Update_ELO(NEW.match_id);
    END IF;
END //

DELIMITER ;

-- ============================================================
-- TRIGGER 3: Prevent Double Booking
-- Checks for time overlap on the same resource + date
-- ============================================================
DELIMITER //

CREATE TRIGGER trg_prevent_double_booking
BEFORE INSERT ON bookings
FOR EACH ROW
BEGIN
    DECLARE overlap_count INT;
    
    -- Check for overlapping bookings on same resource and date
    SELECT COUNT(*) INTO overlap_count
    FROM bookings
    WHERE resource_id = NEW.resource_id
      AND booking_date = NEW.booking_date
      AND status IN ('confirmed', 'pending')
      AND (
          (NEW.start_time >= start_time AND NEW.start_time < end_time) OR
          (NEW.end_time > start_time AND NEW.end_time <= end_time) OR
          (NEW.start_time <= start_time AND NEW.end_time >= end_time)
      );
    
    IF overlap_count > 0 THEN
        SIGNAL SQLSTATE '45000' 
        SET MESSAGE_TEXT = 'BOOKING ERROR: This time slot is already booked. Double booking prevented.';
    END IF;
    
    -- Validate booking date is not in the past
    IF NEW.booking_date < CURDATE() THEN
        SIGNAL SQLSTATE '45000' 
        SET MESSAGE_TEXT = 'BOOKING ERROR: Cannot book for a past date.';
    END IF;
END //

DELIMITER ;

SELECT '✅ Triggers created successfully!' AS status;
