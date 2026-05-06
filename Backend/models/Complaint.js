const mongoose = require('mongoose');

const complaintSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  referenceId: {
    type: String,
    required: true,
    unique: true
  },
  roadName: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  severity: {
    type: String,
    enum: ['Low', 'Medium', 'High', 'Critical', 'Pending'],
    default: 'Pending'
  },
  status: {
    type: String,
    enum: ['Submitted', 'In Progress', 'Resolved', 'Rejected'],
    default: 'Submitted'
  },
  evidenceUrl: {
    type: String,
    default: ''
  },
  latitude: {
    type: Number
  },
  longitude: {
    type: Number
  },
  timeline: [{
    status: String,
    note: String,
    at: {
      type: Date,
      default: Date.now
    }
  }]
}, { timestamps: true });

module.exports = mongoose.model('Complaint', complaintSchema);
