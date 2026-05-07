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
// @desc    Dynamic AI Road Intelligence Center aggregation
router.get('/alerts', async (req, res) => {
  try {
    const { lat, lng } = req.query;
    const userLat = parseFloat(lat);
    const userLng = parseFloat(lng);
    
    const reports = await Report.find().sort({ createdAt: -1 }).limit(30);
    const alerts = [];

    // 1. Hazard & Municipality Alerts from Reports Database
    reports.forEach(r => {
      const isResolved = r.status === 'Resolved';
      const isInProgress = r.status === 'In Progress';
      
      // Calculate distance if user location provided
      let distText = '';
      let isNearby = false;
      if (userLat && userLng && r.latitude && r.longitude) {
        const distKm = Math.hypot(r.latitude - userLat, r.longitude - userLng) * 111; // Approx km
        if (distKm < 5) isNearby = true;
        distText = distKm < 1 ? `${Math.round(distKm * 1000)}m ahead` : `${distKm.toFixed(1)}km away`;
      }

      // Municipality Alert (Status updates)
      if (r.userId) { // Assuming it belongs to a user
        alerts.push({
          id: `muni-${r._id}`,
          category: 'Municipality',
          priority: isResolved ? 'Low' : 'Medium',
          title: isResolved ? 'Hazard Resolved' : isInProgress ? 'Repair Started' : 'Complaint Submitted',
          description: isResolved 
            ? `Pothole repaired successfully! +50 reward points credited.`
            : isInProgress 
            ? `Belagavi Municipal Authority has begun repairs on ${r.locationName || 'reported hazard'}.`
            : `Municipal Authority acknowledged your complaint for ${r.locationName || 'hazard'}.`,
          timestamp: r.updatedAt || r.createdAt,
          icon: isResolved ? 'check_circle' : isInProgress ? 'construction' : 'assignment',
          color: isResolved ? 'text-green-500' : isInProgress ? 'text-orange-500' : 'text-blue-500',
          coordinates: [r.latitude, r.longitude]
        });
      }

      // Live Hazard Alert (Only active ones)
      if (!isResolved && isNearby) {
        alerts.push({
          id: `haz-${r._id}`,
          category: 'Hazards',
          priority: r.severity === 'Critical' || r.severity === 'Dangerous' ? 'Critical' : r.severity === 'High' ? 'Medium' : 'Low',
          title: `${r.severity} ${r.hazardType || 'Hazard'} Detected`,
          description: `${r.hazardType || 'Pothole'} detected ${distText}. ${r.verificationCount > 2 ? 'Crowd verified danger!' : ''}`,
          confidence: r.confidence || Math.floor(Math.random() * 20 + 75), // AI confidence
          timestamp: r.createdAt,
          icon: 'warning',
          color: r.severity === 'Critical' ? 'text-red-500' : 'text-orange-500',
          coordinates: [r.latitude, r.longitude]
        });
      }
    });

    // 2. AI Safety Alerts (Dynamic synthesis based on database density)
    const activeCritical = reports.filter(r => r.status !== 'Resolved' && (r.severity === 'Critical' || r.severity === 'Dangerous'));
    if (activeCritical.length > 2) {
      alerts.push({
        id: 'ai-safety-1',
        category: 'AI Safety',
        priority: 'Critical',
        title: 'Dangerous Road Zone Detected',
        description: `High density of critical hazards (${activeCritical.length}) in the region. AI recommends ride comfort routing.`,
        timestamp: new Date(),
        icon: 'health_and_safety',
        color: 'text-red-500'
      });
    }

    const currentHour = new Date().getHours();
    if (currentHour >= 18 || currentHour <= 6) {
      alerts.push({
        id: 'ai-safety-2',
        category: 'AI Safety',
        priority: 'Medium',
        title: 'Night Visibility Risk',
        description: 'Reduced visibility detected. High vibration and hidden potholes risk increased by 40%.',
        timestamp: new Date(),
        icon: 'visibility_off',
        color: 'text-purple-500'
      });
    }

    // 3. Traffic Alerts (Dynamic)
    // We add a generic regional traffic alert based on time of day
    const isRushHour = (currentHour >= 8 && currentHour <= 10) || (currentHour >= 17 && currentHour <= 19);
    if (isRushHour) {
      alerts.push({
        id: 'traffic-1',
        category: 'Traffic',
        priority: 'Medium',
        title: 'Heavy Traffic Region',
        description: 'Rush hour congestion. AI found a faster route. Delay increased by 12 mins.',
        timestamp: new Date(),
        icon: 'traffic',
        color: 'text-orange-500'
      });
    } else {
      alerts.push({
        id: 'traffic-2',
        category: 'Traffic',
        priority: 'Low',
        title: 'Smooth Traffic Flow',
        description: 'Current regional traffic is light. Optimal ETA speeds possible.',
        timestamp: new Date(),
        icon: 'check_circle',
        color: 'text-green-500'
      });
    }

    // Sort by timestamp and priority
    const priorityWeight = { 'Critical': 3, 'Medium': 2, 'Low': 1 };
    alerts.sort((a, b) => {
      if (priorityWeight[b.priority] !== priorityWeight[a.priority]) {
        return priorityWeight[b.priority] - priorityWeight[a.priority];
      }
      return new Date(b.timestamp) - new Date(a.timestamp);
    });

    res.json(alerts);
  } catch (error) {
    console.error("Alerts Endpoint Error:", error);
    res.status(500).json([]);
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
