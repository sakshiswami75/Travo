const express = require('express');
const router = express.Router();
const multer = require('multer');
const axios = require('axios');
const fs = require('fs');
const Report = require('../models/Report');
const User = require('../models/User');
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

const Groq = require('groq-sdk');

// ─── Groq Vision helper ──────────────────────────────────────────────────────
const detectWithGroq = async (imageBuffer) => {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey || apiKey.startsWith('gsk_your')) {
    console.warn('[AI] GROQ_API_KEY not configured, falling back to ViT');
    return null;
  }

  const groq = new Groq({ apiKey });
  const b64 = imageBuffer.toString('base64');

  // Sequence of models to try. We prioritize the latest active vision models.
  const MODELS_TO_TRY = [
    'meta-llama/llama-4-scout-17b-16e-instruct',
    'llama-3.2-11b-vision-preview'
  ];

  let lastError = null;

  for (const modelId of MODELS_TO_TRY) {
    console.log(`[AI] Attempting Groq Vision analysis with: ${modelId}`);
    try {
      const chatCompletion = await groq.chat.completions.create({
        messages: [
          {
            role: 'system',
            content: `You are a professional Civil Engineer specialized in road safety and pavement assessment.
            Your task is to analyze road images for hazards like potholes, structural cracks, and erosion.
            
            SCORING RUBRIC (Hazard Score 1-10):
            - 1-3 (LOW): Hairline cracks, minor surface wear, or very shallow depressions (under 1 inch deep). No immediate risk.
            - 4-6 (MEDIUM): Distinct potholes or cracks. Depth 1-3 inches. Noticeable shadows inside. Requires caution but not immediate swerving.
            - 7-8 (HIGH): Deep, wide potholes (3+ inches deep, 12+ inches wide). Sharp edges that can damage tires or suspension. High risk at normal speeds.
            - 9-10 (CRITICAL): Massive road failure, sinkholes, or deep pits spanning most of the lane. Extreme danger. Immediate intervention required.
            
            Strictly evaluate based on the potential impact on a standard sedan car.`
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: `Examine this road image. Is there a hazard? If yes, what is its severity?
                Respond strictly in this JSON format:
                {
                  "detected": boolean,
                  "isRoad": boolean,
                  "hazard_score": integer (1-10),
                  "confidence": integer (0-100),
                  "label": "pothole" | "crack" | "erosion" | "none",
                  "description": "Brief technical explanation of why you gave this score"
                }`
              },
              {
                type: 'image_url',
                image_url: { url: `data:image/jpeg;base64,${b64}` }
              }
            ]
          }
        ],
        model: modelId,
        response_format: { type: 'json_object' },
        temperature: 0, // Zero temperature for more consistent classification
      });

      const rawContent = chatCompletion.choices[0].message.content;
      console.log(`[AI] Groq Raw Content from ${modelId}:`, rawContent);
      
      const result = JSON.parse(rawContent);
      
      // Map hazard score to severity labels
      const score = result.hazard_score || 0;
      let calculatedSeverity = 'Low';
      if (score >= 9) calculatedSeverity = 'Critical';
      else if (score >= 7) calculatedSeverity = 'High';
      else if (score >= 4) calculatedSeverity = 'Medium';

      const normalized = {
        detected: result.detected === true,
        isRoad: result.isRoad !== false, // Default to true unless explicitly false
        severity: calculatedSeverity,
        confidence: result.confidence || (score > 0 ? score * 10 : 0), 
        label: result.label || 'hazard',
        description: result.description || ''
      };

      console.log(`[AI] Groq SUCCESS: ${normalized.label} (Score: ${score} -> ${normalized.severity} Risk)`);

      return {
        ...normalized,
        method: `groq-${modelId.split('/').pop()}`,
        severity: normalized.detected ? normalized.severity : 'None'
      };

    } catch (err) {
      lastError = err;
      console.warn(`[AI] Groq failed with ${modelId}:`, err.message);
      if (err.message.includes('decommissioned') || err.message.includes('not_found')) {
        continue;
      }
      break; 
    }
  }

  console.error('[AI] All Groq models failed. Last error:', lastError?.message);
  return null;
};

