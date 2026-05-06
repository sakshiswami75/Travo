const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Alert = require('../models/Alert');
const Route = require('../models/Route');
const { protect } = require('../middleware/authMiddleware');

// @route   GET /api/home/dashboard
// @desc    Get user dashboard data
router.get('/dashboard', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    res.json({
      name: user.name,
      safetyScore: user.safetyScore,
      avgSpeed: user.avgSpeed,
      routesSafePercentage: user.routesSafePercentage
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   GET /api/home/alerts
// @desc    Get nearby alerts
router.get('/alerts', protect, async (req, res) => {
  try {
    const alerts = await Alert.find().sort('-createdAt').limit(5);
    res.json(alerts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   GET /api/home/routes
// @desc    Get route suggestions
router.get('/routes', protect, async (req, res) => {
  try {
    const routes = await Route.find().limit(3);
    res.json(routes);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
