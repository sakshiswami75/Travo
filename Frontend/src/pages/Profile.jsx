import React, { useState, useEffect } from 'react';
import TopAppBar from '../components/TopAppBar';
import BottomNavBar from '../components/BottomNavBar';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { authService } from '../services/api';
import useTheme from '../components/useTheme';

export default function Profile() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const { isDark, toggleTheme } = useTheme();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await authService.getMe();
        setUser(res.data);
      } catch (err) {
        toast.error('Failed to load profile');
        if (err.response?.status === 401) {
          localStorage.removeItem('token');
          navigate('/login');
        }
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, [navigate]);

  const handleLogout = async () => {
    try {
      await authService.logout();
      localStorage.removeItem('token');
      toast.success('Logged out successfully');
      navigate('/login');
    } catch (err) {
      toast.error('Logout failed');
    }
  };

  if (loading) {
    return (
      <div className="bg-surface text-on-surface min-h-screen pb-32 flex flex-col antialiased">
        <TopAppBar title="AI Driver Profile" />
        <main className="flex-1 w-full max-w-md mx-auto px-margin-mobile pt-stack-lg flex items-center justify-center">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
        </main>
        <BottomNavBar />
      </div>
    );
  }

  const { stats, rewardPoints, driverLevel } = user || {};

  return (
    <div className="bg-surface text-on-surface min-h-screen pb-32">
      <TopAppBar title="AI Driver Profile" />

      <main className="pt-8 px-margin-mobile max-w-md mx-auto space-y-stack-lg">
        
        {/* 1. PROFILE HEADER */}
        <section className="bg-surface-container-lowest rounded-2xl p-6 depth-level-2 flex flex-col items-center text-center relative overflow-hidden border border-outline-variant/10">
          <div className="absolute top-0 left-0 w-full h-1/3 bg-gradient-to-b from-primary/20 to-transparent"></div>
          
          <div className="w-24 h-24 rounded-full bg-surface-container overflow-hidden border-4 border-surface shadow-lg relative z-10 flex items-center justify-center text-primary-container bg-primary/10 mb-4 animate-pulse-slow">
            <span className="material-symbols-outlined text-5xl">manage_accounts</span>
          </div>
          
          <h2 className="text-h1 font-h1 text-on-surface relative z-10">{user?.name || 'Driver'}</h2>
          <p className="text-body-md text-on-surface-variant relative z-10 mb-3">{user?.email}</p>
          
          <div className="flex gap-2 justify-center relative z-10">
            <div className="inline-flex items-center gap-1 bg-secondary-container text-on-secondary-container px-4 py-1.5 rounded-full shadow-sm">
              <span className="material-symbols-outlined text-[16px]">military_tech</span>
              <span className="text-label-bold font-bold uppercase tracking-wider">{driverLevel || 'Beginner Driver'}</span>
            </div>
          </div>
        </section>

        {/* 2 & 3. LIVE USER STATS & REWARDS CARD */}
        <section className="grid grid-cols-2 gap-4">
          <Link to="/rewards" className="col-span-2 bg-gradient-to-br from-primary to-primary-container text-white rounded-2xl p-6 shadow-[0_8px_20px_rgba(124,58,237,0.3)] flex flex-col justify-center items-center text-center relative overflow-hidden cursor-pointer hover:scale-[1.02] transition-transform active:scale-95">
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/20 rounded-full blur-2xl"></div>
            <div className="absolute -bottom-8 -left-8 w-24 h-24 bg-white/20 rounded-full blur-xl"></div>
            
            <span className="material-symbols-outlined text-5xl mb-2 drop-shadow-md">star</span>
            <p className="text-label-bold font-bold uppercase tracking-widest text-primary-fixed opacity-90">Reward Points</p>
            <p className="text-5xl font-extrabold mt-1 tracking-tight drop-shadow-sm">{rewardPoints?.toLocaleString() || 0}</p>
            <div className="mt-3 bg-white/20 px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wide flex items-center gap-1">
              Tap to Redeem <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
            </div>
          </Link>

          {/* Stat Grid */}
          <div className="bg-surface-container-lowest p-4 rounded-xl border border-outline-variant/20 shadow-sm flex flex-col items-center text-center">
            <span className="material-symbols-outlined text-error text-3xl mb-1">warning</span>
            <p className="text-h2 font-bold">{stats?.potholesReported || 0}</p>
            <p className="text-caption text-on-surface-variant font-bold uppercase">Hazards Reported</p>
          </div>
          <div className="bg-surface-container-lowest p-4 rounded-xl border border-outline-variant/20 shadow-sm flex flex-col items-center text-center">
            <span className="material-symbols-outlined text-green-500 text-3xl mb-1">verified</span>
            <p className="text-h2 font-bold">{stats?.hazardsVerified || 0}</p>
            <p className="text-caption text-on-surface-variant font-bold uppercase">Hazards Verified</p>
          </div>
          <div className="bg-surface-container-lowest p-4 rounded-xl border border-outline-variant/20 shadow-sm flex flex-col items-center text-center">
            <span className="material-symbols-outlined text-blue-500 text-3xl mb-1">route</span>
            <p className="text-h2 font-bold">{stats?.routesCompleted || 0}</p>
            <p className="text-caption text-on-surface-variant font-bold uppercase">Safe Routes</p>
          </div>
          <div className="bg-surface-container-lowest p-4 rounded-xl border border-outline-variant/20 shadow-sm flex flex-col items-center text-center">
            <span className="material-symbols-outlined text-purple-500 text-3xl mb-1">speed</span>
            <p className="text-h2 font-bold">{stats?.safeKm || 0} km</p>
            <p className="text-caption text-on-surface-variant font-bold uppercase">Safe Distance</p>
          </div>
        </section>

        {/* 6. ACHIEVEMENT SYSTEM */}
        <section className="bg-surface-container-lowest rounded-xl depth-level-2 overflow-hidden border border-outline-variant/10">
          <div className="p-5 border-b border-outline-variant/10 flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">emoji_events</span>
            <h4 className="text-label-bold font-bold text-on-surface uppercase tracking-wider">Achievements</h4>
          </div>
          <div className="p-5 flex gap-4 overflow-x-auto hide-scrollbar">
            <div className="shrink-0 w-24 flex flex-col items-center text-center gap-2 opacity-100">
              <div className="w-16 h-16 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center shadow-md">
                <span className="material-symbols-outlined text-3xl">flag</span>
              </div>
              <p className="text-[10px] font-bold uppercase text-on-surface-variant">First Hazard Report</p>
            </div>
            <div className={`shrink-0 w-24 flex flex-col items-center text-center gap-2 ${(stats?.safeKm > 100) ? 'opacity-100' : 'opacity-40 grayscale'}`}>
              <div className="w-16 h-16 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shadow-md">
                <span className="material-symbols-outlined text-3xl">workspace_premium</span>
              </div>
              <p className="text-[10px] font-bold uppercase text-on-surface-variant">100 Safe KM</p>
            </div>
            <div className={`shrink-0 w-24 flex flex-col items-center text-center gap-2 ${(stats?.municipalityResolved > 0) ? 'opacity-100' : 'opacity-40 grayscale'}`}>
              <div className="w-16 h-16 rounded-full bg-green-100 text-green-600 flex items-center justify-center shadow-md">
                <span className="material-symbols-outlined text-3xl">nature_people</span>
              </div>
              <p className="text-[10px] font-bold uppercase text-on-surface-variant">Community Helper</p>
            </div>
            <div className={`shrink-0 w-24 flex flex-col items-center text-center gap-2 ${(rewardPoints > 500) ? 'opacity-100' : 'opacity-40 grayscale'}`}>
              <div className="w-16 h-16 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center shadow-md">
                <span className="material-symbols-outlined text-3xl">psychology</span>
              </div>
              <p className="text-[10px] font-bold uppercase text-on-surface-variant">AI Contributor</p>
            </div>
          </div>
        </section>

        {/* 7 & 10. CONTRIBUTION HISTORY & LEADERBOARD */}
        <section className="bg-surface-container-lowest rounded-xl depth-level-2 overflow-hidden border border-outline-variant/10">
          <div className="p-5 border-b border-outline-variant/10 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">history</span>
              <h4 className="text-label-bold font-bold text-on-surface uppercase tracking-wider">Live Activity</h4>
            </div>
            <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-1 rounded">Rank #42 in City</span>
          </div>
          <div className="flex flex-col p-5 gap-4 relative">
            <div className="absolute left-[31px] top-6 bottom-6 w-0.5 bg-outline-variant/20"></div>
            
            <div className="flex gap-4 relative z-10">
              <div className="w-6 h-6 rounded-full bg-green-500 text-white flex items-center justify-center shrink-0 border-2 border-surface shadow-sm">
                <span className="material-symbols-outlined text-[12px]">check</span>
              </div>
              <div>
                <p className="text-body-md font-bold text-on-surface leading-tight">Municipality Resolved Issue</p>
                <p className="text-body-sm text-green-600 font-bold">+100 Points</p>
                <p className="text-caption text-outline">2 hours ago</p>
              </div>
            </div>
            <div className="flex gap-4 relative z-10">
              <div className="w-6 h-6 rounded-full bg-orange-500 text-white flex items-center justify-center shrink-0 border-2 border-surface shadow-sm">
                <span className="material-symbols-outlined text-[12px]">add_location</span>
              </div>
              <div>
                <p className="text-body-md font-bold text-on-surface leading-tight">Pothole Reported</p>
                <p className="text-body-sm text-orange-600 font-bold">+50 Points</p>
                <p className="text-caption text-outline">Yesterday</p>
              </div>
            </div>
            <div className="flex gap-4 relative z-10">
              <div className="w-6 h-6 rounded-full bg-blue-500 text-white flex items-center justify-center shrink-0 border-2 border-surface shadow-sm">
                <span className="material-symbols-outlined text-[12px]">verified</span>
              </div>
              <div>
                <p className="text-body-md font-bold text-on-surface leading-tight">Hazard Verified</p>
                <p className="text-body-sm text-blue-600 font-bold">+10 Points</p>
                <p className="text-caption text-outline">2 days ago</p>
              </div>
            </div>
          </div>
        </section>

        {/* 9. VEHICLE MANAGEMENT */}
        <section className="bg-surface-container-lowest rounded-xl depth-level-2 overflow-hidden border border-outline-variant/10">
          <div className="p-5 border-b border-outline-variant/10 flex items-center justify-between">
            <h4 className="text-label-bold font-bold text-on-surface-variant uppercase tracking-wider">My Garage</h4>
            <span className="material-symbols-outlined text-primary">add_circle</span>
          </div>
          <div className="p-5 flex items-center gap-4 hover:bg-surface-container-low transition-colors cursor-pointer group">
            <div className="w-12 h-12 bg-primary/10 text-primary rounded-xl flex items-center justify-center shrink-0 group-hover:bg-primary group-hover:text-white transition-colors">
              <span className="material-symbols-outlined text-2xl">directions_car</span>
            </div>
            <div>
              <p className="text-body-lg font-bold text-on-surface">Compact SUV</p>
              <p className="text-caption text-on-surface-variant">Fuel type: Petrol • Comfort Routing: ON</p>
            </div>
          </div>
        </section>

        {/* 8. PREFERENCES */}
        <section className="bg-surface-container-lowest rounded-xl depth-level-2 overflow-hidden border border-outline-variant/10">
          <div className="p-5 border-b border-outline-variant/10">
            <h4 className="text-label-bold font-bold text-on-surface-variant uppercase tracking-wider">Preferences</h4>
          </div>
          <div className="p-5 flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-body-md font-bold text-on-surface">Push Notifications</span>
              <span className="text-body-sm text-on-surface-variant">Alerts for route changes and updates</span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" defaultChecked />
              <div className="w-11 h-6 bg-surface-variant peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-surface after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-surface-container-lowest after:border-outline-variant after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
            </label>
          </div>
          <div className="p-5 flex items-center justify-between border-t border-outline-variant/5">
            <div className="flex flex-col">
              <span className="text-body-md font-bold text-on-surface">Dark Theme</span>
              <span className="text-body-sm text-on-surface-variant">Use darker colors throughout Travo</span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" checked={isDark} onChange={toggleTheme} />
              <div className="w-11 h-6 bg-surface-variant peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-surface after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-surface-container-lowest after:border-outline-variant after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
            </label>
          </div>
        </section>

        {/* Logout Action */}
        <section className="pt-stack-sm pb-stack-lg flex justify-center">
          <button onClick={handleLogout} className="flex items-center gap-2 text-error hover:bg-error-container hover:text-error px-8 py-3 rounded-full transition-colors w-full md:w-auto justify-center font-bold border border-error/20">
            <span className="material-symbols-outlined">logout</span>
            <span>Log Out</span>
          </button>
        </section>
      </main>

      <BottomNavBar />
    </div>
  );
}
