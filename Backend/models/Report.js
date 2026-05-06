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
  locationName: {
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
  hazardType: {
    type: String,
    enum: ['Pothole', 'Crack', 'Waterlogging', 'Construction', 'Accident', 'Missing Manhole', 'Traffic Block', 'Other'],
    default: 'Pothole'
  },
  severity: {
    type: String,
    enum: ['Low', 'Medium', 'High', 'Dangerous', 'Critical'], // Kept Critical for backward compatibility with AI
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
  aiAnalysis: {
    detectedHazard: String,
    confidence: Number,
    riskLevel: String,
    roadSafetyScore: Number,
    vehicleDamageProbability: String,
    suggestedAction: String
  },
  description: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: ['Pending', 'Verified', 'Sent to Municipality', 'In Progress', 'Resolved'],
    default: 'Pending'
  },
  verificationCount: {
    type: Number,
    default: 0
  },
  municipality: {
    type: String,
    default: 'Pending Assignment'
  },
  rewardEarned: {
    type: Number,
    default: 0
  }
}, { timestamps: true });

module.exports = mongoose.model('Report', reportSchema);
