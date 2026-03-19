-- ============================================================
-- SportSync Sample/Seed Data
-- Provides realistic test data for all tables
-- ============================================================

USE sportsync;

-- ============================================================
-- Users (Superclass)
-- Passwords are bcrypt hash of 'password123'
-- ============================================================
INSERT INTO users (name, email, password_hash, role, phone) VALUES
('Arjun Mehta', 'arjun@email.com', '$2a$10$Kp3.K0P5hyBDT/YRNlBsJOLX7P3t1Y5rDoGKjK6P6n94Zz8rGwbSW', 'player', '9876543210'),
('Priya Sharma', 'priya@email.com', '$2a$10$Kp3.K0P5hyBDT/YRNlBsJOLX7P3t1Y5rDoGKjK6P6n94Zz8rGwbSW', 'player', '9876543211'),
('Rahul Kumar', 'rahul@email.com', '$2a$10$Kp3.K0P5hyBDT/YRNlBsJOLX7P3t1Y5rDoGKjK6P6n94Zz8rGwbSW', 'player', '9876543212'),
('Sneha Patel', 'sneha@email.com', '$2a$10$Kp3.K0P5hyBDT/YRNlBsJOLX7P3t1Y5rDoGKjK6P6n94Zz8rGwbSW', 'player', '9876543213'),
('Vikram Singh', 'vikram@email.com', '$2a$10$Kp3.K0P5hyBDT/YRNlBsJOLX7P3t1Y5rDoGKjK6P6n94Zz8rGwbSW', 'player', '9876543214'),
('Ananya Reddy', 'ananya@email.com', '$2a$10$Kp3.K0P5hyBDT/YRNlBsJOLX7P3t1Y5rDoGKjK6P6n94Zz8rGwbSW', 'player', '9876543215'),
('Karan Joshi', 'karan@email.com', '$2a$10$Kp3.K0P5hyBDT/YRNlBsJOLX7P3t1Y5rDoGKjK6P6n94Zz8rGwbSW', 'player', '9876543216'),
('Meera Nair', 'meera@email.com', '$2a$10$Kp3.K0P5hyBDT/YRNlBsJOLX7P3t1Y5rDoGKjK6P6n94Zz8rGwbSW', 'player', '9876543217'),
('Rohan Gupta', 'rohan@email.com', '$2a$10$Kp3.K0P5hyBDT/YRNlBsJOLX7P3t1Y5rDoGKjK6P6n94Zz8rGwbSW', 'player', '9876543218'),
('Divya Iyer', 'divya@email.com', '$2a$10$Kp3.K0P5hyBDT/YRNlBsJOLX7P3t1Y5rDoGKjK6P6n94Zz8rGwbSW', 'player', '9876543219'),
('Rajesh Venkatesh', 'rajesh@email.com', '$2a$10$Kp3.K0P5hyBDT/YRNlBsJOLX7P3t1Y5rDoGKjK6P6n94Zz8rGwbSW', 'venue_manager', '9876543220'),
('Sunita Aggarwal', 'sunita@email.com', '$2a$10$Kp3.K0P5hyBDT/YRNlBsJOLX7P3t1Y5rDoGKjK6P6n94Zz8rGwbSW', 'venue_manager', '9876543221'),
('Amit Deshmukh', 'amit@email.com', '$2a$10$Kp3.K0P5hyBDT/YRNlBsJOLX7P3t1Y5rDoGKjK6P6n94Zz8rGwbSW', 'venue_manager', '9876543222'),
('SportSync Admin', 'admin@sportsync.com', '$2a$10$Kp3.K0P5hyBDT/YRNlBsJOLX7P3t1Y5rDoGKjK6P6n94Zz8rGwbSW', 'admin', '9876543200');

-- ============================================================
-- Players (Subclass with varying ELO ratings)
-- ============================================================
INSERT INTO players (player_id, age, gender, skill_rating, location, sport_preference, wins, losses, draws, bio) VALUES
(1, 24, 'male', 1650, 'Mumbai', 'badminton', 28, 12, 3, 'Competitive badminton player with 5 years experience'),
(2, 22, 'female', 1420, 'Delhi', 'tennis', 18, 15, 2, 'Tennis enthusiast, university champion 2024'),
(3, 27, 'male', 1890, 'Bangalore', 'badminton', 45, 8, 5, 'Semi-pro badminton player, state level'),
(4, 21, 'female', 1250, 'Mumbai', 'table_tennis', 12, 10, 4, 'Rising table tennis player'),
(5, 30, 'male', 2100, 'Chennai', 'tennis', 62, 15, 3, 'Pro tennis player, national ranking'),
(6, 19, 'female', 980, 'Pune', 'badminton', 5, 8, 1, 'Beginner badminton, learning fast'),
(7, 26, 'male', 1550, 'Hyderabad', 'football', 22, 14, 6, 'Football midfielder, weekend league'),
(8, 23, 'female', 1380, 'Kolkata', 'tennis', 16, 12, 3, 'Tennis player with good backhand'),
(9, 28, 'male', 1720, 'Delhi', 'football', 35, 18, 4, 'Football striker, corporate league champion'),
(10, 25, 'female', 1100, 'Bangalore', 'table_tennis', 8, 14, 2, 'Casual table tennis player');

