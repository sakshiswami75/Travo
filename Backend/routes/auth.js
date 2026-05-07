const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { protect } = require('../middleware/authMiddleware');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

// @route   POST /api/auth/signup
// @desc    Register a new user
router.post('/signup', async (req, res) => {
  const { name, email, password, role } = req.body;
  try {
    const userExists = await User.findOne({ email });
    if (userExists) return res.status(400).json({ message: 'User already exists' });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({ 
      name, 
      email, 
      password: hashedPassword,
      role: role || 'Citizen'
    });

    console.log(`[AUTH] New user successfully saved to MongoDB: ${user.email} as ${user.role}`);

    res.status(201).json({
      _id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      safetyScore: user.safetyScore,
      token: generateToken(user._id)
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   POST /api/auth/login
// @desc    Auth user & get token
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email }).select('+password');
    if (user && (await bcrypt.compare(password, user.password))) {
      console.log(`[AUTH] User successfully logged in: ${user.email}`);
      res.json({
        _id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        safetyScore: user.safetyScore,
        token: generateToken(user._id)
      });
    } else {
      console.log(`[AUTH] Failed login attempt for: ${email}`);
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   GET /api/auth/me
// @desc    Get user profile with live dynamic stats
router.get('/me', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).lean();
    if (!user) return res.status(404).json({ message: 'User not found' });

    const Report = require('../models/Report');
    
    // Calculate live dynamic stats
    const userReports = await Report.find({ userId: req.user.id });
    
    let potholesReported = 0;
    let hazardsVerified = 0;
    let municipalityResolved = 0;
    let rewardPoints = user.rewardPoints || 0; // Baseline
    
    userReports.forEach(r => {
      potholesReported += 1;
      rewardPoints += 50; // +50 per report
      
      if (r.verificationCount > 0) {
        hazardsVerified += r.verificationCount;
        rewardPoints += (r.verificationCount * 10); // +10 per verification received
      }

      if (r.status === 'Resolved') {
        municipalityResolved += 1;
        rewardPoints += 100; // +100 for resolved
      }
    });

    // Simulate safe km and routes based on activity level
    const safeKm = (userReports.length * 15) + (Math.floor(Math.random() * 50) + 100);
    const routesCompleted = (userReports.length * 3) + (Math.floor(Math.random() * 10) + 20);

    // Calculate dynamic driver level
    let driverLevel = 'Beginner Driver';
    if (rewardPoints > 2000) driverLevel = 'Elite Contributor';
    else if (rewardPoints > 1000) driverLevel = 'Safety Hero';
    else if (rewardPoints > 500) driverLevel = 'Road Guardian';

    res.json({
      ...user,
      stats: {
        potholesReported,
        hazardsVerified,
        municipalityResolved,
        safeKm,
        routesCompleted
      },
      rewardPoints,
      driverLevel
    });
  } catch (error) {
    console.error("Profile Fetch Error:", error);
    res.status(500).json({ message: error.message });
  }
});

// @route   POST /api/auth/logout
// @desc    Logout user
router.post('/logout', (req, res) => {
  res.json({ message: 'Logged out successfully' });
});

module.exports = router;
