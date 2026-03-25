const express = require('express');
const router = express.Router();
const Match = require('../models/Match');
const User = require('../models/User');

// ── ELO Rating Calculator (replaces SQL trigger trg_update_elo_after_result) ──
function calculateElo(winnerRating, loserRating, isDraw = false) {
    const K = 32;
    const expectedWinner = 1 / (1 + Math.pow(10, (loserRating - winnerRating) / 400));
    const expectedLoser = 1 / (1 + Math.pow(10, (winnerRating - loserRating) / 400));

    if (isDraw) {
        const newWinner = Math.round(winnerRating + K * (0.5 - expectedWinner));
        const newLoser = Math.round(loserRating + K * (0.5 - expectedLoser));
        return { newWinner, newLoser };
    }

    const newWinner = Math.round(winnerRating + K * (1 - expectedWinner));
    const newLoser = Math.round(loserRating + K * (0 - expectedLoser));
    return { newWinner, newLoser };
}

// POST /api/matches - Create a new match
router.post('/', async (req, res) => {
    try {
        if (!req.session.user) return res.status(401).json({ error: 'Login required' });

        const { player2_id, sport, venue_id, booking_id, match_date } = req.body;
        const player1_id = req.session.user.user_id;

        // Eligibility check (replaces trg_check_eligibility trigger)
        if (player1_id === player2_id || player1_id.toString() === player2_id) {
            return res.status(403).json({ error: 'ELIGIBILITY ERROR: Cannot match against yourself' });
        }

        const player1 = await User.findById(player1_id).lean();
        const player2 = await User.findById(player2_id).lean();

        if (!player1 || player1.role !== 'player') {
            return res.status(403).json({ error: 'ELIGIBILITY ERROR: Player 1 is not a registered player' });
        }
        if (!player2 || player2.role !== 'player') {
            return res.status(403).json({ error: 'ELIGIBILITY ERROR: Player 2 is not a registered player' });
        }

        // Get venue name if provided
        let venue_name = '';
        if (venue_id) {
            const Venue = require('../models/Venue');
            const venue = await Venue.findById(venue_id).lean();
            venue_name = venue ? venue.name : '';
        }

        const match = await Match.create({
            player1_id,
            player2_id,
            player1_name: player1.name,
            player2_name: player2.name,
            player1_rating: player1.skill_rating,
            player2_rating: player2.skill_rating,
            sport,
            venue_id: venue_id || null,
            venue_name,
            booking_id: booking_id || null,
            match_date,
            elo_history: []
        });

        res.json({ success: true, match_id: match._id });
    } catch (err) {
        console.error('Create match error:', err);
        res.status(500).json({ error: 'Failed to create match: ' + err.message });
    }
});

// GET /api/matches - List matches with optional filters
router.get('/', async (req, res) => {
    try {
        const { sport, status, player_id } = req.query;
        const filter = {};

        if (sport && sport !== 'all') {
            filter.sport = sport;
        }
        if (status) {
            filter.status = status;
        }
        if (player_id) {
            filter.$or = [
                { player1_id: player_id },
                { player2_id: player_id }
            ];
        }

        const matches = await Match.find(filter)
            .sort({ match_date: -1, created_at: -1 })
            .limit(50)
            .lean();

        // Map to match expected frontend fields
        const result = matches.map(m => ({
            ...m,
            match_id: m._id
        }));

        res.json(result);
    } catch (err) {
        console.error('Matches list error:', err);
        res.status(500).json({ error: 'Failed to fetch matches' });
    }
});

// PUT /api/matches/:id/result - Record match result (ELO update in app code replaces trigger)
router.put('/:id/result', async (req, res) => {
    try {
        if (!req.session.user) return res.status(401).json({ error: 'Login required' });

        const { result, score } = req.body;
        const match = await Match.findById(req.params.id);

        if (!match) return res.status(404).json({ error: 'Match not found' });

        // Get current player ratings
        const player1 = await User.findById(match.player1_id);
        const player2 = await User.findById(match.player2_id);

        if (!player1 || !player2) {
            return res.status(404).json({ error: 'Players not found' });
        }

        const oldRating1 = player1.skill_rating;
        const oldRating2 = player2.skill_rating;
        let newRating1, newRating2;

        // ── Calculate ELO changes (replaces trg_update_elo_after_result) ──
        if (result === 'player1_win') {
            const elo = calculateElo(oldRating1, oldRating2, false);
            newRating1 = elo.newWinner;
            newRating2 = elo.newLoser;
            player1.wins += 1;
            player2.losses += 1;
        } else if (result === 'player2_win') {
            const elo = calculateElo(oldRating2, oldRating1, false);
            newRating2 = elo.newWinner;
            newRating1 = elo.newLoser;
            player2.wins += 1;
            player1.losses += 1;
        } else if (result === 'draw') {
            const elo = calculateElo(oldRating1, oldRating2, true);
            newRating1 = elo.newWinner;
            newRating2 = elo.newLoser;
            player1.draws += 1;
            player2.draws += 1;
        }

        // Update player ratings
        player1.skill_rating = newRating1;
        player2.skill_rating = newRating2;
        await player1.save();
        await player2.save();

        // Update match with result and ELO history
        match.result = result;
        match.score = score || null;
        match.status = 'completed';
        match.player1_rating = newRating1;
        match.player2_rating = newRating2;

        // Embed ELO changes in the match document
        match.elo_history = [
            {
                player_id: player1._id,
                player_name: player1.name,
                old_rating: oldRating1,
                new_rating: newRating1,
                rating_change: newRating1 - oldRating1
            },
            {
                player_id: player2._id,
                player_name: player2.name,
                old_rating: oldRating2,
                new_rating: newRating2,
                rating_change: newRating2 - oldRating2
            }
        ];
        await match.save();

        res.json({
            success: true,
            match: match.toObject(),
            elo_changes: match.elo_history,
            message: 'Match result recorded. ELO ratings updated.'
        });
    } catch (err) {
        console.error('Match result error:', err);
        res.status(500).json({ error: 'Failed to update match result' });
    }
});

// GET /api/matches/:id - Get match details
router.get('/:id', async (req, res) => {
    try {
        const match = await Match.findById(req.params.id).lean();
        if (!match) return res.status(404).json({ error: 'Match not found' });

        res.json({
            match: { ...match, match_id: match._id },
            elo_history: match.elo_history || []
        });
    } catch (err) {
        console.error('Match detail error:', err);
        res.status(500).json({ error: 'Failed to fetch match' });
    }
});

module.exports = router;
