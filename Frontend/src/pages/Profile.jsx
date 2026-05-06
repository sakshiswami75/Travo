import React, { useState, useEffect } from 'react';
import TopAppBar from '../components/TopAppBar';
import BottomNavBar from '../components/BottomNavBar';
import { useNavigate } from 'react-router-dom';
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
        <TopAppBar title="Profile" />
        <main className="flex-1 w-full max-w-7xl mx-auto px-margin-mobile pt-stack-lg pb-stack-lg md:px-8 flex items-center justify-center">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
        </main>
        <BottomNavBar />
      </div>
    );
  }

  return (
    <div className="bg-surface text-on-surface min-h-screen pb-32">
      <TopAppBar title="Profile" />

      <main className="pt-8 md:pt-12 px-margin-mobile max-w-2xl mx-auto space-y-stack-lg">
        {/* Page Intent Title */}
        <div>
          <h2 className="text-h1 font-h1 text-on-surface">Profile</h2>
          <p className="text-body-md font-body-md text-on-surface-variant mt-stack-sm">Manage your account and settings</p>
        </div>

        {/* User Profile Bento Box */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-gutter">
          {/* Main Profile Card */}
          <div className="col-span-1 md:col-span-2 bg-surface-container-lowest rounded-xl p-5 depth-level-2 flex items-center gap-gutter">
            <div className="w-20 h-20 rounded-full bg-surface-container-high overflow-hidden border-2 border-primary-container/20 flex-shrink-0 shadow-sm relative flex items-center justify-center text-primary-container bg-primary/10">
              <span className="material-symbols-outlined text-4xl">person</span>
            </div>
            <div className="flex-1">
              <h3 className="text-h3 font-h3 text-on-surface">{user?.name || 'User'}</h3>
              <p className="text-body-sm font-body-sm text-on-surface-variant">{user?.email}</p>
              <div className="mt-stack-sm inline-flex items-center gap-1 bg-secondary-container text-on-secondary-container px-3 py-1 rounded-full">
                <span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
                <span className="text-caption font-caption font-semibold">{user?.role}</span>
              </div>
            </div>
          </div>
          
          {/* Rewards Points Card */}
          <div className="col-span-1 bg-primary text-on-primary rounded-xl p-5 shadow-[0_8px_16px_rgba(124,58,237,0.2)] flex flex-col justify-center items-center text-center relative overflow-hidden">
            <div className="absolute -top-10 -right-10 w-24 h-24 bg-white/10 rounded-full blur-xl"></div>
            <div className="absolute -bottom-8 -left-8 w-20 h-20 bg-white/10 rounded-full blur-xl"></div>
            <span className="material-symbols-outlined text-4xl mb-2 text-primary-fixed-dim" style={{ fontVariationSettings: "'FILL' 1" }}>workspace_premium</span>
            <p className="text-label-bold font-label-bold text-primary-fixed">Reward Points</p>
            <p className="text-h1 font-h1 mt-1">2,450</p>
          </div>
        </section>

        {/* Settings & Navigation List */}
        <section className="bg-surface-container-lowest rounded-xl depth-level-2 overflow-hidden">
          <div className="p-5 border-b border-outline-variant/20">
            <h4 className="text-label-bold font-label-bold text-on-surface-variant uppercase tracking-wider">Account Settings</h4>
          </div>
          <div className="flex flex-col">
            <button className="w-full flex items-center justify-between p-5 hover:bg-surface-container-low transition-colors text-left border-b border-outline-variant/10 last:border-0 group">
              <div className="flex items-center gap-gutter">
                <div className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center text-primary group-hover:bg-primary-container group-hover:text-on-primary-container transition-colors">
                  <span className="material-symbols-outlined">directions_car</span>
                </div>
                <span className="text-body-md font-body-md text-on-surface font-medium">My Vehicles</span>
              </div>
              <span className="material-symbols-outlined text-outline-variant group-hover:text-primary transition-colors">chevron_right</span>
            </button>
            <button className="w-full flex items-center justify-between p-5 hover:bg-surface-container-low transition-colors text-left border-b border-outline-variant/10 last:border-0 group">
              <div className="flex items-center gap-gutter">
                <div className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center text-primary group-hover:bg-primary-container group-hover:text-on-primary-container transition-colors">
                  <span className="material-symbols-outlined">bookmark</span>
                </div>
                <span className="text-body-md font-body-md text-on-surface font-medium">Saved Routes</span>
              </div>
              <span className="material-symbols-outlined text-outline-variant group-hover:text-primary transition-colors">chevron_right</span>
            </button>
            <button className="w-full flex items-center justify-between p-5 hover:bg-surface-container-low transition-colors text-left border-b border-outline-variant/10 last:border-0 group">
              <div className="flex items-center gap-gutter">
                <div className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center text-primary group-hover:bg-primary-container group-hover:text-on-primary-container transition-colors">
                  <span className="material-symbols-outlined">settings</span>
                </div>
                <span className="text-body-md font-body-md text-on-surface font-medium">Settings</span>
              </div>
              <span className="material-symbols-outlined text-outline-variant group-hover:text-primary transition-colors">chevron_right</span>
            </button>
            <button className="w-full flex items-center justify-between p-5 hover:bg-surface-container-low transition-colors text-left group">
              <div className="flex items-center gap-gutter">
                <div className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center text-primary group-hover:bg-primary-container group-hover:text-on-primary-container transition-colors">
                  <span className="material-symbols-outlined">support_agent</span>
                </div>
                <span className="text-body-md font-body-md text-on-surface font-medium">Help &amp; Support</span>
              </div>
              <span className="material-symbols-outlined text-outline-variant group-hover:text-primary transition-colors">chevron_right</span>
            </button>
          </div>
        </section>

        {/* Preferences */}
        <section className="bg-surface-container-lowest rounded-xl depth-level-2 overflow-hidden">
          <div className="p-5 border-b border-outline-variant/20">
            <h4 className="text-label-bold font-label-bold text-on-surface-variant uppercase tracking-wider">Preferences</h4>
          </div>
          <div className="p-5 flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-body-md font-body-md text-on-surface font-medium">Push Notifications</span>
              <span className="text-body-sm font-body-sm text-on-surface-variant">Alerts for route changes and updates</span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" defaultChecked />
              <div className="w-11 h-6 bg-surface-variant peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-surface after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-surface-container-lowest after:border-outline-variant after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
            </label>
          </div>
          <div className="p-5 flex items-center justify-between border-t border-outline-variant/10">
            <div className="flex flex-col">
              <span className="text-body-md font-body-md text-on-surface font-medium">Dark Theme</span>
              <span className="text-body-sm font-body-sm text-on-surface-variant">Use darker colors throughout Travo</span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" checked={isDark} onChange={toggleTheme} />
              <div className="w-11 h-6 bg-surface-variant peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-surface after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-surface-container-lowest after:border-outline-variant after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
            </label>
          </div>
        </section>

        {/* Logout Action */}
        <section className="pt-stack-sm pb-stack-lg flex justify-center">
          <button onClick={handleLogout} className="flex items-center gap-2 text-error hover:bg-error-container hover:text-on-error-container px-6 py-3 rounded-full transition-colors w-full md:w-auto justify-center">
            <span className="material-symbols-outlined">logout</span>
            <span className="text-label-bold font-label-bold">Log Out</span>
          </button>
        </section>
      </main>

      <BottomNavBar />
    </div>
  );
}
