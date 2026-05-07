import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import TopAppBar from '../components/TopAppBar';
import BottomNavBar from '../components/BottomNavBar';
import api from '../services/api';
import toast from 'react-hot-toast';

export default function Alerts() {
  const [activeTab, setActiveTab] = useState('All');
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  
  const tabs = ['All', 'Traffic', 'Hazards', 'AI Safety', 'Municipality', 'System'];

  useEffect(() => {
    fetchLiveAlerts();
    const interval = setInterval(fetchLiveAlerts, 30000); // Poll every 30s
    return () => clearInterval(interval);
  }, []);

  const fetchLiveAlerts = () => {
    // Attempt to get location to get localized hazard warnings
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          loadData(lat, lng);
        },
        () => {
          loadData(); // Fallback without location
        }
      );
    } else {
      loadData();
    }
  };

  const loadData = async (lat, lng) => {
    try {
      const query = lat && lng ? `?lat=${lat}&lng=${lng}` : '';
      const res = await api.get(`/maps/alerts${query}`);
      setAlerts(res.data || []);
      
      // Auto voice alert for Critical
      const criticalNew = res.data.find(a => a.priority === 'Critical');
      if (criticalNew && !window.spokenCritical) {
        speakAlert(`Warning. ${criticalNew.title}.`);
        window.spokenCritical = true;
      }
    } catch (err) {
      console.error("Failed to fetch alerts", err);
    } finally {
      setLoading(false);
    }
  };

  const speakAlert = (text) => {
    if (!('speechSynthesis' in window)) return;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    window.speechSynthesis.speak(utterance);
  };

  const handleAlertClick = (alert) => {
    if (alert.coordinates && alert.coordinates.length === 2) {
      navigate('/', { state: { focusReport: { lat: alert.coordinates[0], lng: alert.coordinates[1] } } });
    } else {
      toast.info('No precise location available for this alert.');
    }
  };

  const formatTime = (dateStr) => {
    if (!dateStr) return 'Just now';
    const date = new Date(dateStr);
    const diff = Math.floor((new Date() - date) / 60000);
    if (diff < 1) return 'Just now';
    if (diff < 60) return `${diff} mins ago`;
    if (diff < 1440) return `${Math.floor(diff / 60)} hrs ago`;
    return 'Yesterday';
  };

  const filteredAlerts = activeTab === 'All' 
    ? alerts 
    : alerts.filter(a => a.category === activeTab);

  return (
    <div className="bg-surface text-on-surface min-h-screen pb-24 font-body-md text-body-md">
      <TopAppBar title="AI Intelligence Center" />

      <main className="pt-8 px-margin-mobile max-w-md mx-auto flex flex-col gap-stack-lg">
        <header>
          <h2 className="text-h1 font-h1 text-on-surface mb-stack-sm tracking-tight">AI Road Intelligence Center</h2>
          <p className="text-body-lg font-body-lg text-on-surface-variant leading-snug">Real-time alerts, hazard warnings, and municipality updates.</p>
        </header>

        {/* Tabs */}
        <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-2">
          {tabs.map(tab => (
            <button 
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-5 py-2 rounded-full font-label-bold text-label-bold shrink-0 transition-colors ${
                activeTab === tab 
                  ? 'bg-primary text-on-primary shadow-md' 
                  : 'bg-surface-container-lowest border border-outline-variant/30 text-on-surface hover:bg-surface-container'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Alerts List */}
        <div className="flex flex-col gap-4">
          {loading ? (
            <div className="text-center py-10 text-outline animate-pulse">Scanning live network...</div>
          ) : filteredAlerts.length === 0 ? (
            <div className="text-center py-10 text-outline">
              <span className="material-symbols-outlined text-4xl mb-2 opacity-50">check_circle</span>
              <p>No active alerts for this category.</p>
            </div>
          ) : (
            filteredAlerts.map(alert => (
              <div 
                key={alert.id}
                onClick={() => handleAlertClick(alert)}
                className={`p-4 rounded-xl shadow-sm relative flex gap-4 items-start cursor-pointer transition-transform hover:scale-[1.02]
                  ${alert.priority === 'Critical' ? 'bg-error-container/20 border-2 border-red-500 shadow-[0_0_15px_rgba(255,0,0,0.3)]' 
                  : alert.priority === 'Medium' ? 'bg-surface-container-low border border-orange-500/50' 
                  : 'bg-surface-container-lowest border border-outline-variant/20'}
                  ${alert.color && alert.color.includes('green') ? 'opacity-80' : ''}
                `}
              >
                {alert.priority === 'Critical' && (
                  <div className="absolute top-4 right-4 w-3 h-3 bg-red-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(255,0,0,1)]"></div>
                )}
                
                <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 shadow-sm ${
                  alert.priority === 'Critical' ? 'bg-red-100 text-red-600' : 
                  alert.priority === 'Medium' ? 'bg-orange-100 text-orange-600' :
                  'bg-blue-100 text-blue-600'
                }`}>
                  <span className="material-symbols-outlined text-2xl">{alert.icon || 'notifications'}</span>
                </div>
                
                <div className="flex-1 pr-6">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="text-h3 font-h3 text-on-surface leading-tight">{alert.title}</h4>
                  </div>
                  <p className="text-body-md text-on-surface-variant mb-2 leading-snug">{alert.description}</p>
                  
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-outline">{formatTime(alert.timestamp)}</span>
                    {alert.confidence && (
                      <span className="text-[10px] font-bold px-2 py-0.5 bg-purple-100 text-purple-700 rounded uppercase">AI Conf: {alert.confidence}%</span>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </main>

      <BottomNavBar />
    </div>
  );
}