// ─── AI Detection using ViT (Fallback) ───────────────────────────────────────
const detectPothole = async (imageBuffer) => {
  // First try Groq
  const groqResult = await detectWithGroq(imageBuffer);
  if (groqResult) {
    // If not a road image, provide the detailed error
    if (groqResult.isRoad === false) {
      return {
        ...groqResult,
        notRoadError: `This looks like ${groqResult.description || 'a non-road image'}. Please upload a clear photo of a road hazard.`
      };
    }
    return groqResult;
  }

  // Fallback to ViT
  const b64 = imageBuffer.toString('base64');
  let classifications = [];
  try {
    const res = await hfPost('google/vit-base-patch16-224', { inputs: b64 });
    classifications = Array.isArray(res.data) ? res.data : [];
  } catch (err) {
    console.warn('[AI] ViT call failed:', err.message);
  }

  // Stage 1: Reject clearly non-road images
  if (classifications.length > 0) {
    const top = classifications[0];
    const verdict = classifyLabel(top.label);
    if (verdict === 'non-road' && top.score > 0.50) {
      return {
        detected: false,
        isRoad: false,
        label: 'not a road image',
        confidence: 0,
        severity: 'None',
        notRoadError: `This does not appear to be a road photo. It looks like a ${top.label}.`
      };
    }
  }

  // Stage 2: Pothole likelihood
  let potholeScore = 0;
  for (const cls of classifications.slice(0, 5)) {
    const lower = cls.label.toLowerCase();
    const score = cls.score;
    // Keywords that might indicate a pothole or road hazard in a general ImageNet model
    if (lower.match(/valley|vale|cliff|depression|pit|hole|crater|gravel|rubble|debris|rock|stone|rough|broken|terrain/)) {
      potholeScore += score * 120;
    } else if (lower.match(/road|highway|pavement|street|asphalt|concrete|sidewalk/)) {
      potholeScore += score * 15;
    }
  }

  const rawConf = Math.min(95, Math.max(0, Math.round(potholeScore)));
  const detected = rawConf >= 25; // Lowered from 30 for better recall
  const getSeverity = (c) => (c >= 70 ? 'Critical' : c >= 50 ? 'High' : c >= 30 ? 'Medium' : 'Low');

  return {
    detected,
    isRoad: true,
    label: detected ? 'hazard detected' : 'clear road',
    confidence: rawConf,
    severity: detected ? getSeverity(rawConf) : 'None',
    method: 'vit-classification-fallback'
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

    res.status(500).json({
      detected: false,
      isRoad: true,
      label: 'detection error',
      confidence: 0,
      severity: 'Medium',
      method: 'error-fallback',
      warning: 'AI analysis encountered an error. You can still proceed manually.'
    });
  }
});

// ─── POST /api/reports/create ─────────────────────────────────────────────────
router.post('/create', protect, async (req, res) => {
  const { imageUrl, imagePublicId, latitude, longitude, location, severity, confidence, aiDetectionResult, description } = req.body;

  if (!imageUrl || latitude === undefined || longitude === undefined) {
    return res.status(400).json({ message: 'imageUrl, latitude, and longitude are required' });
  }

  const lat = parseFloat(latitude);
  const lng = parseFloat(longitude);

  if (isNaN(lat) || isNaN(lng)) {
    return res.status(400).json({ message: 'Invalid GPS coordinates provided' });
  }

  try {
    if (!req.user) {
      return res.status(401).json({ message: 'User context missing. Please re-login.' });
    }
    
    const report = await Report.create({
      user: req.user._id,
      imageUrl,
      imagePublicId: imagePublicId || '',
      location: location || 'Unknown location',
      latitude: lat,
      longitude: lng,
      severity: severity || 'Medium',
      confidence: confidence || 0,
      aiDetectionResult: aiDetectionResult || {},
      description: description || '',
      status: 'Pending'
    });

    // Calculate points based on severity
    let pointsEarned = 50; // Default
    if (severity === 'Critical') pointsEarned = 100;
    else if (severity === 'High') pointsEarned = 75;
    else if (severity === 'Low') pointsEarned = 25;
    else if (severity === 'None') pointsEarned = 10;

    // Update user points and total reports
    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      { $inc: { points: pointsEarned, totalReports: 1 } },
      { new: true }
    );

    console.log(`[REPORTS] Saved: ${report._id} | User ${req.user?._id} earned ${pointsEarned} pts (Total: ${updatedUser?.points || '?'})`);
    
    res.status(201).json({
      message: 'Report submitted successfully',
      reportId: report._id,
      severity: report.severity,
      status: report.status,
      latitude: report.latitude,
      longitude: report.longitude,
      location: report.location,
      imageUrl: report.imageUrl,
      pointsEarned,
      totalPoints: updatedUser?.points || 0
    });

  } catch (err) {
    console.error('[REPORTS] MongoDB save error:', err.message);
    res.status(500).json({ message: 'Failed to save report: ' + err.message });
  }
});

// ─── GET /api/reports ─────────────────────────────────────────────────────────
router.get('/', protect, async (req, res) => {
  try {
    const reports = await Report.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json(reports);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
