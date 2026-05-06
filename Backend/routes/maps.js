const express = require('express');
const router = express.Router();
const axios = require('axios');
const Report = require('../models/Report');
const Alert = require('../models/Alert');
const { protect } = require('../middleware/authMiddleware');

// Helpers for ORS
const getOrsKey = () => process.env.ORS_API_KEY || '5b3ce3597851110001cf6248c8dfa8910b0e457caee46cfbe694c979';

// @route   GET /api/maps/markers
router.get('/markers', async (req, res) => {
  try {
    const reports = await Report.find({ status: { $ne: 'Resolved' } });
    const markers = reports.map(r => ({
      id: r._id,
      lat: r.latitude || r.gps?.lat,
      lng: r.longitude || r.gps?.lng,
      severity: r.severity,
      confidence: r.confidence,
      imageUrl: r.imageUrl,
      location: r.locationName,
      createdAt: r.createdAt,
      type: r.hazardType || 'pothole',
      verificationCount: r.verificationCount || 0
    })).filter(m => m.lat && m.lng);
    res.json(markers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   GET /api/maps/heatmap
router.get('/heatmap', async (req, res) => {
  try {
    const reports = await Report.find({ status: { $ne: 'Resolved' } });
    const heatData = reports.map(r => {
      const lat = r.latitude || r.gps?.lat;
      const lng = r.longitude || r.gps?.lng;
      let intensity = 0.5;
      if (r.severity === 'Critical' || r.severity === 'Dangerous') intensity = 1.0;
      else if (r.severity === 'High') intensity = 0.8;
      else if (r.severity === 'Medium') intensity = 0.5;
      else if (r.severity === 'Low') intensity = 0.3;
      return [lat, lng, intensity];
    }).filter(m => m[0] && m[1]);
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
  const { start, end, demoMode } = req.body;
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
    const reports = await Report.find({ status: { $ne: 'Resolved' } });
    const hazards = reports.map(r => ({
      lat: r.latitude || r.gps?.lat,
      lng: r.longitude || r.gps?.lng,
      severity: r.severity
    })).filter(h => h.lat && h.lng);

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
            let weight = 0;
            // Severity weights
            if (h.severity === 'Low') weight = 1;         // Small pothole
            else if (h.severity === 'Medium') weight = 3; // Medium pothole
            else if (h.severity === 'High') weight = 7;   // Deep pothole
            else weight = 10;                             // Critical / Waterlogged

            // Crowd verification
            if (h.verificationCount >= 3) weight += 5;

            // Accident-prone assumption if critical + verified
            if (h.severity === 'Critical' && h.verificationCount >= 2) weight += 8;

            // Night / Weather penalty
            const currentHour = new Date().getHours();
            const isNight = currentHour >= 18 || currentHour <= 6;
            if (isNight) weight += 3;
            if (weatherData.isRaining && h.severity !== 'Low') weight += 5; 

            totalSeverityWeight += weight;
            break;
          }
        }
      });

      // Weather penalty for the whole route
      if (weatherData.isRaining) {
        totalSeverityWeight += 15; 
      }

      // Calculate AI Safety Score
      let safetyScore = 100 - totalSeverityWeight;
      // Slight variation based on distance/index to ensure routes don't mathematically collide on UI
      safetyScore -= (index * 1.5);
      safetyScore = Math.max(20, Math.round(safetyScore));

      // Ride Comfort Calculation
      let comfortRating = 'Excellent Comfort';
      if (safetyScore < 50) comfortRating = 'Rough Ride';
      else if (safetyScore < 70) comfortRating = 'Fair Comfort';
      else if (safetyScore < 85) comfortRating = 'Good Comfort';

      const distKm = routeData.distance / 1000;
      const durationMins = routeData.duration / 60;
      const avgSpeedKmH = durationMins > 0 ? (distKm / (durationMins / 60)) : 30;
      
      // Fuel efficiency based on speed and stops
      const fuelEfficiency = avgSpeedKmH > 35 && avgSpeedKmH < 80 ? 'High (Optimum)' : 'Average';

      let finalDuration = Math.round(durationMins);
      let trafficLevel = 'Light';
      if (avgSpeedKmH < 20) {
        trafficLevel = 'Heavy';
        finalDuration = Math.round(finalDuration * 1.35); // 35% live traffic penalty
      } else if (avgSpeedKmH < 40) {
        trafficLevel = 'Moderate';
        finalDuration = Math.round(finalDuration * 1.15); // 15% live traffic penalty
      }

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
          const segKm = s.distance / 1000;
          const segHrs = s.duration / 3600;
          const segSpeedKmH = segHrs > 0 ? (segKm / segHrs) : 30;
          
          let color = '#4CAF50'; // Green
          if (segSpeedKmH < 15) color = '#FF4C4C'; // Red
          else if (segSpeedKmH < 30) color = '#FFA500'; // Orange

          trafficSegments.push({
            color,
            coordinates: segCoords,
            isHeavy: segSpeedKmH < 15
          });
        }
      });

      return {
        id: `route-${index}`,
        originalIndex: index,
        coordinates,
        trafficSegments,
        distance: distKm.toFixed(1),
        duration: finalDuration,
        hazards: hazardsEncountered,
        score: safetyScore,
        comfortRating,
        fuelEfficiency,
        trafficLevel,
        instructions
      };
    });

    // Categorize routes by newly penalized finalDuration
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

    // Hackathon Demo Mode Logic
    if (demoMode) {
      fastestRoute.trafficLevel = 'Heavy';
      fastestRoute.duration += 12; // Artificially increase ETA
      
      // Inject heavy red congestion
      fastestRoute.trafficSegments.forEach((seg, idx) => {
        if (idx >= 1 && idx <= Math.floor(fastestRoute.trafficSegments.length / 2)) {
          seg.isHeavy = true;
          seg.color = '#FF4C4C'; // Red
        } else if (idx % 2 === 0) {
          seg.isHeavy = false;
          seg.color = '#FFA500'; // Orange
        }
      });

      if (safestRoute) {
        safestRoute.trafficLevel = 'Light';
        safestRoute.duration = fastestRoute.duration - 4; // Make it artificially faster to trigger AI recommendation
      }
    }

    // AI Safety Assistant Message
    let aiMessage = '';
    
    // Traffic AI Logic
    const hasHeavyTraffic = fastestRoute.trafficLevel === 'Heavy' || fastestRoute.trafficSegments.some(s => s.isHeavy);
    if (hasHeavyTraffic) {
      if (safestRoute && safestRoute.duration <= fastestRoute.duration + 5 && safestRoute.trafficLevel !== 'Heavy') {
        aiMessage += '🚨 Heavy traffic detected ahead. AI found a faster alternative. ';
      } else {
        aiMessage += '🚨 Heavy traffic ahead. ETA has been dynamically increased. ';
      }
    }

    if (weatherData.isRaining) {
      aiMessage += '⚠️ Wet roads detected. Potholes may be hidden under water. ';
    }
    
    if (fastestRoute.score < 50 && safestRoute.score > fastestRoute.score) {
      aiMessage += `The fastest route is highly dangerous with ${fastestRoute.hazards} severe hazards. The Safest Route is strongly recommended.`;
    } else if (fastestRoute.hazards > 0 && !hasHeavyTraffic) {
      aiMessage += `Proceed with caution. The fastest route contains ${fastestRoute.hazards} reported hazards.`;
    } else if (!hasHeavyTraffic) {
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
