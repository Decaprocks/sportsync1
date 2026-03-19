const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const REVIEWS_FILE = path.join(__dirname, '..', 'data', 'reviews.json');

// Helper: Read reviews from JSON (NoSQL simulation)
function readReviews() {
    try {
        const data = fs.readFileSync(REVIEWS_FILE, 'utf8');
        return JSON.parse(data);
    } catch (err) {
        return [];
    }
}

// Helper: Write reviews to JSON
function writeReviews(reviews) {
    fs.writeFileSync(REVIEWS_FILE, JSON.stringify(reviews, null, 2));
}

// POST /api/reviews - Save a new review (NoSQL / JSON storage)
router.post('/', (req, res) => {
    try {
        if (!req.session.user) return res.status(401).json({ error: 'Login required' });

        const { venue_id, text, rating, venue_name } = req.body;

        const review = {
            review_id: uuidv4(),
            user_id: req.session.user.user_id,
            user_name: req.session.user.name,
            venue_id: parseInt(venue_id),
            venue_name: venue_name || '',
            text: text,
            rating: parseFloat(rating),
            date: new Date().toISOString(),
            tags: extractTags(text)
        };

        const reviews = readReviews();
        reviews.push(review);
        writeReviews(reviews);

        res.json({ success: true, review });
    } catch (err) {
        console.error('Create review error:', err);
        res.status(500).json({ error: 'Failed to save review' });
    }
});

// GET /api/reviews - Get all reviews
router.get('/', (req, res) => {
    try {
        const reviews = readReviews();
        const { venue_id, min_rating } = req.query;

        let filtered = reviews;
        if (venue_id) {
            filtered = filtered.filter(r => r.venue_id === parseInt(venue_id));
        }
        if (min_rating) {
            filtered = filtered.filter(r => r.rating >= parseFloat(min_rating));
        }

        // Sort by most recent
        filtered.sort((a, b) => new Date(b.date) - new Date(a.date));

        res.json(filtered);
    } catch (err) {
        console.error('Get reviews error:', err);
        res.status(500).json({ error: 'Failed to fetch reviews' });
    }
});

// GET /api/reviews/venue/:venueId - Get reviews for a specific venue
router.get('/venue/:venueId', (req, res) => {
    try {
        const reviews = readReviews();
        const venueReviews = reviews
            .filter(r => r.venue_id === parseInt(req.params.venueId))
            .sort((a, b) => new Date(b.date) - new Date(a.date));

        const avgRating = venueReviews.length > 0
            ? (venueReviews.reduce((sum, r) => sum + r.rating, 0) / venueReviews.length).toFixed(1)
            : 0;

        res.json({ reviews: venueReviews, average_rating: parseFloat(avgRating), total: venueReviews.length });
    } catch (err) {
        console.error('Venue reviews error:', err);
        res.status(500).json({ error: 'Failed to fetch reviews' });
    }
});

// DELETE /api/reviews/:id - Delete a review
router.delete('/:id', (req, res) => {
    try {
        if (!req.session.user) return res.status(401).json({ error: 'Login required' });

        let reviews = readReviews();
        const idx = reviews.findIndex(r => r.review_id === req.params.id && r.user_id === req.session.user.user_id);

        if (idx === -1) return res.status(404).json({ error: 'Review not found or unauthorized' });

        reviews.splice(idx, 1);
        writeReviews(reviews);

        res.json({ success: true, message: 'Review deleted' });
    } catch (err) {
        console.error('Delete review error:', err);
        res.status(500).json({ error: 'Failed to delete review' });
    }
});

// Helper: Extract hashtag-style tags from review text
function extractTags(text) {
    const keywords = ['clean', 'professional', 'well-maintained', 'affordable', 'spacious',
        'good lighting', 'friendly staff', 'great facilities', 'poor', 'crowded', 'expensive'];
    const tags = [];
    const lower = text.toLowerCase();
    keywords.forEach(kw => {
        if (lower.includes(kw)) tags.push(kw);
    });
    return tags;
}

module.exports = router;
