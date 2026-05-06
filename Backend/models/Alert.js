const mongoose = require('mongoose');

const alertSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  severity: {
    type: String,
    enum: ['High', 'Moderate', 'Low'],
    required: true
  },
  location: {
    type: String,
    required: true
  },
  distance: {
    type: String, // e.g. "1.2 km away"
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Alert', alertSchema);
