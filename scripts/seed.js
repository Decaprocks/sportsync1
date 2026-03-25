/**
 * SportSync Seed Script
 * Populates MongoDB with demo data for testing
 * Run: node scripts/seed.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Venue = require('../models/Venue');
const Booking = require('../models/Booking');
const Match = require('../models/Match');
const Review = require('../models/Review');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/sportsync';

async function seed() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        // Clear existing data
        await Promise.all([
            User.deleteMany({}),
            Venue.deleteMany({}),
            Booking.deleteMany({}),
            Match.deleteMany({}),
            Review.deleteMany({})
        ]);
        console.log('🗑️  Cleared existing data');

        const passwordHash = await bcrypt.hash('password123', 10);

        // ── Create Users ──
        const admin = await User.create({
            name: 'Admin User',
            email: 'admin@sportsync.com',
            password_hash: passwordHash,
            role: 'admin',
            phone: '9999999999'
        });

        const manager1 = await User.create({
            name: 'Rajesh Kumar',
            email: 'rajesh@sportsync.com',
            password_hash: passwordHash,
            role: 'venue_manager',
            phone: '9876543210',
            license_no: 'LIC-001',
            organization: 'Kumar Sports Pvt Ltd'
        });

        const manager2 = await User.create({
            name: 'Priya Sharma',
            email: 'priya@sportsync.com',
            password_hash: passwordHash,
            role: 'venue_manager',
            phone: '9876543211',
            license_no: 'LIC-002',
            organization: 'Sharma Sports Arena'
        });

        const players = await User.insertMany([
            {
                name: 'Virat Singh',
                email: 'virat@sportsync.com',
                password_hash: passwordHash,
                role: 'player',
                phone: '9111111111',
                age: 25, gender: 'male', skill_rating: 1650, location: 'Mumbai',
                sport_preference: 'cricket', wins: 15, losses: 5, draws: 2, bio: 'Aggressive batsman'
            },
            {
                name: 'Sania Mirza',
                email: 'sania@sportsync.com',
                password_hash: passwordHash,
                role: 'player',
                phone: '9222222222',
                age: 22, gender: 'female', skill_rating: 1580, location: 'Hyderabad',
                sport_preference: 'tennis', wins: 12, losses: 6, draws: 1, bio: 'Power hitter'
            },
            {
                name: 'Rohit Patel',
                email: 'rohit@sportsync.com',
                password_hash: passwordHash,
                role: 'player',
                phone: '9333333333',
                age: 28, gender: 'male', skill_rating: 1520, location: 'Delhi',
                sport_preference: 'badminton', wins: 10, losses: 8, draws: 0, bio: 'Quick reflexes'
            },
            {
                name: 'Ananya Iyer',
                email: 'ananya@sportsync.com',
                password_hash: passwordHash,
                role: 'player',
                phone: '9444444444',
                age: 20, gender: 'female', skill_rating: 1480, location: 'Chennai',
                sport_preference: 'basketball', wins: 8, losses: 7, draws: 3, bio: 'Sharp shooter'
            },
            {
                name: 'Arjun Reddy',
                email: 'arjun@sportsync.com',
                password_hash: passwordHash,
                role: 'player',
                phone: '9555555555',
                age: 24, gender: 'male', skill_rating: 1420, location: 'Bangalore',
                sport_preference: 'football', wins: 7, losses: 9, draws: 4, bio: 'Solid defender'
            },
            {
                name: 'Meera Nair',
                email: 'meera@sportsync.com',
                password_hash: passwordHash,
                role: 'player',
                phone: '9666666666',
                age: 21, gender: 'female', skill_rating: 1350, location: 'Kochi',
                sport_preference: 'tennis', wins: 5, losses: 10, draws: 2, bio: 'Rising talent'
            },
            {
                name: 'Karan Malhotra',
                email: 'karan@sportsync.com',
                password_hash: passwordHash,
                role: 'player',
                phone: '9777777777',
                age: 26, gender: 'male', skill_rating: 1290, location: 'Pune',
                sport_preference: 'cricket', wins: 4, losses: 11, draws: 1, bio: 'Spin bowler'
            },
            {
                name: 'Divya Joshi',
                email: 'divya@sportsync.com',
                password_hash: passwordHash,
                role: 'player',
                phone: '9888888888',
                age: 23, gender: 'female', skill_rating: 1400, location: 'Mumbai',
                sport_preference: 'badminton', wins: 6, losses: 8, draws: 2, bio: 'Doubles specialist'
            }
        ]);

        console.log(`👥 Created ${players.length + 3} users (1 admin, 2 managers, ${players.length} players)`);

        // ── Create Venues with embedded Resources ──
        const venue1 = await Venue.create({
            name: 'Mumbai Sports Complex',
            location: 'Andheri West, Mumbai',
            city: 'Mumbai',
            description: 'Premier sports facility with multiple courts and turfs',
            owner_id: manager1._id,
            contact_phone: '022-12345678',
            opening_time: '06:00',
            closing_time: '22:00',
            rating: 4.5,
            resources: [
                { name: 'Cricket Turf A', type: 'turf', sport_type: 'cricket', capacity: 22, price_per_hour: 2000 },
                { name: 'Tennis Court 1', type: 'court', sport_type: 'tennis', capacity: 4, price_per_hour: 800 },
                { name: 'Tennis Court 2', type: 'court', sport_type: 'tennis', capacity: 4, price_per_hour: 800 },
                { name: 'Badminton Court', type: 'court', sport_type: 'badminton', capacity: 4, price_per_hour: 500 },
                { name: 'Basketball Court', type: 'court', sport_type: 'basketball', capacity: 10, price_per_hour: 1500 }
            ]
        });

        const venue2 = await Venue.create({
            name: 'Delhi Sports Arena',
            location: 'Connaught Place, Delhi',
            city: 'Delhi',
            description: 'State-of-the-art indoor facility',
            owner_id: manager2._id,
            contact_phone: '011-98765432',
            opening_time: '07:00',
            closing_time: '23:00',
            rating: 4.2,
            resources: [
                { name: 'Football Turf', type: 'turf', sport_type: 'football', capacity: 14, price_per_hour: 3000 },
                { name: 'Badminton Court A', type: 'court', sport_type: 'badminton', capacity: 4, price_per_hour: 600 },
                { name: 'Badminton Court B', type: 'court', sport_type: 'badminton', capacity: 4, price_per_hour: 600 },
                { name: 'Table Tennis Room', type: 'table', sport_type: 'table_tennis', capacity: 2, price_per_hour: 300 }
            ]
        });

        const venue3 = await Venue.create({
            name: 'Bangalore Champions Club',
            location: 'Koramangala, Bangalore',
            city: 'Bangalore',
            description: 'Community sports hub with professional coaching',
            owner_id: manager1._id,
            contact_phone: '080-55555555',
            opening_time: '05:30',
            closing_time: '21:30',
            rating: 4.7,
            resources: [
                { name: 'Cricket Net 1', type: 'turf', sport_type: 'cricket', capacity: 6, price_per_hour: 1000 },
                { name: 'Cricket Net 2', type: 'turf', sport_type: 'cricket', capacity: 6, price_per_hour: 1000 },
                { name: 'Swimming Pool', type: 'pool', sport_type: 'swimming', capacity: 20, price_per_hour: 400 }
            ]
        });

        console.log(`🏟️  Created ${3} venues with ${venue1.resources.length + venue2.resources.length + venue3.resources.length} resources`);

        // ── Create Bookings ──
        const bookings = await Booking.insertMany([
            {
                venue_id: venue1._id, resource_id: venue1.resources[0]._id,
                resource_name: 'Cricket Turf A', sport_type: 'cricket', resource_type: 'turf',
                venue_name: 'Mumbai Sports Complex', venue_city: 'Mumbai', venue_location: 'Andheri West, Mumbai',
                player_id: players[0]._id, player_name: 'Virat Singh',
                booking_date: '2026-03-27', start_time: '10:00', end_time: '12:00',
                total_price: 4000, status: 'confirmed'
            },
            {
                venue_id: venue1._id, resource_id: venue1.resources[1]._id,
                resource_name: 'Tennis Court 1', sport_type: 'tennis', resource_type: 'court',
                venue_name: 'Mumbai Sports Complex', venue_city: 'Mumbai', venue_location: 'Andheri West, Mumbai',
                player_id: players[1]._id, player_name: 'Sania Mirza',
                booking_date: '2026-03-27', start_time: '14:00', end_time: '16:00',
                total_price: 1600, status: 'confirmed'
            },
            {
                venue_id: venue2._id, resource_id: venue2.resources[1]._id,
                resource_name: 'Badminton Court A', sport_type: 'badminton', resource_type: 'court',
                venue_name: 'Delhi Sports Arena', venue_city: 'Delhi', venue_location: 'Connaught Place, Delhi',
                player_id: players[2]._id, player_name: 'Rohit Patel',
                booking_date: '2026-03-28', start_time: '09:00', end_time: '11:00',
                total_price: 1200, status: 'confirmed'
            },
            {
                venue_id: venue3._id, resource_id: venue3.resources[0]._id,
                resource_name: 'Cricket Net 1', sport_type: 'cricket', resource_type: 'turf',
                venue_name: 'Bangalore Champions Club', venue_city: 'Bangalore', venue_location: 'Koramangala, Bangalore',
                player_id: players[6]._id, player_name: 'Karan Malhotra',
                booking_date: '2026-03-28', start_time: '16:00', end_time: '18:00',
                total_price: 2000, status: 'confirmed'
            }
        ]);

        console.log(`📅 Created ${bookings.length} bookings`);

        // ── Create Matches with ELO History ──
        const matches = await Match.insertMany([
            {
                player1_id: players[0]._id, player2_id: players[6]._id,
                player1_name: 'Virat Singh', player2_name: 'Karan Malhotra',
                player1_rating: 1650, player2_rating: 1290,
                sport: 'cricket', venue_id: venue1._id, venue_name: 'Mumbai Sports Complex',
                match_date: '2026-03-20', result: 'player1_win', score: '150-120', status: 'completed',
                elo_history: [
                    { player_id: players[0]._id, player_name: 'Virat Singh', old_rating: 1630, new_rating: 1650, rating_change: 20 },
                    { player_id: players[6]._id, player_name: 'Karan Malhotra', old_rating: 1310, new_rating: 1290, rating_change: -20 }
                ]
            },
            {
                player1_id: players[1]._id, player2_id: players[5]._id,
                player1_name: 'Sania Mirza', player2_name: 'Meera Nair',
                player1_rating: 1580, player2_rating: 1350,
                sport: 'tennis', venue_id: venue1._id, venue_name: 'Mumbai Sports Complex',
                match_date: '2026-03-21', result: 'player1_win', score: '6-3, 6-4', status: 'completed',
                elo_history: [
                    { player_id: players[1]._id, player_name: 'Sania Mirza', old_rating: 1560, new_rating: 1580, rating_change: 20 },
                    { player_id: players[5]._id, player_name: 'Meera Nair', old_rating: 1370, new_rating: 1350, rating_change: -20 }
                ]
            },
            {
                player1_id: players[2]._id, player2_id: players[7]._id,
                player1_name: 'Rohit Patel', player2_name: 'Divya Joshi',
                player1_rating: 1520, player2_rating: 1400,
                sport: 'badminton', venue_id: venue2._id, venue_name: 'Delhi Sports Arena',
                match_date: '2026-03-22', result: 'draw', score: '21-19, 19-21', status: 'completed',
                elo_history: [
                    { player_id: players[2]._id, player_name: 'Rohit Patel', old_rating: 1525, new_rating: 1520, rating_change: -5 },
                    { player_id: players[7]._id, player_name: 'Divya Joshi', old_rating: 1395, new_rating: 1400, rating_change: 5 }
                ]
            },
            {
                player1_id: players[3]._id, player2_id: players[4]._id,
                player1_name: 'Ananya Iyer', player2_name: 'Arjun Reddy',
                player1_rating: 1480, player2_rating: 1420,
                sport: 'basketball', venue_id: venue3._id, venue_name: 'Bangalore Champions Club',
                match_date: '2026-03-25', result: 'pending', status: 'scheduled',
                elo_history: []
            },
            {
                player1_id: players[0]._id, player2_id: players[2]._id,
                player1_name: 'Virat Singh', player2_name: 'Rohit Patel',
                player1_rating: 1650, player2_rating: 1520,
                sport: 'cricket', venue_id: venue1._id, venue_name: 'Mumbai Sports Complex',
                match_date: '2026-03-30', result: 'pending', status: 'scheduled',
                elo_history: []
            }
        ]);

        console.log(`⚔️  Created ${matches.length} matches`);

        // ── Create Reviews ──
        const reviews = await Review.insertMany([
            {
                user_id: players[0]._id, user_name: 'Virat Singh',
                venue_id: venue1._id, venue_name: 'Mumbai Sports Complex',
                text: 'Great facilities! Clean and well-maintained turf. Friendly staff and great lighting.',
                rating: 5, tags: ['clean', 'well-maintained', 'friendly staff']
            },
            {
                user_id: players[1]._id, user_name: 'Sania Mirza',
                venue_id: venue1._id, venue_name: 'Mumbai Sports Complex',
                text: 'Excellent tennis courts. Professional setup and affordable rates.',
                rating: 4.5, tags: ['professional', 'affordable']
            },
            {
                user_id: players[2]._id, user_name: 'Rohit Patel',
                venue_id: venue2._id, venue_name: 'Delhi Sports Arena',
                text: 'Spacious badminton courts. Good lighting but a bit crowded on weekends.',
                rating: 3.5, tags: ['spacious', 'good lighting', 'crowded']
            },
            {
                user_id: players[4]._id, user_name: 'Arjun Reddy',
                venue_id: venue3._id, venue_name: 'Bangalore Champions Club',
                text: 'Amazing sports hub! Great facilities and professional coaching available.',
                rating: 5, tags: ['great facilities', 'professional']
            },
            {
                user_id: players[7]._id, user_name: 'Divya Joshi',
                venue_id: venue2._id, venue_name: 'Delhi Sports Arena',
                text: 'Clean courts and affordable pricing. Would recommend to everyone!',
                rating: 4, tags: ['clean', 'affordable']
            }
        ]);

        console.log(`⭐ Created ${reviews.length} reviews`);

        console.log('\n✅ Seed complete! Demo credentials:');
        console.log('   Admin:   admin@sportsync.com / password123');
        console.log('   Manager: rajesh@sportsync.com / password123');
        console.log('   Player:  virat@sportsync.com / password123');
        console.log('   (All users have password: password123)\n');

        await mongoose.disconnect();
        process.exit(0);
    } catch (err) {
        console.error('❌ Seed failed:', err);
        await mongoose.disconnect();
        process.exit(1);
    }
}

seed();
