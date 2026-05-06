const express = require('express');
const router = express.Router();
const axios = require('axios');
const Report = require('../models/Report');
const Alert = require('../models/Alert');
const { protect } = require('../middleware/authMiddleware');

// Helpers for ORS
const getOrsKey = () => process.env.ORS_API_KEY || '5b3ce3597851110001cf6248c8dfa8910b0e457caee46cfbe694c979';

const getReportCoords = (report) => {
  const lat = Number(report.latitude ?? report.gps?.lat);
  const lng = Number(report.longitude ?? report.gps?.lng);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  return { lat, lng };
};

const reportToMapMarker = (report) => {
  const coords = getReportCoords(report);
  if (!coords) return null;

  return {
    id: report._id,
    lat: coords.lat,
    lng: coords.lng,
    severity: report.severity || 'Medium',
    confidence: report.confidence || 0,
    imageUrl: report.imageUrl,
    location: report.location || `${coords.lat.toFixed(5)}, ${coords.lng.toFixed(5)}`,
    description: report.description || '',
    status: report.status,
    createdAt: report.createdAt,
    type: 'pothole'
  };
};

// @route   GET /api/maps/markers
router.get('/markers', async (req, res) => {
  try {
    const reports = await Report.find({
      status: { $ne: 'Resolved' },
      severity: { $ne: 'None' }
    }).sort({ createdAt: -1 });

    const markers = reports.map(reportToMapMarker).filter(Boolean);
    res.json(markers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   GET /api/maps/heatmap
router.get('/heatmap', async (req, res) => {
  try {
    const reports = await Report.find({
      status: { $ne: 'Resolved' },
      severity: { $ne: 'None' }
    });
    const heatData = reports.map(r => {
      const coords = getReportCoords(r);
      if (!coords) return null;
      let intensity = 0.5;
      if (r.severity === 'Critical') intensity = 1.0;
      else if (r.severity === 'High') intensity = 0.8;
      else if (r.severity === 'Medium') intensity = 0.5;
      else if (r.severity === 'Low') intensity = 0.3;
      return [coords.lat, coords.lng, intensity];
    }).filter(Boolean);
    res.json(heatData);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   GET /api/maps/alerts
router.get('/alerts', async (req, res) => {
  try {
    const alerts = await Alert.find({ status: 'Active' });
    res.json(alerts);
  } catch (error) {
    res.json([]);
  }
});

// @route   GET /api/maps/search
// @desc    Geocode a location using Nominatim
router.get('/search', async (req, res) => {
  const { q } = req.query;
  if (!q) return res.status(400).json({ message: 'Query is required' });
  try {
    const resp = await axios.get(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}`, {
      headers: { 'User-Agent': 'TravoMapSystem/1.0' }
    });
    const results = resp.data.map(item => ({
      name: item.display_name,
      lat: parseFloat(item.lat),
      lng: parseFloat(item.lon)
    }));
    res.json(results);
  } catch (error) {
    res.status(500).json({ message: 'Geocoding failed' });
  }
});

// @route   POST /api/maps/routes
// @desc    Generate routes with Weather, Traffic overlay segments, and AI Safety Assistant
router.post('/routes', async (req, res) => {
  const { start, end } = req.body;
  if (!start || !end) return res.status(400).json({ message: 'Start and end coordinates required' });

  try {
    // 1. Fetch Route from OSRM
    const url = `https://router.project-osrm.org/route/v1/driving/${start.lng},${start.lat};${end.lng},${end.lat}?overview=full&geometries=geojson&steps=true&alternatives=3`;
    const resp = await axios.get(url);
    
    if (!resp.data.routes || resp.data.routes.length === 0) {
      return res.status(404).json({ message: 'No route found' });
    }

    // 2. Fetch Live Weather from Open-Meteo
    let weatherData = { isRaining: false, condition: 'Clear', temp: 75 };
    try {
      const weatherResp = await axios.get(`https://api.open-meteo.com/v1/forecast?latitude=${start.lat}&longitude=${start.lng}&current_weather=true`);
      const current = weatherResp.data.current_weather;
      if (current) {
        weatherData.temp = current.temperature;
        // WMO Weather codes: 51-67, 80-82 = Rain; 71-77, 85-86 = Snow; 95-99 = Thunderstorm
        const code = current.weathercode;
        if ([51,53,55,56,57,61,63,65,66,67,80,81,82,95,96,99].includes(code)) {
          weatherData.isRaining = true;
          weatherData.condition = 'Rain/Wet Roads';
        } else if ([71,73,75,77,85,86].includes(code)) {
          weatherData.isRaining = true;
          weatherData.condition = 'Snow/Ice';
        } else {
          weatherData.condition = 'Clear';
        }
      }
    } catch (e) {
      console.error('Weather fetch failed');
    }

    // 3. Fetch all active hazards for scoring
    const reports = await Report.find({
      status: { $ne: 'Resolved' },
      severity: { $ne: 'None' }
    });
    const hazards = reports.map(r => ({
      ...getReportCoords(r),
      severity: r.severity
    })).filter(h => Number.isFinite(h.lat) && Number.isFinite(h.lng));

    const generatedRoutes = resp.data.routes.map((routeData, index) => {
      const coordinates = routeData.geometry.coordinates.map(c => [c[1], c[0]]); 
      
      let hazardsEncountered = 0;
      let totalSeverityWeight = 0;

      hazards.forEach(h => {
        for (let i = 0; i < coordinates.length; i += 5) { 
          const pt = coordinates[i];
          const dist = Math.hypot(h.lat - pt[0], h.lng - pt[1]);
          if (dist < 0.005) { 
            hazardsEncountered++;
            if (h.severity === 'Critical') totalSeverityWeight += 30;
            else if (h.severity === 'High') totalSeverityWeight += 15;
            else if (h.severity === 'Medium') totalSeverityWeight += 5;
            else totalSeverityWeight += 2;
            break;
          }
        }
      });

      // Weather penalty
      if (weatherData.isRaining) {
        totalSeverityWeight += 15; // Wet roads make existing potholes much more dangerous
      }

      let safetyScore = 100 - totalSeverityWeight;
      if (safetyScore < 20) safetyScore = 20;

      const distMiles = routeData.distance / 1609.34;
      const durationMins = routeData.duration / 60;
      const avgSpeed = durationMins > 0 ? (distMiles / (durationMins / 60)) : 30;
      
      let trafficLevel = 'Light';
      if (avgSpeed < 15) trafficLevel = 'Heavy';
      else if (avgSpeed < 25) trafficLevel = 'Moderate';

      // Parse Steps for Traffic Overlay Polylines
      const trafficSegments = [];
      const instructions = [];

      routeData.legs[0].steps.forEach(s => {
        instructions.push({
          instruction: s.maneuver.modifier ? `Turn ${s.maneuver.modifier} onto ${s.name || 'road'}` : `Continue on ${s.name || 'road'}`,
          distance: s.distance,
          duration: s.duration,
          type: s.maneuver.type,
          waypoint_index: 0
        });

        if (s.geometry && s.geometry.coordinates) {
          const segCoords = s.geometry.coordinates.map(c => [c[1], c[0]]);
          // Speed for this specific segment
          const segMiles = s.distance / 1609.34;
          const segHrs = s.duration / 3600;
          const segSpeed = segHrs > 0 ? (segMiles / segHrs) : 30;
          
          let color = '#4CAF50'; // Green
          if (segSpeed < 10) color = '#FF4C4C'; // Red
          else if (segSpeed < 20) color = '#FFA500'; // Orange

          trafficSegments.push({
            color,
            coordinates: segCoords
          });
        }
      });

      return {
        id: `route-${index}`,
        originalIndex: index,
        coordinates,
        trafficSegments,
        distance: distMiles.toFixed(1),
        duration: Math.round(durationMins),
        hazards: hazardsEncountered,
        score: safetyScore,
        trafficLevel,
        instructions
      };
    });

    // Categorize routes
    let fastestRoute = [...generatedRoutes].sort((a, b) => a.duration - b.duration)[0];
    let safestRoute = [...generatedRoutes].sort((a, b) => b.score - a.score)[0];
    
    if (safestRoute.id === fastestRoute.id && generatedRoutes.length > 1) {
      const remaining = generatedRoutes.filter(r => r.id !== fastestRoute.id);
      safestRoute = remaining.sort((a, b) => b.score - a.score)[0];
    }

    let alternateRoute = generatedRoutes.find(r => r.id !== fastestRoute.id && r.id !== safestRoute.id);

    fastestRoute.type = 'fastest';
    safestRoute.type = 'safest';
    if (alternateRoute) alternateRoute.type = 'alternate';

    const finalRoutes = [];
    finalRoutes.push(fastestRoute);
    if (safestRoute.id !== fastestRoute.id) finalRoutes.push(safestRoute);
    if (alternateRoute && alternateRoute.id !== fastestRoute.id && alternateRoute.id !== safestRoute.id) {
       finalRoutes.push(alternateRoute);
    }

    // AI Safety Assistant Message
    let aiMessage = '';
    if (weatherData.isRaining) {
      aiMessage += '⚠️ Wet roads detected. Potholes may be hidden under water. ';
    }
    
    if (fastestRoute.score < 50 && safestRoute.score > fastestRoute.score) {
      aiMessage += `The fastest route is highly dangerous with ${fastestRoute.hazards} severe hazards. The Safest Route is strongly recommended.`;
    } else if (fastestRoute.hazards > 0) {
      aiMessage += `Proceed with caution. The fastest route contains ${fastestRoute.hazards} reported hazards.`;
    } else {
      aiMessage += 'Roads look clear! Have a safe trip.';
    }

    res.json({
      weather: weatherData,
      aiAssistant: aiMessage,
      routes: finalRoutes
    });
  } catch (error) {
    console.error('Route generation error:', error.message);
    res.status(500).json({ message: 'Routing failed' });
  }
});

// @route   GET /api/maps/traffic
// @desc    Get live traffic overlay data (Mock)
router.get('/traffic', protect, async (req, res) => {
  // Returns mock traffic congestion zones based on hazard density
  res.json({
    status: 'Live',
    congestionPoints: [
      { lat: 37.7749, lng: -122.4194, level: 'High', delay: '5 mins' }
    ]
  });
});

module.exports = router;
