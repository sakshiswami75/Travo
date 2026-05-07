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
    'llama-3.2-11b-vision-preview',
    'meta-llama/llama-4-scout-17b-16e-instruct'
  ];

  let lastError = null;

  for (const modelId of MODELS_TO_TRY) {
    console.log(`[AI] Attempting Groq Vision analysis with: ${modelId}`);
    try {
      const chatCompletion = await groq.chat.completions.create({
        messages: [
          {
            role: 'system',
            content: `You are a professional Civil Engineer specializing in road maintenance and safety. 
            Analyze road images for potholes, cracks, and structural hazards. 
            Use this technical rubric for hazard_score (1-10):
            1-2: Superficial (Hairline cracks, no depth)
            3-4: Minor (Surface erosion, < 2cm depth)
            5-6: Moderate (Clear pothole, 2-5cm depth, creates vehicle vibration)
            7-8: High (Deep pothole, > 5cm depth, high risk of tire/rim damage)
            9-10: Critical (Road failure, massive craters, immediate danger to life/property)
            
            IMPORTANT: If the image is NOT a road (e.g. food, person, room), set isRoad: false and detected: false.`
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: `Perform a technical audit on this road image. Return ONLY a valid JSON object:
                {"detected": boolean, "isRoad": boolean, "hazard_score": number, "label": "pothole"|"crack"|"erosion"|"none", "description": "technical detail", "riskLevel": "Low"|"Medium"|"High"|"Critical", "roadSafetyScore": 0-100, "vehicleDamageProbability": "Low"|"Moderate"|"High", "suggestedAction": "string"}`
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
        temperature: 0,
      });

      const rawContent = chatCompletion.choices[0].message.content;
      console.log(`[AI] Groq Raw Content from ${modelId}:`, rawContent);
      
      const result = JSON.parse(rawContent);
      
      const score = result.hazard_score || 0;
      let calculatedSeverity = 'Low';
      let calcRisk = 'Low Risk';
      if (score >= 9) { calculatedSeverity = 'Critical'; calcRisk = 'Critical Risk'; }
      else if (score >= 7) { calculatedSeverity = 'High'; calcRisk = 'High Risk'; }
      else if (score >= 4) { calculatedSeverity = 'Medium'; calcRisk = 'Medium Risk'; }

      const normalized = {
        detected: result.detected === true,
        isRoad: result.isRoad !== false,
        severity: calculatedSeverity,
        confidence: result.confidence || (score * 10),
        label: result.label || 'hazard',
        description: result.description || '',
        aiAnalysis: {
          detectedHazard: result.label || 'Unknown',
          confidence: result.confidence || (score * 10),
          riskLevel: result.riskLevel || calcRisk,
          roadSafetyScore: result.roadSafetyScore || Math.max(10, 100 - (score * 10)),
          vehicleDamageProbability: result.vehicleDamageProbability || (score >= 7 ? 'High' : score >= 4 ? 'Medium' : 'Low'),
          suggestedAction: result.suggestedAction || 'Watch for hazard while driving.'
        }
      };

      console.log(`[AI] Groq SUCCESS: ${normalized.label} (Score: ${score} -> ${normalized.severity} Risk)`);

      return {
        ...normalized,
        method: `groq-${modelId.split('/').pop()}`,
        severity: normalized.detected ? normalized.severity : null
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
        severity: null,
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
    severity: detected ? getSeverity(rawConf) : null,
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

// ─── POST /api/reports/create ──────────────────────────────────────────────────
router.post('/create', protect, async (req, res) => {
  const { imageUrl, imagePublicId, latitude, longitude, locationName, hazardType, severity, confidence, aiDetectionResult, aiAnalysis, description } = req.body;

  if (!imageUrl || latitude === undefined || longitude === undefined) {
    return res.status(400).json({ message: 'imageUrl, latitude, and longitude are required' });
  }

  try {
    // 1. Simulate Municipal Forwarding
    const parts = (locationName || 'Local').split(',');
    const city = parts.length > 1 ? parts[1].trim() : parts[0].trim();
    const municipality = `${city} Municipal Corporation`;

    // 2. Calculate Reward Points based on severity rubric
    let rewardEarned = 10; // Base points for participation
    if (severity === 'Dangerous' || severity === 'Critical') rewardEarned = 150;
    else if (severity === 'High') rewardEarned = 100;
    else if (severity === 'Medium') rewardEarned = 50;
    else if (severity === 'Low') rewardEarned = 25;

    const report = await Report.create({
      user: req.user.id,
      imageUrl,
      imagePublicId: imagePublicId || '',
      locationName: locationName || 'Unknown location',
      latitude: parseFloat(latitude),
      longitude: parseFloat(longitude),
      hazardType: hazardType || 'Pothole',
      severity: severity || 'Medium',
      confidence: confidence || 0,
      aiDetectionResult: aiDetectionResult || {},
      aiAnalysis: aiAnalysis || {},
      description: description || '',
      status: 'Sent to Municipality',
      verificationCount: 0,
      municipality,
      rewardEarned
    });

    // 3. Update User Points
    const User = require('../models/User'); 
    const userDoc = await User.findById(req.user.id);
    if (userDoc) {
      userDoc.rewardPoints = (userDoc.rewardPoints || 0) + rewardEarned;
      await userDoc.save();
    }

    // 4. Create Nearby Alert for High/Critical
    if (['High', 'Critical', 'Dangerous'].includes(severity)) {
      const Alert = require('../models/Alert');
      await Alert.create({
        title: `${severity} ${hazardType} Detected`,
        description: `A ${severity.toLowerCase()} road hazard was just reported via AI scanner. Drive carefully in this area.`,
        severity: severity === 'High' ? 'High' : 'High', // Alert schema maps everything above moderate to High
        location: locationName || 'Nearby road',
        distance: '0.1 mi away'
      });
    }

    console.log(`[REPORTS] Saved: ${report._id} | severity=${report.severity} | mun=${municipality} | pts=${rewardEarned}`);
    res.status(201).json({
      message: 'Report submitted and forwarded successfully',
      reportId: report._id,
      severity: report.severity,
      status: report.status,
      municipality,
      rewardEarned
    });

  } catch (err) {
    console.error('[REPORTS] MongoDB save error:', err.message);
    res.status(500).json({ message: 'Failed to save report: ' + err.message });
  }
});

// ─── PUT /api/reports/verify/:id ──────────────────────────────────────────────
router.put('/verify/:id', async (req, res) => {
  const { action } = req.body; // 'exists' or 'resolved'
  try {
    const report = await Report.findById(req.params.id);
    if (!report) return res.status(404).json({ message: 'Report not found' });

    if (action === 'exists') {
      report.verificationCount = (report.verificationCount || 0) + 1;
      if (report.verificationCount >= 3 && report.status === 'Sent to Municipality') {
        report.status = 'Verified';
      }
    } else if (action === 'resolved') {
      report.verificationCount = (report.verificationCount || 0) - 1;
      if (report.verificationCount <= -3) {
        report.status = 'Resolved';
      }
    }

    await report.save();
    res.json(report);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ─── GET /api/reports/all ──────────────────────────────────────────────────────
router.get('/all', async (req, res) => {
  try {
    const reports = await Report.find({ status: { $ne: 'Resolved' } }).sort({ createdAt: -1 });
    res.json(reports);
  } catch (err) {
    res.status(500).json({ message: err.message });
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
