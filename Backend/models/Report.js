const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  imageUrl: {
    type: String, // Cloudinary secure URL
    required: true
  },
  imagePublicId: {
    type: String // Cloudinary public_id for future deletion
  },
  location: {
    type: String, // Human readable address
    default: 'Unknown location'
  },
  latitude: {
    type: Number,
    required: true
  },
  longitude: {
    type: Number,
    required: true
  },
  severity: {
    type: String,
    enum: ['Low', 'Medium', 'High', 'Critical', 'None'],
    required: true
  },
  confidence: {
    type: Number, // 0-100 from AI
    default: 0
  },
  aiDetectionResult: {
    detected: { type: Boolean, default: false },
    label: { type: String, default: 'Unknown' },
    confidence: { type: Number, default: 0 },
    boundingBoxes: [{ x: Number, y: Number, width: Number, height: Number }],
    rawResponse: { type: mongoose.Schema.Types.Mixed }
  },
  description: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: ['Pending', 'Reviewed', 'Resolved'],
    default: 'Pending'
  }
}, { timestamps: true });

module.exports = mongoose.model('Report', reportSchema);
