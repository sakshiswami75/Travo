const express = require('express');
const router = express.Router();
const Report = require('../models/Report');
const Alert = require('../models/Alert');

// @route   GET /api/maps/markers
// @desc    Get all pothole/hazard markers
router.get('/markers', async (req, res) => {
  try {
    const reports = await Report.find({ status: { $ne: 'Resolved' } });
    const markers = reports.map(r => ({
      id: r._id,
      lat: r.gps.lat,
      lng: r.gps.lng,
      severity: r.severity,
      type: 'pothole'
    }));
    res.json(markers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   GET /api/maps/alerts
// @desc    Get live map alerts
router.get('/alerts', async (req, res) => {
  try {
    const alerts = await Alert.find();
    res.json(alerts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   POST /api/maps/route
// @desc    Calculate safe route (mock logic)
router.post('/route', async (req, res) => {
  const { start, end } = req.body;
  try {
    // Basic mock response for safe route
    res.json({
      start,
      end,
      safetyScore: 95,
      estimatedTime: '25 mins',
      hazardsAvoided: 3
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
