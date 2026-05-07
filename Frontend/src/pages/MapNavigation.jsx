import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMapEvents, useMap, Circle } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.heat';
import { motion, AnimatePresence } from 'framer-motion';
import TopAppBar from '../components/TopAppBar';
import BottomNavBar from '../components/BottomNavBar';
import api from '../services/api';
import toast from 'react-hot-toast';
import { useLocation } from 'react-router-dom';

// ── Leaflet Setup ──
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const getSeverityColor = (severity) => {
  if (severity === 'Dangerous' || severity === 'Critical') return '#FF4C4C'; // Red
  if (severity === 'High') return '#FF7043'; // Deep Orange
  if (severity === 'Medium') return '#FFA500'; // Orange
  return '#4CAF50'; // Green
};

const createCustomIcon = (marker) => {
  const color = getSeverityColor(marker.severity);
  const isSevere = marker.severity === 'Dangerous' || marker.severity === 'Critical';
  const isVerified = marker.verificationCount >= 2;
  
  const size = isSevere ? 20 : marker.severity === 'High' ? 16 : 12;
  const pulseClass = (isSevere && isVerified) ? 'animate-[ping_1.5s_cubic-bezier(0,0,0.2,1)_infinite]' : 'opacity-40 animate-pulse';

  return L.divIcon({
    className: 'custom-leaflet-icon',
    html: `
      <div class="relative flex items-center justify-center w-8 h-8">
        <div class="absolute inset-0 rounded-full ${pulseClass}" style="background-color: ${color}"></div>
        <div class="relative z-[1] rounded-full border-2 border-white shadow-md" style="background-color: ${color}; width: ${size}px; height: ${size}px;"></div>
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });
};

const userIcon = L.divIcon({
  className: 'user-location-icon',
  html: `
    <div class="relative flex items-center justify-center w-12 h-12">
      <div class="absolute inset-0 rounded-full bg-blue-500 opacity-40 animate-ping"></div>
      <div class="relative z-[1] w-6 h-6 rounded-full border-4 border-white bg-blue-600 shadow-xl">
        <div class="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-white rounded-full"></div>
      </div>
    </div>
  `,
  iconSize: [48, 48],
  iconAnchor: [24, 24],
});

// ── Heatmap Component ──
function HeatmapLayer({ points }) {
  const map = useMap();
  useEffect(() => {
    if (!map || points.length === 0) return;
    // @ts-ignore
    const heat = L.heatLayer(points, {
      radius: 25,
      blur: 15,
      maxZoom: 17,
      gradient: { 0.4: 'green', 0.6: 'yellow', 0.8: 'orange', 1.0: 'red' }
    }).addTo(map);

    return () => { map.removeLayer(heat); };
  }, [map, points]);
  return null;
}

// ── Map Click Event for "Choose from Map" ──
function MapEvents({ onMapClick }) {
  useMapEvents({
    click(e) {
      onMapClick(e.latlng);
    }
  });
  return null;
}

function MapSizeInvalidator({ isNavigating, routesCount, selectedRouteId }) {
  const map = useMap();

  useEffect(() => {
    const invalidate = () => map.invalidateSize({ animate: false });
    let timeoutId;
    const frame = window.requestAnimationFrame(() => {
      invalidate();
      timeoutId = window.setTimeout(invalidate, 250);
    });

    window.addEventListener('resize', invalidate);
    return () => {
      window.cancelAnimationFrame(frame);
      if (timeoutId) window.clearTimeout(timeoutId);
      window.removeEventListener('resize', invalidate);
    };
  }, [map, isNavigating, routesCount, selectedRouteId]);

  return null;
}

function MapController({ center, zoom, activeRoute, isNavigating }) {
  const map = useMap();
  useEffect(() => {
    if (center && center.length === 2 && !isNaN(center[0])) {
      try {
        map.flyTo(center, zoom, { animate: true, duration: 1.5 });
      } catch (e) {}
    }
  }, [center, zoom, map]);

  useEffect(() => {
    if (activeRoute && activeRoute.coordinates && activeRoute.coordinates.length > 0 && !isNavigating) {
      try {
        const bounds = L.latLngBounds(activeRoute.coordinates);
        if (bounds.isValid()) {
          // Add asymmetrical padding so the route doesn't hide under the bottom sheet (which takes up to 60vh)
          const bottomPadding = window.innerHeight > 600 ? window.innerHeight * 0.5 : 300;
          map.fitBounds(bounds, { 
            paddingTopLeft: [50, 50], 
            paddingBottomRight: [50, bottomPadding], 
            maxZoom: 16 
          });
        }
      } catch (e) {
        console.error('Invalid bounds:', e);
      }
    }
  }, [activeRoute, isNavigating, map]);

  return null;
}

class ErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { hasError: false, error: null, errorInfo: null }; }
  static getDerivedStateFromError(error) { return { hasError: true, error }; }
  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });
    console.error("ErrorBoundary caught an error", error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 20, color: 'red', background: '#fff', height: '100vh', overflow: 'auto' }}>
          <h1>Map Rendering Crash</h1>
          <pre style={{ whiteSpace: 'pre-wrap' }}>{this.state.error?.toString()}</pre>
          <pre style={{ fontSize: '10px' }}>{this.state.errorInfo?.componentStack}</pre>
        </div>
      );
    }
    return this.props.children;
  }
}

function MapNavigation() {
  const location = useLocation();
  const focusReport = location.state?.focusReport;

  // ── Map State ──
  const [markers, setMarkers] = useState([]);
  const [heatData, setHeatData] = useState([]);
  const [userLocation, setUserLocation] = useState(null);
  const [mapCenter, setMapCenter] = useState([19.0760, 72.8777]); 
  const [mapZoom, setMapZoom] = useState(13);

  // ── Search & Input State ──
  const [sourceQuery, setSourceQuery] = useState('');
  const [destQuery, setDestQuery] = useState('');
  const [sourceCoords, setSourceCoords] = useState(null);
  const [destCoords, setDestCoords] = useState(null);
  const [searchResults, setSearchResults] = useState([]);
  const [activeInput, setActiveInput] = useState(null);
  const [isSelectingFromMap, setIsSelectingFromMap] = useState(null);

  // ── Routing & Navigation State ──
  const [routes, setRoutes] = useState([]); 
  const [selectedRoute, setSelectedRoute] = useState(null);
  const [isNavigating, setIsNavigating] = useState(false);
  const [currentInstruction, setCurrentInstruction] = useState('Proceed to route');
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [isListening, setIsListening] = useState(false);
  const [isDemoMode, setIsDemoMode] = useState(false);

  // ── AI & Data Features ──
  const [predictedHazards, setPredictedHazards] = useState([]);
  const [verificationPopup, setVerificationPopup] = useState(null);
  const [aiAssistantMsg, setAiAssistantMsg] = useState('');

  // ── Refs ──
  const watchIdRef = useRef(null);
  const lastSpokenHazardRef = useRef(null);
  const verifiedPotholes = useRef(new Set());
  const searchTimeout = useRef(null);
  const initialLocationSetRef = useRef(false);
  const sourceQueryRef = useRef(sourceQuery);
  
  useEffect(() => {
    if (sourceCoords && destCoords) {
      generateRoutesAuto(sourceCoords, destCoords);
    }
  }, [isDemoMode]);

  useEffect(() => {
    sourceQueryRef.current = sourceQuery;
  }, [sourceQuery]);

  // ── 1. Aggressive GPS Acquisition (Restored after merge) ──
  useEffect(() => {
    fetchMapData();
    
    if (!navigator.geolocation) {
      toast.error('Geolocation not supported');
      return;
    }

    const onLocationSuccess = async (pos) => {
      const { latitude, longitude, accuracy } = pos.coords;
      const loc = [latitude, longitude];
      console.log(`[GPS] Fix acquired: ${latitude}, ${longitude} (±${accuracy}m)`);
      
      setUserLocation(loc);

      // If we haven't locked a high-accuracy center yet, keep following the GPS
      if (!initialLocationSetRef.current) {
        setMapCenter(loc);
        setSourceCoords(loc);

        // If accuracy is good (less than 150m), lock it so it stops jumping
        if (accuracy < 150) {
          initialLocationSetRef.current = true;
          console.log('[GPS] High accuracy fix locked.');
        }

        // Update UI Label
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=10`);
          const data = await res.json();
          if (data && data.address) {
            const city = data.address.city || data.address.town || data.address.village || data.address.suburb || 'Location';
            setSourceQuery(`Your Location (${city})`);
          }
        } catch(e) {}
      } else if (sourceQueryRef.current.includes('Your Location') && destCoords) {
        // If we already have a route but our 'Your Location' just shifted significantly (more than 500m)
        // re-calculate the route automatically from the new precise location
        const dist = Math.hypot(latitude - sourceCoords[0], longitude - sourceCoords[1]);
        if (dist > 0.005) { // ~500 meters
          console.log('[GPS] Location shift detected while routing. Updating route...');
          setSourceCoords(loc);
          generateRoutesAuto(loc, destCoords);
        }
      }
    };

    const onLocationError = (err) => {
      console.warn('[GPS] Error:', err.code, err.message);
      if (!userLocation) toast.error('Waiting for GPS signal...');
    };

    // Quick initial check
    navigator.geolocation.getCurrentPosition(onLocationSuccess, onLocationError, { enableHighAccuracy: true });

    // Continuous tracking
    const id = navigator.geolocation.watchPosition(onLocationSuccess, onLocationError, { 
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 0 
    });
    watchIdRef.current = id;

    return () => {
      if (watchIdRef.current) navigator.geolocation.clearWatch(watchIdRef.current);
    };
  }, []);

  // ── Voice Alert Helper ──
  const speak = (text) => {
    if (!voiceEnabled || !('speechSynthesis' in window)) return;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    window.speechSynthesis.cancel(); 
    window.speechSynthesis.speak(utterance);
  };

  // ── Voice Search (Speech Recognition) ──
  const startVoiceSearch = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast.error('Voice search not supported in this browser.');
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.onstart = () => setIsListening(true);
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setDestQuery(transcript);
      setIsListening(false);
      handleSearchInput({ target: { value: transcript } }, 'dest');
    };
    recognition.onerror = () => {
      setIsListening(false);
      toast.error('Voice recognition failed.');
    };
    recognition.onend = () => setIsListening(false);
    recognition.start();
  };

  // ── Fetch Live Map Data ──
  const fetchMapData = async () => {
    try {
      const [markerRes, heatRes] = await Promise.all([
        api.get('/maps/markers'),
        api.get('/maps/heatmap')
      ]);
      setMarkers(markerRes.data);
      setHeatData(heatRes.data);
    } catch (err) {
      console.error('Failed to fetch map data:', err);
    }
  };

  useEffect(() => {
    const refreshMapData = () => fetchMapData();
    const refreshWhenVisible = () => {
      if (!document.hidden) refreshMapData();
    };

    const intervalId = window.setInterval(refreshMapData, 30000);
    window.addEventListener('focus', refreshMapData);
    document.addEventListener('visibilitychange', refreshWhenVisible);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener('focus', refreshMapData);
      document.removeEventListener('visibilitychange', refreshWhenVisible);
    };
  }, []);

  useEffect(() => {
    sourceQueryRef.current = sourceQuery;
  }, [sourceQuery]);

  // ── 1. Aggressive GPS Acquisition (Essential Fix) ──
  useEffect(() => {
    fetchMapData();
    
    if (!navigator.geolocation) {
      toast.error('Geolocation not supported');
      return;
    }

    const onLocationSuccess = async (pos) => {
      const { latitude, longitude, accuracy } = pos.coords;
      const loc = [latitude, longitude];
      console.log(`[GPS] Fix acquired: ${latitude}, ${longitude} (±${accuracy}m)`);
      
      setUserLocation(loc);

      // If we haven't locked a high-accuracy center yet, keep following the GPS
      if (!initialLocationSetRef.current) {
        setMapCenter(loc);

        // If accuracy is good (less than 150m), lock it so it stops jumping
        if (accuracy < 150) {
          initialLocationSetRef.current = true;
          console.log('[GPS] High accuracy fix locked.');
        }

        // Wait for the user to explicitly click "Use My Current Location" or "Your Location"
      } else if (sourceQueryRef.current.includes('Your Location') && destCoords && sourceCoords) {
        // If we already have a route but our 'Your Location' just shifted significantly (more than 500m)
        // re-calculate the route automatically from the new precise location
        const dist = Math.hypot(latitude - sourceCoords[0], longitude - sourceCoords[1]);
        if (dist > 0.005) { // ~500 meters
          console.log('[GPS] Location shift detected while routing. Updating route...');
          setSourceCoords(loc);
          generateRoutesAuto(loc, destCoords);
        }
      }
    };

    const onLocationError = (err) => {
      console.warn('[GPS] Error:', err.code, err.message);
      if (!userLocation) toast.error('Waiting for GPS signal...');
    };

    // Quick initial check
    navigator.geolocation.getCurrentPosition(onLocationSuccess, onLocationError, { enableHighAccuracy: true });

    // Continuous tracking
    const id = navigator.geolocation.watchPosition(onLocationSuccess, onLocationError, { 
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 0 
    });
    watchIdRef.current = id;

    return () => {
      if (watchIdRef.current) navigator.geolocation.clearWatch(watchIdRef.current);
    };
  }, []);

  useEffect(() => {
    if (!focusReport || !Number.isFinite(Number(focusReport.lat)) || !Number.isFinite(Number(focusReport.lng))) return;

    const coords = [Number(focusReport.lat), Number(focusReport.lng)];
    const timeoutId = window.setTimeout(() => {
      setMapCenter(coords);
      setMapZoom(17);
      fetchMapData();
    }, 0);
    toast.success('Report location shown on map');

    return () => window.clearTimeout(timeoutId);
  }, [focusReport]);

  // ── Generate Smart Routes (Auto-Triggered) ──
  const generateRoutesAuto = async (startLoc, endLoc) => {
    if (!startLoc || !endLoc) return;
    toast.loading('Analyzing live roads and traffic...', { id: 'route' });
    try {
      const res = await api.post('/maps/routes', {
        start: { lat: startLoc[0], lng: startLoc[1] },
        end: { lat: endLoc[0], lng: endLoc[1] },
        demoMode: isDemoMode
      });
      const { routes: generatedRoutes, aiAssistant } = res.data;
      
      if (generatedRoutes.length > 0) {
        setRoutes(generatedRoutes);
        setAiAssistantMsg(aiAssistant);
        
        // Select safest by default
        const safest = generatedRoutes.find(r => r.type === 'safest') || generatedRoutes[0];
        setSelectedRoute(safest);
        
        toast.success('Routes generated successfully!', { id: 'route' });
        
        // AI Hazard Prediction
        if (safest && safest.hazards > 3 && safest.coordinates && safest.coordinates.length > 0) {
           const hazardZone = safest.coordinates[Math.floor(safest.coordinates.length / 2)];
           if (hazardZone && hazardZone.length === 2 && !isNaN(hazardZone[0])) {
             setPredictedHazards([hazardZone]);
             toast('AI Prediction: High accident probability area detected.', { icon: '🤖', duration: 5000 });
           }
        }

        if (isDemoMode && aiAssistant && aiAssistant.includes('Heavy traffic detected ahead')) {
          speak('Traffic congestion ahead. Switching to optimized route.');
        } else {
          speak(aiAssistant || 'Safe route generated. You can start navigation.');
        }
      } else {
        toast.error('No routes found', { id: 'route' });
      }
    } catch (err) {
      console.error(err);
      toast.error('Routing failed. Try different locations.', { id: 'route' });
    }
  };

  const handleUseCurrentLocation = () => {
    if (!userLocation) {
      toast.error('GPS location not available yet.');
      return;
    }
    if (activeInput === 'source') {
      setSourceQuery('Your Location');
      setSourceCoords(userLocation);
      if (destCoords) generateRoutesAuto(userLocation, destCoords);
    } else {
      setDestQuery('Your Location');
      setDestCoords(userLocation);
      if (sourceCoords) generateRoutesAuto(sourceCoords, userLocation);
    }
    setSearchResults([]);
    setIsSelectingFromMap(null);
    setActiveInput(null);
    setMapCenter(userLocation);
  };

  // ── Input Handlers ──
  const handleMapClick = async (latlng) => {
    if (!isSelectingFromMap) return;
    const coords = [latlng.lat, latlng.lng];
    
    let placeName = 'Selected Location';
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latlng.lat}&lon=${latlng.lng}`);
      const data = await res.json();
      if (data && data.display_name) placeName = data.display_name.split(',')[0];
    } catch(e) {}

    if (isSelectingFromMap === 'source') {
      setSourceCoords(coords);
      setSourceQuery(placeName);
      if (destCoords) generateRoutesAuto(coords, destCoords);
    } else {
      setDestCoords(coords);
      setDestQuery(placeName);
      if (sourceCoords) generateRoutesAuto(sourceCoords, coords);
    }
    setIsSelectingFromMap(null);
    setMapCenter(coords);
  };

  const handleSearchInput = (e, type) => {
    const val = e.target.value;
    if (type === 'source') {
      setSourceQuery(val);
      if (val !== sourceQuery) { setRoutes([]); setSelectedRoute(null); setSourceCoords(null); }
    } else {
      setDestQuery(val);
      if (val !== destQuery) { setRoutes([]); setSelectedRoute(null); setDestCoords(null); }
    }
    setActiveInput(type);
    
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    
    if (val.length < 3) {
      setSearchResults([]);
      return;
    }

    searchTimeout.current = setTimeout(async () => {
      try {
        const res = await api.get(`/maps/search?q=${encodeURIComponent(val)}`);
        setSearchResults(res.data);
      } catch (err) {
        console.error('Search failed', err);
      }
    }, 500);
  };

  const selectSearchResult = (item) => {
    const coords = [item.lat, item.lng];
    const name = item.name.split(',')[0];
    setSearchResults([]);
    setMapCenter(coords);
    setMapZoom(15);

    if (activeInput === 'source') {
      setSourceQuery(name);
      setSourceCoords(coords);
      if (destCoords) generateRoutesAuto(coords, destCoords);
    } else {
      setDestQuery(name);
      setDestCoords(coords);
      if (sourceCoords) {
        generateRoutesAuto(sourceCoords, coords);
      }
    }
  };

  const startMapSelection = () => {
    setIsSelectingFromMap(activeInput);
    setSearchResults([]);
    toast('Tap anywhere on the map to drop a pin', { icon: '📍', duration: 4000 });
  };

  const swapLocations = () => {
    const sQ = sourceQuery; const dQ = destQuery;
    const sC = sourceCoords; const dC = destCoords;
    setSourceQuery(dQ); setDestQuery(sQ);
    setSourceCoords(dC); setDestCoords(sC);
    if (sC && dC) {
      generateRoutesAuto(dC, sC);
    } else {
      setRoutes([]);
      setSelectedRoute(null);
    }
  };

  // ── REAL Live Navigation ──
  const startNavigation = () => {
    if (!selectedRoute) return;
    setIsNavigating(true);
    setMapZoom(18);
    speak(`Starting navigation on the ${selectedRoute.type} route. Head towards the highlighted path.`);

    if (navigator.geolocation) {
      watchIdRef.current = navigator.geolocation.watchPosition(
        (pos) => {
          const loc = [pos.coords.latitude, pos.coords.longitude];
          setUserLocation(loc);
          setMapCenter(loc);

          let closestDist = Infinity;
          let closestIdx = 0;
          selectedRoute.coordinates.forEach((c, idx) => {
             const d = Math.hypot(c[0] - loc[0], c[1] - loc[1]);
             if (d < closestDist) { closestDist = d; closestIdx = idx; }
          });

          // Rerouting if too far (500m)
          if (closestDist > 0.005) { 
            speak('You are off route. Recalculating safer route.');
            toast.error('Rerouting...');
            setSourceCoords(loc);
            setSourceQuery('Your Location');
            generateRoutesAuto(loc, destCoords);
            return;
          }

          const upcomingInstr = selectedRoute.instructions?.find(i => i.waypoint_index > closestIdx);
          if (upcomingInstr && upcomingInstr.instruction !== currentInstruction) {
             setCurrentInstruction(upcomingInstr.instruction);
             if (upcomingInstr.instruction.includes('Turn')) {
               speak(upcomingInstr.instruction);
             }
          }

          const nearbyHazard = markers.find(m => Math.hypot(m.lat - loc[0], m.lng - loc[1]) < 0.0015);
          if (nearbyHazard && lastSpokenHazardRef.current !== nearbyHazard.id) {
            if (nearbyHazard.severity === 'Critical') {
              speak('Warning. Critical pothole hazard detected ahead.');
            } else if (nearbyHazard.severity === 'High') {
              speak('Caution. Dangerous road condition ahead.');
            }
            lastSpokenHazardRef.current = nearbyHazard.id;
          }

          const verifyHazard = markers.find(m => Math.hypot(m.lat - loc[0], m.lng - loc[1]) < 0.0003 && !verifiedPotholes.current.has(m.id));
          if (verifyHazard && !verificationPopup) {
            setVerificationPopup(verifyHazard);
            speak('You are near a reported hazard. Is it still there?');
          }
        },
        (err) => console.warn('GPS Error:', err),
        { enableHighAccuracy: true, maximumAge: 0 }
      );
    } else {
      toast.error('GPS tracking not supported.');
    }
  };

  const endNavigation = () => {
    if (watchIdRef.current) navigator.geolocation.clearWatch(watchIdRef.current);
    setIsNavigating(false);
    setMapZoom(14);
    setVerificationPopup(null);
    speak('Navigation ended.');
  };

  const submitCrowdVerification = async (isStillActive, markerId) => {
    const id = markerId || (verificationPopup && verificationPopup.id);
    if (!id) return;
    
    // Optimistic UI updates
    verifiedPotholes.current.add(id);
    setMarkers(prev => prev.map(m => {
      if (m.id === id) {
        return { ...m, verificationCount: (m.verificationCount || 0) + (isStillActive ? 1 : -1) };
      }
      return m;
    }));

    toast.success(isStillActive ? 'Thanks for verifying! Marker confidence increased.' : 'Thanks! Marker will be removed soon.');
    if (verificationPopup && verificationPopup.id === id) {
      setVerificationPopup(null);
    }

    try {
      await api.put(`/reports/verify/${id}`, { action: isStillActive ? 'exists' : 'resolved' });
    } catch (err) {
      console.error('Verification failed', err);
    }
  };

  const clearRoutes = () => {
    setRoutes([]);
    setSelectedRoute(null);
    setDestQuery('');
    setDestCoords(null);
  };

  // Route Colors: Blue -> fastest, Green -> safest, Orange -> alternate
  const getRouteColor = (type) => {
    if (type === 'fastest') return '#2196F3'; // Blue
    if (type === 'safest') return '#4CAF50'; // Green
    return '#FF9800'; // Orange
  };

  const formatTime = (mins) => {
    if (mins < 60) return `${mins} mins`;
    const hrs = Math.floor(mins / 60);
    const m = mins % 60;
    return m > 0 ? `${hrs} hrs ${m} mins` : `${hrs} hrs`;
  };

  const fastestRoute = routes.find(rt => rt.type === 'fastest');
  const getHazardReductionText = (r) => {
    if (!fastestRoute || fastestRoute.hazards <= r.hazards) return null;
    const reduction = Math.round(((fastestRoute.hazards - r.hazards) / fastestRoute.hazards) * 100);
    return `${reduction}% Hazard Reduction`;
  };

  return (
    <div className="bg-surface text-on-surface h-[100dvh] w-full overflow-hidden flex flex-col relative font-sans">
      {!isNavigating && (
        <TopAppBar 
          showBack={routes.length > 0} 
          onBack={routes.length > 0 ? clearRoutes : undefined} 
        />
      )}

      <main className={`flex-1 relative w-full h-full overflow-hidden`}>
        
        {/* Floating Demo Mode Badge */}
        {isDemoMode && (
          <div className="absolute top-4 right-4 z-[2000] bg-red-600 text-white px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-2 shadow-lg animate-pulse pointer-events-none">
            <span className="material-symbols-outlined text-[14px]">science</span>
            Demo Simulation Active
          </div>
        )}

        {/* Navigation Mode Header */}
        <AnimatePresence>
          {isNavigating && (
            <motion.div 
              key="nav-header"
              initial={{ y: -100 }} animate={{ y: 0 }} exit={{ y: -100 }}
              className="absolute top-0 left-0 w-full z-[1000] bg-green-700 text-white p-4 shadow-xl flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-4xl">directions_car</span>
                <div>
                  <h1 className="text-xl font-bold leading-tight">{currentInstruction}</h1>
                  <p className="text-green-200 text-sm font-medium tracking-wide">Live GPS Tracking Active</p>
                </div>
              </div>
              <button onClick={endNavigation} className="bg-red-600 px-5 py-2.5 rounded-full font-bold shadow-md hover:bg-red-700 transition-colors">
                Exit
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Google Maps Style Search Card ── */}
        <AnimatePresence>
          {!isNavigating && routes.length === 0 && (
            <motion.div 
              key="search-card"
              initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -20, opacity: 0 }}
              className="absolute top-4 left-4 right-4 md:top-8 md:max-w-md md:left-8 z-[1000]"
            >
              <div className="bg-surface rounded-2xl shadow-xl border border-outline-variant/20 p-4 relative overflow-visible">
                {isSelectingFromMap && (
                  <div className="absolute -top-12 left-0 w-full bg-primary text-white p-2 rounded-lg text-center font-bold shadow-lg animate-pulse">
                    Tap on map to select {isSelectingFromMap}
                  </div>
                )}
                
                <div className="flex gap-3">
                  <div className="flex flex-col items-center justify-center gap-1 w-6 py-3">
                    <div className="w-3.5 h-3.5 rounded-full border-[3px] border-primary bg-surface"></div>
                    <div className="w-[2px] h-full bg-outline-variant/40 flex-1 rounded-full"></div>
                    <div className="w-3.5 h-3.5 rounded-sm bg-red-500"></div>
                  </div>
                  
                  <div className="flex-1 flex flex-col gap-3 relative">
                    <input 
                      type="text" 
                      value={sourceQuery}
                      onChange={(e) => handleSearchInput(e, 'source')}
                      onFocus={() => setActiveInput('source')}
                      placeholder="Choose starting point" 
                      className="w-full bg-surface-container-low border border-transparent rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:bg-surface focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all text-on-surface"
                    />
                    
                    <div className="relative">
                      <input 
                        type="text" 
                        value={destQuery}
                        onChange={(e) => handleSearchInput(e, 'dest')}
                        onFocus={() => setActiveInput('dest')}
                        placeholder="Search destination" 
                        className="w-full bg-surface-container-lowest border border-outline-variant/30 shadow-sm rounded-xl px-4 py-3.5 text-base font-bold focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all text-on-surface pr-10"
                      />
                      <button 
                        onClick={startVoiceSearch}
                        className={`absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center rounded-full transition-colors ${isListening ? 'bg-error text-white animate-pulse' : 'text-on-surface-variant hover:bg-surface-container'}`}
                      >
                        <span className="material-symbols-outlined text-[20px]">mic</span>
                      </button>
                    </div>
                    
                    {/* Autocomplete Dropdown */}
                    {searchResults.length > 0 && (
                      <div className="absolute top-full left-0 w-full bg-surface border border-outline-variant/20 shadow-2xl rounded-2xl mt-2 z-[1001] max-h-64 overflow-y-auto overflow-x-hidden">
                        <div onClick={handleUseCurrentLocation} className="px-4 py-3 border-b border-outline-variant/10 hover:bg-surface-container flex items-center gap-3 cursor-pointer text-sm text-primary font-bold">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary"><span className="material-symbols-outlined text-[18px]">my_location</span></div>
                          Use Current Location
                        </div>
                        <div onClick={startMapSelection} className="px-4 py-3 border-b border-outline-variant/10 hover:bg-surface-container flex items-center gap-3 cursor-pointer text-sm text-secondary font-bold">
                          <div className="w-8 h-8 rounded-full bg-secondary/10 flex items-center justify-center"><span className="material-symbols-outlined text-[18px]">pin_drop</span></div>
                          Choose from Map
                        </div>
                        {searchResults.map((item, idx) => (
                          <div key={idx} onClick={() => selectSearchResult(item)} className="px-4 py-3 border-b border-outline-variant/10 hover:bg-surface-container flex items-center gap-3 cursor-pointer text-sm">
                            <div className="w-8 h-8 rounded-full bg-surface-container-high flex items-center justify-center text-on-surface-variant"><span className="material-symbols-outlined text-[18px]">location_on</span></div>
                            <span className="truncate flex-1 font-medium text-on-surface">{item.name}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex flex-col items-center justify-center">
                    <button onClick={swapLocations} className="w-10 h-10 rounded-full bg-surface-container-low hover:bg-surface-container flex items-center justify-center transition-colors">
                      <span className="material-symbols-outlined text-on-surface-variant text-[20px]">swap_vert</span>
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Leaflet Map */}
        <div className="absolute inset-0 w-full h-full">
          <MapContainer center={mapCenter} zoom={mapZoom} className="h-full w-full" style={{ zIndex: 0 }} zoomControl={false}>
            <MapController center={mapCenter} zoom={mapZoom} activeRoute={selectedRoute} isNavigating={isNavigating} />
            <MapEvents onMapClick={handleMapClick} />
            <MapSizeInvalidator isNavigating={isNavigating} routesCount={routes.length} selectedRouteId={selectedRoute?.id} />
            <TileLayer attribution='&copy; OpenStreetMap' url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" />

            {showHeatmap && heatData.length > 0 && <HeatmapLayer points={heatData} />}

            {predictedHazards.filter(hz => hz && hz.length === 2 && !isNaN(hz[0])).map((hz, i) => (
              <Circle key={`pred-${i}`} center={hz} radius={400} pathOptions={{ color: 'red', fillColor: 'red', fillOpacity: 0.2 }}>
                <Popup>AI Prediction: High Accident Zone</Popup>
              </Circle>
            ))}

            {markers.map((marker) => (
              <Marker key={marker.id} position={[marker.lat, marker.lng]} icon={createCustomIcon(marker)}>
                <Popup className="rounded-2xl shadow-xl border-none overflow-hidden p-0">
                  <div className="w-[220px]">
                    {marker.imageUrl && <img src={marker.imageUrl} alt="Pothole" className="w-full h-28 object-cover" />}
                    <div className="p-3">
                      <h3 className="font-bold text-base mb-1 text-on-surface uppercase tracking-wide">{marker.type || 'Hazard'} - {marker.severity}</h3>
                      <p className="text-xs text-gray-600 mb-2">{marker.location || 'Unknown location'}</p>
                      <div className="flex gap-2 mb-2">
                        <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-700 text-xs font-bold">{marker.verificationCount || 0} Verifications</span>
                        {marker.confidence > 0 && <span className="px-2 py-0.5 rounded bg-purple-100 text-purple-700 text-xs font-bold">AI: {marker.confidence}%</span>}
                      </div>
                      
                      {/* Embedded Verification UI */}
                      <div className="mt-3 pt-3 border-t border-outline-variant/20">
                        <p className="text-on-surface mb-2 font-medium text-sm leading-snug">Is the hazard still there?</p>
                        <div className="flex gap-2">
                          <button onClick={() => submitCrowdVerification(true, marker.id)} className="flex-1 py-1.5 bg-[#4CAF50] hover:bg-green-600 text-white font-bold rounded-lg transition-colors flex items-center justify-center gap-1 text-xs">
                            <span className="material-symbols-outlined text-[16px]">thumb_up</span> Yes
                          </button>
                          <button onClick={() => submitCrowdVerification(false, marker.id)} className="flex-1 py-1.5 bg-[#F44336] hover:bg-red-600 text-white font-bold rounded-lg transition-colors flex items-center justify-center gap-1 text-xs">
                            <span className="material-symbols-outlined text-[16px]">thumb_down</span> No
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </Popup>
              </Marker>
            ))}

            {userLocation && <Marker position={userLocation} icon={userIcon} zIndexOffset={1000} />}
            {destCoords && (
              <Marker position={destCoords} zIndexOffset={999}>
                <Popup>Destination: {destQuery || 'Selected Location'}</Popup>
              </Marker>
            )}

            {/* Inactive Routes */}
            {!isNavigating && routes.filter(r => r.id !== selectedRoute?.id).map(r => (
              <Polyline 
                key={r.id} 
                positions={r.coordinates} 
                color={getRouteColor(r.type)} 
                weight={6} 
                opacity={0.6} 
                dashArray="1, 12" 
                eventHandlers={{ click: () => setSelectedRoute(r) }} 
              />
            ))}

            {/* Active Route - Multi-colored Live Traffic Overlay */}
            {selectedRoute && selectedRoute.trafficSegments && (
              selectedRoute.trafficSegments
                .filter(seg => seg && seg.coordinates && seg.coordinates.length > 0)
                .map((seg, idx) => (
                  <React.Fragment key={`seg-wrapper-${idx}`}>
                    <Polyline 
                      key={`seg-${idx}`} 
                      positions={seg.coordinates} 
                      color={seg.color} 
                      weight={seg.isHeavy ? 9 : 7} 
                      opacity={1} 
                      className={seg.isHeavy ? 'traffic-heavy-glow animate-pulse' : ''}
                    />
                    {seg.isHeavy && seg.coordinates.length > 2 && (
                      <Marker 
                        position={seg.coordinates[Math.floor(seg.coordinates.length / 2)]} 
                        icon={L.divIcon({
                          className: 'bg-transparent',
                          html: `<div class="bg-red-600 text-white text-[10px] font-bold px-2 py-1 rounded-full shadow-lg border-2 border-white whitespace-nowrap animate-bounce">Heavy Traffic Ahead</div>`,
                          iconSize: [120, 24],
                          iconAnchor: [60, 12]
                        })} 
                      />
                    )}
                  </React.Fragment>
              ))
            )}
            
            {/* Fallback */}
            {selectedRoute && !selectedRoute.trafficSegments && (
              <Polyline positions={selectedRoute.coordinates} color={getRouteColor(selectedRoute.type)} weight={7} opacity={1} />
            )}
          </MapContainer>
        </div>

        {/* Map Floating Controls */}
        {!isNavigating && (
          <div className={`absolute right-4 flex flex-col gap-3 z-[500] transition-all duration-300 ${routes.length > 0 ? 'bottom-[420px]' : 'bottom-[90px]'}`}>
            <button onClick={() => setShowHeatmap(!showHeatmap)} className={`w-12 h-12 rounded-full shadow-lg flex items-center justify-center transition-all ${showHeatmap ? 'bg-primary text-on-primary' : 'bg-surface text-on-surface-variant'}`}>
              <span className="material-symbols-outlined">layers</span>
            </button>
            <button onClick={() => setVoiceEnabled(!voiceEnabled)} className={`w-12 h-12 rounded-full shadow-lg flex items-center justify-center transition-all ${voiceEnabled ? 'bg-surface text-on-surface-variant' : 'bg-surface text-on-surface-variant opacity-50'}`}>
              <span className="material-symbols-outlined">{voiceEnabled ? 'volume_up' : 'volume_off'}</span>
            </button>
            <button onClick={() => setIsDemoMode(!isDemoMode)} className={`w-12 h-12 rounded-full shadow-lg flex items-center justify-center transition-all ${isDemoMode ? 'bg-red-600 text-white animate-pulse' : 'bg-surface text-on-surface-variant hover:bg-surface-container'}`}>
              <span className="material-symbols-outlined">science</span>
            </button>
            <button onClick={() => userLocation && setMapCenter(userLocation)} className="w-12 h-12 bg-surface text-primary rounded-full shadow-lg flex items-center justify-center hover:bg-surface-container">
              <span className="material-symbols-outlined">my_location</span>
            </button>
          </div>
        )}

        {/* ── Modern Bottom Sheet System ── */}
        <AnimatePresence>
          {!isNavigating && routes.length > 0 && selectedRoute && (
            <motion.div 
              key="route-selection-sheet"
              initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="absolute bottom-[72px] left-0 right-0 z-[1000] bg-surface rounded-t-3xl shadow-[0_-10px_40px_rgba(0,0,0,0.15)] flex flex-col max-h-[75vh] md:max-h-[60vh]"
            >
              <div className="w-full flex justify-center py-3">
                <div className="w-12 h-1.5 bg-outline-variant/40 rounded-full"></div>
              </div>
              
              <div className="px-5 pb-4 flex justify-between items-center">
                <h2 className="text-xl font-bold text-on-surface">Route Options</h2>
                <button onClick={clearRoutes} className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant hover:bg-surface-container-high transition-colors">
                  <span className="material-symbols-outlined text-[20px]">close</span>
                </button>
              </div>

              {/* Scrollable Content */}
              <div className="flex-1 overflow-y-auto px-4 pb-6 scrollbar-hide">
                {/* AI Assistant Banner */}
                {aiAssistantMsg && (
                  <div className="mb-4 bg-green-50/80 border border-green-200 p-3 rounded-xl flex gap-3 items-start">
                    <span className="material-symbols-outlined text-green-600 mt-0.5">smart_toy</span>
                    <p className="text-sm font-medium text-green-800 leading-snug">{aiAssistantMsg}</p>
                  </div>
                )}
                
                <h2 className="text-xl font-h2 font-bold mb-4 px-1">Multiple Routes</h2>
                
                <div className="flex flex-col gap-2">
                  {routes.map((r) => (
                    <div key={r.id} onClick={() => setSelectedRoute(r)} 
                         className={`rounded-xl p-3 flex flex-col cursor-pointer transition-all border-2 
                         ${selectedRoute?.id === r.id ? (r.type === 'safest' ? 'border-[#4CAF50] bg-[#4CAF50]/10' : r.type === 'fastest' ? 'border-[#2196F3] bg-[#2196F3]/10' : 'border-[#FF9800] bg-[#FF9800]/10') : 'border-outline-variant/20 hover:bg-surface-container'}`}>
                      
                      <div className="flex justify-between items-center mb-1.5">
                        <div className="flex items-center gap-2.5">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center shadow-sm
                               ${selectedRoute?.id === r.id ? (r.type === 'safest' ? 'bg-[#4CAF50] text-white' : r.type === 'fastest' ? 'bg-[#2196F3] text-white' : 'bg-[#FF9800] text-white') : 'bg-surface-container-high text-on-surface-variant'}`}>
                            <span className="material-symbols-outlined text-[18px]">{r.type === 'safest' ? 'health_and_safety' : r.type === 'fastest' ? 'bolt' : 'alt_route'}</span>
                          </div>
                          <div>
                            <div className="text-base font-black text-on-surface capitalize tracking-wide">{r.type === 'safest' ? 'Ride Comfort Mode' : r.type === 'fastest' ? 'Fastest Route' : 'Alternate Route'}</div>
                            <div className="text-[10px] text-on-surface-variant font-bold uppercase tracking-wider">{r.type === 'safest' ? 'AI Optimized Safety' : 'Time Optimized'}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className={`text-xl font-black ${selectedRoute?.id === r.id ? 'text-on-surface' : 'text-on-surface-variant'}`}>{formatTime(r.duration)}</div>
                          <div className="text-[11px] text-on-surface-variant font-black">{r.distance} km</div>
                        </div>
                      </div>

                      {/* Route Metrics Differentiated by Type */}
                      <div className="bg-surface-container-lowest rounded-lg p-2 flex flex-wrap gap-1.5 mt-1">
                        {r.type === 'fastest' ? (
                          <>
                            <div className="flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 bg-surface-container rounded-md">
                              <span className={`material-symbols-outlined text-[12px] ${r.trafficLevel.includes('Heavy') ? 'text-red-500' : r.trafficLevel.includes('Moderate') ? 'text-orange-500' : 'text-green-500'}`}>traffic</span>
                              {r.trafficLevel}
                            </div>
                            <div className="flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 bg-surface-container rounded-md">
                              <span className="material-symbols-outlined text-[12px] text-blue-500">local_gas_station</span>
                              {r.fuelEfficiency}
                            </div>
                            <div className="flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 bg-error-container text-error rounded-md">
                              <span className="material-symbols-outlined text-[12px]">warning</span>
                              {r.hazards} Hazards
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 bg-[#4CAF50]/20 text-green-700 rounded-md">
                              <span className="material-symbols-outlined text-[12px]">shield</span>
                              AI: {r.score}/100
                            </div>
                            <div className="flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 bg-surface-container rounded-md">
                              <span className="material-symbols-outlined text-[12px] text-purple-500">airline_seat_recline_extra</span>
                              {r.comfortRating}
                            </div>
                            {getHazardReductionText(r) && (
                              <div className="flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 bg-surface-container rounded-md">
                                <span className="material-symbols-outlined text-[12px] text-orange-500">reduce_capacity</span>
                                {getHazardReductionText(r)}
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                <button onClick={startNavigation} className="w-full mt-4 py-3.5 rounded-xl bg-primary text-on-primary font-bold text-base shadow-lg shadow-primary/20 hover:shadow-xl hover:-translate-y-0.5 transition-all flex justify-center items-center gap-2">
                  <span className="material-symbols-outlined">navigation</span>
                  Start Navigation
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Active Navigation Bottom Stats */}
        <AnimatePresence>
          {isNavigating && selectedRoute && (
            <motion.div
              key="nav-stats-sheet"
              initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
              className="absolute bottom-0 left-0 right-0 z-[1000] bg-surface p-4 pb-6 rounded-t-3xl shadow-[0_-10px_40px_rgba(0,0,0,0.15)] flex justify-between items-center"
            >
              <div>
                <div className="text-3xl font-black text-[#4CAF50]">{formatTime(selectedRoute.duration)}</div>
                <div className="text-sm font-bold text-on-surface-variant flex gap-4 mt-1">
                  <span>{selectedRoute.distance} km</span>
                  <span>•</span>
                  <span>{selectedRoute.hazards} Hazards Ahead</span>
                </div>
              </div>
              <button onClick={() => setVoiceEnabled(!voiceEnabled)} className={`w-14 h-14 rounded-full flex items-center justify-center shadow-md transition-colors ${voiceEnabled ? 'bg-primary text-on-primary' : 'bg-surface-container-high text-on-surface-variant'}`}>
                <span className="material-symbols-outlined text-2xl">{voiceEnabled ? 'volume_up' : 'volume_off'}</span>
              </button>
            </motion.div>
          )}
        </AnimatePresence>

      </main>
      
      {/* Footer ALWAYS visible unless in immersive navigation mode */}
      {!isNavigating && <BottomNavBar />}
    </div>
  );
}

export default function MapNavigationWithErrorBoundary(props) {
  return (
    <ErrorBoundary>
      <MapNavigation {...props} />
    </ErrorBoundary>
  );
}
