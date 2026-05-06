const express = require('express');
const router = express.Router();
const multer = require('multer');
const axios = require('axios');
const fs = require('fs');
const Report = require('../models/Report');
const { protect } = require('../middleware/authMiddleware');

// ─── Multer ───────────────────────────────────────────────────────────────────
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = './uploads';
    if (!fs.existsSync(dir)) fs.mkdirSync(dir);
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, `report_${Date.now()}_${file.originalname.replace(/\s+/g, '_')}`);
  }
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    file.mimetype.startsWith('image/')
      ? cb(null, true)
      : cb(new Error('Only image files allowed'), false);
  },
  limits: { fileSize: 10 * 1024 * 1024 }
});

// ─── Upload to ImgBB ─────────────────────────────────────────────────────────
const uploadToImgBB = async (filePath) => {
  const apiKey = process.env.IMGBB_API_KEY;
  if (!apiKey || apiKey === 'YOUR_IMGBB_API_KEY') {
    throw new Error('IMGBB_API_KEY not configured in .env');
  }

  const imageData = fs.readFileSync(filePath);
  const b64 = imageData.toString('base64');

  const params = new URLSearchParams();
  params.append('key', apiKey);
  params.append('image', b64);

  const res = await axios.post('https://api.imgbb.com/1/upload', params, {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    timeout: 30000
  });

  if (!res.data?.success) throw new Error('ImgBB rejected the upload');

  return {
    imageUrl: res.data.data.url,
    displayUrl: res.data.data.display_url,
    deleteUrl: res.data.data.delete_url
  };
};

// ─── HuggingFace Router helper ────────────────────────────────────────────────
const hfPost = async (model, payload) => {
  const hfToken = process.env.HUGGINGFACE_API_TOKEN;
  const headers = { 'Content-Type': 'application/json' };
  if (hfToken && hfToken !== 'YOUR_HF_TOKEN') {
    headers['Authorization'] = `Bearer ${hfToken}`;
  }
  return axios.post(
    `https://router.huggingface.co/hf-inference/models/${model}`,
    payload,
    { headers, timeout: 30000, maxContentLength: Infinity, maxBodyLength: Infinity }
  );
};

// ─── Road/Surface label sets ─────────────────────────────────────────────────
// ImageNet labels that suggest road/pavement/ground context
const ROAD_LABELS = new Set([
  'valley', 'vale', 'alp', 'cliff', 'promontory', 'road', 'highway', 'pavement',
  'sidewalk', 'parking lot', 'runway', 'pier', 'dam', 'breakwater', 'seawall',
  'gravel', 'stone wall', 'tile', 'concrete', 'asphalt', 'coal', 'sandbar',
  'lakeside', 'traffic light', 'traffic sign', 'car', 'truck', 'bus',
  'automobile', 'racer', 'sports car', 'street sign', 'pole', 'guardrail',
]);

// Labels that indicate clearly NON-road images
const NON_ROAD_LABELS = new Set([
  'person', 'face', 'people', 'human', 'selfie',
  'pizza', 'burger', 'sushi', 'food', 'meal', 'plate', 'bowl', 'cup',
  'dog', 'cat', 'bird', 'animal', 'pet', 'fish',
  'flower', 'plant', 'tree', 'grass', 'garden', 'forest',
  'sky', 'cloud', 'ocean', 'beach', 'water', 'lake', 'river',
  'bedroom', 'kitchen', 'bathroom', 'living room', 'office', 'room',
  'laptop', 'phone', 'keyboard', 'monitor', 'TV', 'screen',
  'cat', 'lion', 'tiger', 'elephant', 'giraffe', 'zebra',
]);

// Check if ViT label is road-like or clearly non-road
const classifyLabel = (label) => {
  const lower = label.toLowerCase();
  if ([...NON_ROAD_LABELS].some(w => lower.includes(w))) return 'non-road';
  if ([...ROAD_LABELS].some(w => lower.includes(w))) return 'road';
  return 'unknown'; // Ambiguous — don't reject
};

