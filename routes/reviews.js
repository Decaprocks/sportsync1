const express = require('express');
const router = express.Router();
const Review = require('../models/Review');

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

// POST /api/reviews - Save a new review (now in MongoDB instead of JSON file)
router.post('/', async (req, res) => {
    try {
        if (!req.session.user) return res.status(401).json({ error: 'Login required' });

        const { venue_id, text, rating, venue_name } = req.body;

        const review = await Review.create({
            user_id: req.session.user.user_id,
            user_name: req.session.user.name,
            venue_id,
            venue_name: venue_name || '',
            text,
            rating: parseFloat(rating),
            tags: extractTags(text)
        });

        res.json({ success: true, review });
    } catch (err) {
        console.error('Create review error:', err);
        res.status(500).json({ error: 'Failed to save review' });
    }
});

// GET /api/reviews - Get all reviews
router.get('/', async (req, res) => {
    try {
        const { venue_id, min_rating } = req.query;
        const filter = {};

        if (venue_id) {
            filter.venue_id = venue_id;
        }
        if (min_rating) {
            filter.rating = { $gte: parseFloat(min_rating) };
        }

        const reviews = await Review.find(filter)
            .sort({ date: -1 })
            .lean();

        // Add review_id for frontend compatibility
        const result = reviews.map(r => ({
            ...r,
            review_id: r._id
        }));

        res.json(result);
    } catch (err) {
        console.error('Get reviews error:', err);
        res.status(500).json({ error: 'Failed to fetch reviews' });
    }
});

// GET /api/reviews/venue/:venueId - Get reviews for a specific venue
router.get('/venue/:venueId', async (req, res) => {
    try {
        const venueReviews = await Review.find({ venue_id: req.params.venueId })
            .sort({ date: -1 })
            .lean();

        const avgRating = venueReviews.length > 0
            ? (venueReviews.reduce((sum, r) => sum + r.rating, 0) / venueReviews.length).toFixed(1)
            : 0;

        const result = venueReviews.map(r => ({ ...r, review_id: r._id }));

        res.json({
            reviews: result,
            average_rating: parseFloat(avgRating),
            total: venueReviews.length
        });
    } catch (err) {
        console.error('Venue reviews error:', err);
        res.status(500).json({ error: 'Failed to fetch reviews' });
    }
});

// DELETE /api/reviews/:id - Delete a review
router.delete('/:id', async (req, res) => {
    try {
        if (!req.session.user) return res.status(401).json({ error: 'Login required' });

        const result = await Review.findOneAndDelete({
            _id: req.params.id,
            user_id: req.session.user.user_id
        });

        if (!result) return res.status(404).json({ error: 'Review not found or unauthorized' });

        res.json({ success: true, message: 'Review deleted' });
    } catch (err) {
        console.error('Delete review error:', err);
        res.status(500).json({ error: 'Failed to delete review' });
    }
});

module.exports = router;