-- ============================================================
-- Venue Managers (Subclass)
-- ============================================================
INSERT INTO venue_managers (manager_id, license_no, bank_details, organization) VALUES
(11, 'LIC-MH-2024-001', 'HDFC-XXXX-1234', 'SportZone Enterprises'),
(12, 'LIC-DL-2024-002', 'SBI-XXXX-5678', 'PlayField India'),
(13, 'LIC-KA-2024-003', 'ICICI-XXXX-9012', 'Arena Sports Pvt Ltd');

-- ============================================================
-- Venues
-- ============================================================
INSERT INTO venues (name, location, city, description, owner_id, contact_phone, opening_time, closing_time, rating) VALUES
('SportZone Arena', 'Andheri West, Near Metro Station', 'Mumbai', 'Premium multi-sport complex with AC courts and professional coaching facilities', 11, '022-12345678', '06:00:00', '23:00:00', 4.5),
('PlayField Delhi', 'Connaught Place, Block C', 'Delhi', 'Central Delhi sports hub with tennis courts and indoor badminton halls', 12, '011-87654321', '05:30:00', '22:00:00', 4.2),
('Arena Sports Hub', 'Koramangala, 4th Block', 'Bangalore', 'Modern sports facility with football turfs and table tennis rooms', 13, '080-11223344', '06:00:00', '22:30:00', 4.7),
('Green Turf Mumbai', 'Powai, Near IIT', 'Mumbai', 'Lush green football turfs with floodlights for night matches', 11, '022-55667788', '07:00:00', '23:00:00', 4.3),
('Ace Tennis Academy', 'Jubilee Hills', 'Hyderabad', 'Professional tennis coaching with clay and hard courts', 12, '040-99887766', '06:00:00', '21:00:00', 4.6);

-- ============================================================
-- Resources (Courts/Turfs/Tables)
-- ============================================================
INSERT INTO resources (venue_id, name, type, sport_type, capacity, price_per_hour, is_available) VALUES
-- SportZone Arena (Mumbai)
(1, 'Badminton Court A', 'court', 'badminton', 4, 500.00, TRUE),
(1, 'Badminton Court B', 'court', 'badminton', 4, 500.00, TRUE),
(1, 'Tennis Court 1', 'court', 'tennis', 4, 800.00, TRUE),
(1, 'Table Tennis Room', 'table', 'table_tennis', 2, 300.00, TRUE),
-- PlayField Delhi
(2, 'Tennis Court Alpha', 'court', 'tennis', 4, 750.00, TRUE),
(2, 'Tennis Court Beta', 'court', 'tennis', 4, 750.00, TRUE),
(2, 'Badminton Hall 1', 'court', 'badminton', 4, 450.00, TRUE),
(2, 'Badminton Hall 2', 'court', 'badminton', 4, 450.00, TRUE),
-- Arena Sports Hub (Bangalore)
(3, 'Football Turf A', 'turf', 'football', 14, 2000.00, TRUE),
(3, 'Football Turf B', 'turf', 'football', 14, 2000.00, TRUE),
(3, 'TT Room 1', 'table', 'table_tennis', 2, 250.00, TRUE),
(3, 'TT Room 2', 'table', 'table_tennis', 2, 250.00, TRUE),
-- Green Turf Mumbai
(4, 'Main Turf (5-a-side)', 'turf', 'football', 10, 1500.00, TRUE),
(4, 'Mini Turf (3-a-side)', 'turf', 'football', 6, 1000.00, TRUE),
-- Ace Tennis Academy
(5, 'Clay Court 1', 'court', 'tennis', 4, 900.00, TRUE),
(5, 'Hard Court 1', 'court', 'tennis', 4, 850.00, TRUE);

