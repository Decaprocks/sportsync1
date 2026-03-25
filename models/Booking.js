const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  venue_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Venue', required: true },
  resource_id: { type: mongoose.Schema.Types.ObjectId, required: true }, // references Venue.resources._id
  resource_name: { type: String, default: '' },
  sport_type: { type: String, default: '' },
  resource_type: { type: String, default: '' },
  venue_name: { type: String, default: '' },
  venue_city: { type: String, default: '' },
  venue_location: { type: String, default: '' },
  player_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  player_name: { type: String, default: '' },
  booking_date: { type: String, required: true }, // YYYY-MM-DD
  start_time: { type: String, required: true },   // HH:MM
  end_time: { type: String, required: true },      // HH:MM
  status: { type: String, enum: ['confirmed', 'cancelled', 'completed', 'pending'], default: 'confirmed' },
  total_price: { type: Number, default: 0, min: 0 }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

bookingSchema.index({ booking_date: 1 });
bookingSchema.index({ resource_id: 1, booking_date: 1 });
bookingSchema.index({ player_id: 1 });
bookingSchema.index({ venue_id: 1 });

module.exports = mongoose.model('Booking', bookingSchema);
