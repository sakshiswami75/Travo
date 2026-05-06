const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Complaint = require('../models/Complaint');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '..', 'uploads', 'complaints');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || '.jpg';
    cb(null, `complaint_${Date.now()}_${Math.round(Math.random() * 1e9)}${ext}`);
  }
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Only image files are allowed'), false);
  },
  limits: { fileSize: 5 * 1024 * 1024 }
});

const buildEvidenceUrl = (req, file) => {
  if (!file) return '';
  const relativePath = path.relative(path.join(__dirname, '..'), file.path).replace(/\\/g, '/');
  return `${req.protocol}://${req.get('host')}/${relativePath}`;
};

const makeReferenceId = () => {
  const date = new Date();
  const stamp = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`;
  return `CMP-${stamp}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
};

router.post('/', protect, upload.single('evidence'), async (req, res) => {
  try {
    const { roadName, description, severity, latitude, longitude } = req.body;

    if (!roadName?.trim() || !description?.trim()) {
      return res.status(400).json({ message: 'Road name and complaint details are required' });
    }

    const complaint = await Complaint.create({
      user: req.user._id,
      referenceId: makeReferenceId(),
      roadName: roadName.trim(),
      description: description.trim(),
      severity: severity || 'Pending',
      evidenceUrl: buildEvidenceUrl(req, req.file),
      latitude: latitude ? Number(latitude) : undefined,
      longitude: longitude ? Number(longitude) : undefined,
      timeline: [{
        status: 'Submitted',
        note: 'Complaint submitted and queued for authority review.'
      }]
    });

    res.status(201).json({
      message: 'Complaint filed successfully',
      complaint
    });
  } catch (err) {
    console.error('[COMPLAINTS] Create error:', err.message);
    res.status(500).json({ message: 'Failed to file complaint: ' + err.message });
  }
});

router.get('/', protect, async (req, res) => {
  try {
    const complaints = await Complaint.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json(complaints);
  } catch (err) {
    console.error('[COMPLAINTS] Fetch error:', err.message);
    res.status(500).json({ message: 'Failed to load complaints' });
  }
});

module.exports = router;