// ─── AI Detection using ViT + scoring ────────────────────────────────────────
const detectPothole = async (imageBuffer) => {
  const b64 = imageBuffer.toString('base64');

  let classifications = [];
  try {
    const res = await hfPost('google/vit-base-patch16-224', { inputs: b64 });
    classifications = Array.isArray(res.data) ? res.data : [];
    console.log('[AI] ViT top labels:', classifications.slice(0, 3).map(c => `${c.label}(${(c.score * 100).toFixed(1)}%)`).join(', '));
  } catch (err) {
    console.warn('[AI] ViT call failed:', err.message);
    // Can't classify — proceed to pixel analysis fallback
  }

  // ── Stage 1: Reject clearly non-road images ─────────────────────────────
  if (classifications.length > 0) {
    const top = classifications[0];
    const verdict = classifyLabel(top.label);

    if (verdict === 'non-road' && top.score > 0.50) {
      const label = top.label.toLowerCase();
      let reason = 'This does not appear to be a road or pavement photo.';
      if (label.match(/person|face|people|human/)) reason = 'This looks like a photo of a person, not a road hazard.';
      else if (label.match(/food|pizza|burger|meal|plate|bowl/)) reason = 'This looks like a food photo, not a road hazard.';
      else if (label.match(/dog|cat|bird|animal|pet/)) reason = 'This looks like an animal photo, not a road hazard.';
      else if (label.match(/flower|plant|tree|grass|garden|forest/)) reason = 'This looks like a nature photo, not a road hazard.';
      else if (label.match(/sky|cloud|ocean|beach|water|lake/)) reason = 'This looks like a scenery photo, not a road hazard.';
      else if (label.match(/bedroom|kitchen|bathroom|living|room|office/)) reason = 'This looks like an indoor photo, not a road hazard.';

      console.log(`[AI] REJECTED — non-road image: "${top.label}" (${(top.score * 100).toFixed(1)}%)`);
      return {
        detected: false,
        isRoad: false,
        label: 'not a road image',
        confidence: 0,
        severity: null,
        notRoadError: `${reason} Please upload a clear photo of a road hazard (pothole, crack, or road damage).`
      };
    }
  }

  // ── Stage 2: Pothole likelihood from ViT labels ─────────────────────────
  // Score based on how road/pothole-like the top labels are
  let potholeScore = 0;
  let isRoadContext = false;

  for (const cls of classifications.slice(0, 5)) {
    const lower = cls.label.toLowerCase();
    const score = cls.score;

    // High pothole indicators (depression, rough terrain, dark void)
    if (lower.match(/valley|vale|cliff|depression|pit|hole|crater|gravel|rubble|debris/)) {
      potholeScore += score * 80;
      isRoadContext = true;
    }
    // Road context without pothole
    else if (lower.match(/road|highway|pavement|street|asphalt|concrete|sidewalk|parking|runway/)) {
      potholeScore += score * 20;
      isRoadContext = true;
    }
    // Vehicle context = road context
    else if (lower.match(/car|truck|bus|vehicle|automobile|traffic/)) {
      potholeScore += score * 15;
      isRoadContext = true;
    }
    // Terrain (could be road)
    else if (lower.match(/alp|tile|stone|wall|coal|sandbar|lakeside|dam|pier/)) {
      potholeScore += score * 10;
    }
  }

  // Clamp score to [0, 100]
  const rawConf = Math.min(92, Math.max(0, Math.round(potholeScore)));

  // Need minimum score to declare pothole detected
  const DETECT_THRESHOLD = 30;
  const detected = rawConf >= DETECT_THRESHOLD;

  const getSeverity = (c) => {
    if (c >= 72) return 'Critical';
    if (c >= 52) return 'High';
    if (c >= 32) return 'Medium';
    return 'Low';
  };

  console.log(`[AI] potholeScore=${potholeScore.toFixed(1)} → detected=${detected} conf=${rawConf}%`);

  // If no classification worked, use conservative defaults
  if (classifications.length === 0) {
    return {
      detected: false,
      isRoad: true,
      label: 'analysis unavailable',
      confidence: 0,
      severity: 'Medium',
      method: 'vit-classification',
      warning: 'AI classification unavailable — manual review recommended'
    };
  }

  return {
    detected,
    isRoad: true,
    label: detected ? 'pothole' : 'road surface (no pothole)',
    confidence: rawConf,
    severity: detected ? getSeverity(rawConf) : null,
    method: 'vit-classification',
    topLabel: classifications[0]?.label,
    modelId: 'google/vit-base-patch16-224'
  };
};

