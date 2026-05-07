const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a name']
  },
  email: {
    type: String,
    required: [true, 'Please add an email'],
    unique: true,
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      'Please add a valid email'
    ]
  },
  password: {
    type: String,
    required: [true, 'Please add a password'],
    select: false
  },
  safetyScore: {
    type: Number,
    default: 100
  },
  points: {
    type: Number,
    default: 0
  },
  totalReports: {
    type: Number,
    default: 0
  },
  avgSpeed: {
    type: Number,
    default: 0
  },
  routesSafePercentage: {
    type: Number,
    default: 100
  },
  rewardPoints: {
    type: Number,
    default: 0
  }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