-- ============================================================
-- Bookings (sample confirmed bookings)
-- ============================================================
INSERT INTO bookings (resource_id, player_id, booking_date, start_time, end_time, status, total_price) VALUES
(1, 1, CURDATE(), '10:00:00', '11:00:00', 'confirmed', 500.00),
(1, 3, CURDATE(), '14:00:00', '15:30:00', 'confirmed', 750.00),
(3, 2, CURDATE(), '09:00:00', '10:00:00', 'confirmed', 800.00),
(5, 5, CURDATE(), '16:00:00', '18:00:00', 'confirmed', 1500.00),
(9, 7, CURDATE(), '18:00:00', '19:00:00', 'confirmed', 2000.00),
(1, 1, DATE_ADD(CURDATE(), INTERVAL 1 DAY), '10:00:00', '11:00:00', 'confirmed', 500.00),
(2, 3, DATE_ADD(CURDATE(), INTERVAL 1 DAY), '11:00:00', '12:00:00', 'confirmed', 500.00),
(5, 8, DATE_ADD(CURDATE(), INTERVAL 1 DAY), '09:00:00', '11:00:00', 'confirmed', 1500.00),
(9, 9, DATE_ADD(CURDATE(), INTERVAL 2 DAY), '17:00:00', '18:00:00', 'confirmed', 2000.00),
(11, 4, DATE_ADD(CURDATE(), INTERVAL 2 DAY), '15:00:00', '16:00:00', 'confirmed', 250.00),
(15, 5, DATE_ADD(CURDATE(), INTERVAL 3 DAY), '08:00:00', '10:00:00', 'confirmed', 1800.00),
(13, 7, DATE_ADD(CURDATE(), INTERVAL 3 DAY), '19:00:00', '20:00:00', 'confirmed', 1500.00);

-- ============================================================
-- Matches (with results for ELO demonstration)
-- ============================================================
INSERT INTO matches (player1_id, player2_id, sport, venue_id, booking_id, match_date, result, score, status) VALUES
(1, 3, 'badminton', 1, 1, DATE_SUB(CURDATE(), INTERVAL 10 DAY), 'player2_win', '21-15, 21-18', 'completed'),
(1, 3, 'badminton', 1, NULL, DATE_SUB(CURDATE(), INTERVAL 7 DAY), 'player1_win', '21-19, 18-21, 21-17', 'completed'),
(2, 8, 'tennis', 2, NULL, DATE_SUB(CURDATE(), INTERVAL 8 DAY), 'player1_win', '6-4, 7-5', 'completed'),
(2, 5, 'tennis', 5, NULL, DATE_SUB(CURDATE(), INTERVAL 5 DAY), 'player2_win', '3-6, 2-6', 'completed'),
(5, 8, 'tennis', 5, NULL, DATE_SUB(CURDATE(), INTERVAL 4 DAY), 'player1_win', '6-2, 6-3', 'completed'),
(4, 10, 'table_tennis', 3, NULL, DATE_SUB(CURDATE(), INTERVAL 6 DAY), 'player1_win', '11-8, 11-6, 9-11, 11-7', 'completed'),
(7, 9, 'football', 3, NULL, DATE_SUB(CURDATE(), INTERVAL 3 DAY), 'draw', '3-3', 'completed'),
(1, 6, 'badminton', 1, NULL, DATE_SUB(CURDATE(), INTERVAL 2 DAY), 'player1_win', '21-10, 21-12', 'completed'),
(3, 1, 'badminton', 2, NULL, DATE_SUB(CURDATE(), INTERVAL 1 DAY), 'player1_win', '21-14, 21-16', 'completed'),
(7, 9, 'football', 4, NULL, CURDATE(), 'pending', NULL, 'scheduled'),
(2, 8, 'tennis', 2, NULL, DATE_ADD(CURDATE(), INTERVAL 1 DAY), 'pending', NULL, 'scheduled'),
(4, 10, 'table_tennis', 3, NULL, DATE_ADD(CURDATE(), INTERVAL 2 DAY), 'pending', NULL, 'scheduled');

-- ============================================================
-- Match History (ELO changes for completed matches)
-- ============================================================
INSERT INTO match_history (match_id, player_id, old_rating, new_rating, rating_change) VALUES
(1, 1, 1670, 1650, -20),
(1, 3, 1870, 1890, 20),
(2, 1, 1630, 1650, 20),
(2, 3, 1910, 1890, -20),
(3, 2, 1400, 1420, 20),
(3, 8, 1400, 1380, -20),
(4, 2, 1440, 1420, -20),
(4, 5, 2080, 2100, 20),
(5, 5, 2090, 2100, 10),
(5, 8, 1390, 1380, -10),
(6, 4, 1230, 1250, 20),
(6, 10, 1120, 1100, -20),
(7, 7, 1550, 1550, 0),
(7, 9, 1720, 1720, 0),
(8, 1, 1630, 1650, 20),
(8, 6, 1000, 980, -20);

SELECT '✅ Seed data inserted successfully!' AS status;
SELECT CONCAT(COUNT(*), ' users created') AS info FROM users;
SELECT CONCAT(COUNT(*), ' players created') AS info FROM players;
SELECT CONCAT(COUNT(*), ' venues created') AS info FROM venues;
SELECT CONCAT(COUNT(*), ' resources created') AS info FROM resources;
SELECT CONCAT(COUNT(*), ' bookings created') AS info FROM bookings;
SELECT CONCAT(COUNT(*), ' matches created') AS info FROM matches;
