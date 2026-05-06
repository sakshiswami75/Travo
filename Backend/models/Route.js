const mongoose = require('mongoose');

const routeSchema = new mongoose.Schema({
  startPoint: {
    type: String,
    required: true
  },
  endPoint: {
    type: String,
    required: true
  },
  safetyLevel: {
    type: String,
    enum: ['High', 'Moderate', 'Low'],
    required: true
  },
  trafficLevel: {
    type: String,
    enum: ['Heavy', 'Moderate', 'Light'],
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Route', routeSchema);
