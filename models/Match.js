const mongoose = require('mongoose');

// ── ELO history sub-document (embedded in Match) ──
const eloChangeSchema = new mongoose.Schema({
  player_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  player_name: { type: String, default: '' },
  old_rating: { type: Number, required: true },
  new_rating: { type: Number, required: true },
  rating_change: { type: Number, required: true },
  recorded_at: { type: Date, default: Date.now }
});

const matchSchema = new mongoose.Schema({
  player1_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  player2_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  player1_name: { type: String, default: '' },
  player2_name: { type: String, default: '' },
  player1_rating: { type: Number, default: 1200 },
  player2_rating: { type: Number, default: 1200 },
  sport: { type: String, required: true },
  venue_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Venue', default: null },
  venue_name: { type: String, default: '' },
  booking_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', default: null },
  match_date: { type: String, required: true }, // YYYY-MM-DD
  result: { type: String, enum: ['player1_win', 'player2_win', 'draw', 'pending'], default: 'pending' },
  score: { type: String, default: null },
  status: { type: String, enum: ['scheduled', 'in_progress', 'completed', 'cancelled'], default: 'scheduled' },
  elo_history: [eloChangeSchema]
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

matchSchema.index({ match_date: -1 });
matchSchema.index({ player1_id: 1, player2_id: 1 });
matchSchema.index({ sport: 1 });
matchSchema.index({ status: 1 });

module.exports = mongoose.model('Match', matchSchema);