// ─── POST /api/reports/upload ─────────────────────────────────────────────────
router.post('/upload', protect, upload.single('image'), async (req, res) => {
  const filePath = req.file?.path;
  try {
    if (!req.file) return res.status(400).json({ message: 'No image provided' });

    console.log(`[REPORTS] Uploading: ${req.file.filename} (${(req.file.size / 1024).toFixed(1)} KB)`);

    const result = await uploadToImgBB(filePath);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

    console.log(`[REPORTS] ImgBB OK: ${result.imageUrl}`);
    res.json({ imageUrl: result.imageUrl, publicId: result.deleteUrl });

  } catch (err) {
    if (filePath && fs.existsSync(filePath)) fs.unlinkSync(filePath);
    console.error('[REPORTS] Upload error:', err.message);
    res.status(500).json({ message: 'Image upload failed: ' + err.message });
  }
});

// ─── POST /api/reports/detect ─────────────────────────────────────────────────
router.post('/detect', protect, upload.single('image'), async (req, res) => {
  let tmpPath = null;
  try {
    let imageBuffer;

    if (req.file) {
      tmpPath = req.file.path;
      imageBuffer = fs.readFileSync(tmpPath);
      console.log(`[REPORTS] HF detection on file (${(imageBuffer.length / 1024).toFixed(1)} KB)`);
    } else if (req.body.imageUrl) {
      console.log(`[REPORTS] Downloading for HF detection: ${req.body.imageUrl}`);
      const imgRes = await axios.get(req.body.imageUrl, {
        responseType: 'arraybuffer',
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; Travo/1.0)' },
        timeout: 20000
      });
      imageBuffer = Buffer.from(imgRes.data);
    } else {
      return res.status(400).json({ message: 'Provide image file or imageUrl' });
    }

    const result = await detectPothole(imageBuffer);

    if (tmpPath && fs.existsSync(tmpPath)) fs.unlinkSync(tmpPath);

    console.log(`[REPORTS] Result: detected=${result.detected} | severity=${result.severity} | conf=${result.confidence}% | method=${result.method}`);
    res.json(result);

  } catch (err) {
    if (tmpPath && fs.existsSync(tmpPath)) fs.unlinkSync(tmpPath);
    console.error('[REPORTS] Detection error:', err.response?.status, err.message);

    // Graceful non-blocking error — keep user on preview page
    res.json({
      detected: false,
      isRoad: true,  // don't reset — it's a technical error, not a non-road image
      label: 'ai unavailable',
      confidence: 0,
      severity: 'Medium',
      method: 'error-fallback',
      warning: 'AI service temporarily unavailable. You can still submit the report.'
    });
  }
});

// ─── POST /api/reports/create ─────────────────────────────────────────────────
router.post('/create', protect, async (req, res) => {
  const { imageUrl, imagePublicId, latitude, longitude, location, severity, confidence, aiDetectionResult, description } = req.body;

  if (!imageUrl || latitude === undefined || longitude === undefined) {
    return res.status(400).json({ message: 'imageUrl, latitude, and longitude are required' });
  }

  try {
    const report = await Report.create({
      user: req.user.id,
      imageUrl,
      imagePublicId: imagePublicId || '',
      location: location || 'Unknown location',
      latitude: parseFloat(latitude),
      longitude: parseFloat(longitude),
      severity: severity || 'Medium',
      confidence: confidence || 0,
      aiDetectionResult: aiDetectionResult || {},
      description: description || '',
      status: 'Pending'
    });

    console.log(`[REPORTS] Saved: ${report._id} | severity=${report.severity}`);
    res.status(201).json({
      message: 'Report submitted successfully',
      reportId: report._id,
      severity: report.severity,
      status: report.status
    });

  } catch (err) {
    console.error('[REPORTS] MongoDB save error:', err.message);
    res.status(500).json({ message: 'Failed to save report: ' + err.message });
  }
});

// ─── GET /api/reports ─────────────────────────────────────────────────────────
router.get('/', protect, async (req, res) => {
  try {
    const reports = await Report.find({ user: req.user.id }).sort({ createdAt: -1 });
    res.json(reports);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
