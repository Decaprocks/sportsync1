const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  user_name: { type: String, required: true },
  venue_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Venue', required: true },
  venue_name: { type: String, default: '' },
  text: { type: String, required: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  tags: [{ type: String }],
  date: { type: Date, default: Date.now }
});

reviewSchema.index({ venue_id: 1 });
reviewSchema.index({ user_id: 1 });
reviewSchema.index({ rating: -1 });

module.exports = mongoose.model('Review', reviewSchema);
