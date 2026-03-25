const mongoose = require('mongoose');

// ── Resource sub-document schema (embedded in Venue) ──
const resourceSchema = new mongoose.Schema({
  name: { type: String, required: true },
  type: { type: String, enum: ['court', 'turf', 'table', 'pool', 'track', 'ring'], required: true },
  sport_type: { type: String, required: true },
  capacity: { type: Number, default: 2, min: 1 },
  price_per_hour: { type: Number, default: 0, min: 0 },
  is_available: { type: Boolean, default: true }
});

const venueSchema = new mongoose.Schema({
  name: { type: String, required: true },
  location: { type: String, required: true },
  city: { type: String, required: true },
  description: { type: String, default: '' },
  owner_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  contact_phone: { type: String, default: null },
  opening_time: { type: String, default: '06:00:00' },
  closing_time: { type: String, default: '22:00:00' },
  rating: { type: Number, default: 0, min: 0, max: 5 },
  is_active: { type: Boolean, default: true },
  resources: [resourceSchema]
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

venueSchema.index({ city: 1 });
venueSchema.index({ owner_id: 1 });
venueSchema.index({ 'resources.sport_type': 1 });

module.exports = mongoose.model('Venue', venueSchema);
