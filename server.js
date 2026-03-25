require('dotenv').config();
const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const path = require('path');
const { connectDB } = require('./config/db');

const app = express();
const PORT = process.env.PORT || 3000;

// Connect to MongoDB
connectDB();

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Session
app.use(session({
  secret: process.env.SESSION_SECRET || 'sportsync_secret',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 24 * 60 * 60 * 1000 } // 24 hours
}));

// Make session user available to all routes
app.use((req, res, next) => {
  res.locals.user = req.session.user || null;
  next();
});

// API Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/players', require('./routes/players'));
app.use('/api/venues', require('./routes/venues'));
app.use('/api/bookings', require('./routes/bookings'));
app.use('/api/matches', require('./routes/matches'));
app.use('/api/reviews', require('./routes/reviews'));
app.use('/api/leaderboard', require('./routes/leaderboard'));
app.use('/api/admin', require('./routes/admin'));

// Page Routes - serve HTML files
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));
app.get('/dashboard', (req, res) => res.sendFile(path.join(__dirname, 'public', 'dashboard.html')));
app.get('/venue-dashboard', (req, res) => res.sendFile(path.join(__dirname, 'public', 'venue-dashboard.html')));
app.get('/book-venue', (req, res) => res.sendFile(path.join(__dirname, 'public', 'book-venue.html')));
app.get('/find-match', (req, res) => res.sendFile(path.join(__dirname, 'public', 'find-match.html')));
app.get('/leaderboard', (req, res) => res.sendFile(path.join(__dirname, 'public', 'leaderboard.html')));
app.get('/reviews', (req, res) => res.sendFile(path.join(__dirname, 'public', 'reviews.html')));
app.get('/admin', (req, res) => res.sendFile(path.join(__dirname, 'public', 'admin.html')));

// Error handler
app.use((err, req, res, next) => {
  console.error('Server Error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`\n🏟️  SportSync Server running at http://localhost:${PORT}`);
  console.log(`   Dashboard:    http://localhost:${PORT}/dashboard`);
  console.log(`   Leaderboard:  http://localhost:${PORT}/leaderboard`);
  console.log(`   Admin Panel:  http://localhost:${PORT}/admin\n`);
});
