const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password_hash: { type: String, required: true },
  role: { type: String, enum: ['player', 'venue_manager', 'admin'], default: 'player' },
  phone: { type: String, default: null },

  // ── Player-specific fields (Specialization) ──
  age: { type: Number, min: 10, max: 100, default: 18 },
  gender: { type: String, enum: ['male', 'female', 'other'], default: 'other' },
  skill_rating: { type: Number, default: 1200 },
  location: { type: String, default: '' },
  sport_preference: { type: String, default: 'general' },
  wins: { type: Number, default: 0 },
  losses: { type: Number, default: 0 },
  draws: { type: Number, default: 0 },
  bio: { type: String, default: '' },

  // ── Venue Manager-specific fields (Specialization) ──
  license_no: { type: String, default: null },
  bank_details: { type: String, default: null },
  organization: { type: String, default: null }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual: total matches played
userSchema.virtual('total_matches').get(function () {
  return (this.wins || 0) + (this.losses || 0) + (this.draws || 0);
});

// Index for fast lookups
userSchema.index({ role: 1 });
userSchema.index({ skill_rating: -1 });
userSchema.index({ sport_preference: 1 });
userSchema.index({ location: 1 });

module.exports = mongoose.model('User', userSchema);
