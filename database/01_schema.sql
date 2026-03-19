-- ============================================================
-- SportSync Database Schema
-- EER Model with Specialization/Generalization
-- Normalized to BCNF
-- ============================================================

CREATE DATABASE IF NOT EXISTS sportsync;
USE sportsync;

-- Drop existing tables (in reverse dependency order)
DROP TABLE IF EXISTS match_history;
DROP TABLE IF EXISTS matches;
DROP TABLE IF EXISTS bookings;
DROP TABLE IF EXISTS resources;
DROP TABLE IF EXISTS venues;
DROP TABLE IF EXISTS players;
DROP TABLE IF EXISTS venue_managers;
DROP TABLE IF EXISTS users;

-- ============================================================
-- SUPERCLASS: Users (Generalization Entity)
-- ============================================================
CREATE TABLE users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('player', 'venue_manager', 'admin') NOT NULL DEFAULT 'player',
    phone VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_users_email (email),
    INDEX idx_users_role (role)
) ENGINE=InnoDB;

-- ============================================================
-- SUBCLASS: Players (Specialization of Users)
-- EER: Total, Disjoint Specialization
-- ============================================================
CREATE TABLE players (
    player_id INT PRIMARY KEY,
    age INT CHECK (age >= 10 AND age <= 100),
    gender ENUM('male', 'female', 'other') NOT NULL DEFAULT 'other',
    skill_rating INT NOT NULL DEFAULT 1200,
    location VARCHAR(200),
    sport_preference VARCHAR(50) NOT NULL DEFAULT 'general',
    wins INT DEFAULT 0,
    losses INT DEFAULT 0,
    draws INT DEFAULT 0,
    bio TEXT,
    
    CONSTRAINT fk_player_user FOREIGN KEY (player_id) 
        REFERENCES users(user_id) ON DELETE CASCADE ON UPDATE CASCADE,
    
    INDEX idx_players_rating (skill_rating),
    INDEX idx_players_location (location),
    INDEX idx_players_sport (sport_preference)
) ENGINE=InnoDB;

-- ============================================================
-- SUBCLASS: Venue Managers (Specialization of Users)
-- ============================================================
CREATE TABLE venue_managers (
    manager_id INT PRIMARY KEY,
    license_no VARCHAR(100),
    bank_details VARCHAR(255),
    organization VARCHAR(200),
    
    CONSTRAINT fk_manager_user FOREIGN KEY (manager_id) 
        REFERENCES users(user_id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB;

-- ============================================================
-- Venues Entity
-- ============================================================
CREATE TABLE venues (
    venue_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    location VARCHAR(300) NOT NULL,
    city VARCHAR(100) NOT NULL,
    description TEXT,
    owner_id INT NOT NULL,
    contact_phone VARCHAR(20),
    opening_time TIME DEFAULT '06:00:00',
    closing_time TIME DEFAULT '22:00:00',
    rating DECIMAL(3,2) DEFAULT 0.00,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_venue_owner FOREIGN KEY (owner_id) 
        REFERENCES venue_managers(manager_id) ON DELETE RESTRICT ON UPDATE CASCADE,
    
    INDEX idx_venues_city (city),
    INDEX idx_venues_owner (owner_id)
) ENGINE=InnoDB;

-- ============================================================
-- Resources (Courts, Turfs, Tables within Venues)
-- ============================================================
CREATE TABLE resources (
    resource_id INT AUTO_INCREMENT PRIMARY KEY,
    venue_id INT NOT NULL,
    name VARCHAR(100) NOT NULL,
    type ENUM('court', 'turf', 'table', 'pool', 'track', 'ring') NOT NULL,
    sport_type VARCHAR(50) NOT NULL,
    capacity INT DEFAULT 2,
    price_per_hour DECIMAL(10,2) DEFAULT 0.00,
    is_available BOOLEAN DEFAULT TRUE,
    
    CONSTRAINT fk_resource_venue FOREIGN KEY (venue_id) 
        REFERENCES venues(venue_id) ON DELETE CASCADE ON UPDATE CASCADE,
    
    CONSTRAINT chk_capacity CHECK (capacity >= 1),
    CONSTRAINT chk_price CHECK (price_per_hour >= 0),
    
    INDEX idx_resources_venue (venue_id),
    INDEX idx_resources_sport (sport_type)
) ENGINE=InnoDB;

-- ============================================================
-- Bookings (Venue Resource Reservations)
-- ============================================================
CREATE TABLE bookings (
    booking_id INT AUTO_INCREMENT PRIMARY KEY,
    resource_id INT NOT NULL,
    player_id INT NOT NULL,
    booking_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    status ENUM('confirmed', 'cancelled', 'completed', 'pending') DEFAULT 'confirmed',
    total_price DECIMAL(10,2) DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_booking_resource FOREIGN KEY (resource_id) 
        REFERENCES resources(resource_id) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_booking_player FOREIGN KEY (player_id) 
        REFERENCES players(player_id) ON DELETE CASCADE ON UPDATE CASCADE,
    
    CONSTRAINT chk_time_order CHECK (end_time > start_time),
    
    INDEX idx_bookings_date (booking_date),
    INDEX idx_bookings_resource_date (resource_id, booking_date),
    INDEX idx_bookings_player (player_id)
) ENGINE=InnoDB;

-- ============================================================
-- Matches (Player vs Player)
-- ============================================================
CREATE TABLE matches (
    match_id INT AUTO_INCREMENT PRIMARY KEY,
    player1_id INT NOT NULL,
    player2_id INT NOT NULL,
    sport VARCHAR(50) NOT NULL,
    venue_id INT,
    booking_id INT,
    match_date DATE NOT NULL,
    result ENUM('player1_win', 'player2_win', 'draw', 'pending') DEFAULT 'pending',
    score VARCHAR(50),
    status ENUM('scheduled', 'in_progress', 'completed', 'cancelled') DEFAULT 'scheduled',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_match_player1 FOREIGN KEY (player1_id) 
        REFERENCES players(player_id) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_match_player2 FOREIGN KEY (player2_id) 
        REFERENCES players(player_id) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_match_venue FOREIGN KEY (venue_id) 
        REFERENCES venues(venue_id) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_match_booking FOREIGN KEY (booking_id)
        REFERENCES bookings(booking_id) ON DELETE SET NULL ON UPDATE CASCADE,
    
    CONSTRAINT chk_different_players CHECK (player1_id != player2_id),
    
    INDEX idx_matches_date (match_date),
    INDEX idx_matches_players (player1_id, player2_id),
    INDEX idx_matches_sport (sport)
) ENGINE=InnoDB;

-- ============================================================
-- Match History (ELO Rating Change Log)
-- ============================================================
CREATE TABLE match_history (
    history_id INT AUTO_INCREMENT PRIMARY KEY,
    match_id INT NOT NULL,
    player_id INT NOT NULL,
    old_rating INT NOT NULL,
    new_rating INT NOT NULL,
    rating_change INT NOT NULL,
    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_history_match FOREIGN KEY (match_id) 
        REFERENCES matches(match_id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_history_player FOREIGN KEY (player_id) 
        REFERENCES players(player_id) ON DELETE CASCADE ON UPDATE CASCADE,
    
    INDEX idx_history_match (match_id),
    INDEX idx_history_player (player_id)
) ENGINE=InnoDB;

SELECT '✅ Schema created successfully!' AS status;
