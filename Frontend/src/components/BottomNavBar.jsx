import React from 'react';
import { Link, useLocation } from 'react-router-dom';

export default function BottomNavBar() {
  const location = useLocation();
  const currentPath = location.pathname;

  // The active state logic from the image seems to have a purple tint for the scan button.
  // The other tabs will just have a bold, dark grey/purple tint when inactive, and perhaps full purple when active.
  const isActive = (path) => currentPath === path;

  return (
    <div className="fixed bottom-6 left-0 right-0 z-50 flex justify-center px-4 md:hidden pointer-events-none">
      <nav className="w-full max-w-md bg-white dark:bg-[#1E1E1E] shadow-[0_8px_30px_rgb(0,0,0,0.12)] rounded-full h-[72px] flex justify-between items-center px-2 relative pointer-events-auto border border-gray-100 dark:border-gray-800">
        
        {/* Home */}
        <Link to="/home" className="flex flex-col items-center justify-center flex-1 h-full pt-1">
          <span className={`material-symbols-outlined text-[26px] mb-1 transition-colors ${isActive('/home') ? 'text-primary' : 'text-gray-500 dark:text-gray-400'}`} style={{ fontVariationSettings: isActive('/home') ? "'FILL' 1" : "'FILL' 0" }}>
            home
          </span>
          <span className={`text-[11px] font-bold tracking-wide transition-colors ${isActive('/home') ? 'text-primary' : 'text-gray-500 dark:text-gray-400'}`}>
            Home
          </span>
        </Link>
        
        {/* Maps */}
        <Link to="/map" className="flex flex-col items-center justify-center flex-1 h-full pt-1">
          <span className={`material-symbols-outlined text-[26px] mb-1 transition-colors ${isActive('/map') ? 'text-primary' : 'text-gray-500 dark:text-gray-400'}`} style={{ fontVariationSettings: isActive('/map') ? "'FILL' 1" : "'FILL' 0" }}>
            map
          </span>
          <span className={`text-[11px] font-bold tracking-wide transition-colors ${isActive('/map') ? 'text-primary' : 'text-gray-500 dark:text-gray-400'}`}>
            Maps
          </span>
        </Link>

        {/* Report (Center Pop-out Button) */}
        <div className="flex-1 flex justify-center h-full relative z-10">
          <div className="absolute -top-6 flex flex-col items-center">
            <Link to="/scan" className="flex items-center justify-center w-[64px] h-[64px] rounded-full bg-[#F3E8FF] dark:bg-primary/20 shadow-sm border-4 border-white dark:border-[#1E1E1E] transition-transform hover:scale-105 active:scale-95">
              <span className="material-symbols-outlined text-[32px] text-[#7C3AED] dark:text-[#A78BFA]" style={{ fontVariationSettings: "'FILL' 0, 'wght' 600" }}>
                center_focus_strong
              </span>
            </Link>
            <span className={`text-[11px] font-bold tracking-wide mt-1 transition-colors ${isActive('/scan') ? 'text-primary' : 'text-gray-500 dark:text-gray-400'}`}>
              Report
            </span>
          </div>
        </div>

        {/* Alerts */}
        <Link to="/alerts" className="flex flex-col items-center justify-center flex-1 h-full pt-1">
          <div className="relative">
            <span className={`material-symbols-outlined text-[26px] mb-1 transition-colors ${isActive('/alerts') ? 'text-primary' : 'text-gray-500 dark:text-gray-400'}`} style={{ fontVariationSettings: isActive('/alerts') ? "'FILL' 1" : "'FILL' 0" }}>
              notifications
            </span>
            {/* Optional Notification Dot */}
            {!isActive('/alerts') && (
              <div className="absolute top-0 right-0 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white dark:border-[#1E1E1E]"></div>
            )}
          </div>
          <span className={`text-[11px] font-bold tracking-wide transition-colors ${isActive('/alerts') ? 'text-primary' : 'text-gray-500 dark:text-gray-400'}`}>
            Alerts
          </span>
        </Link>

        {/* History */}
        <Link to="/history" className="flex flex-col items-center justify-center flex-1 h-full pt-1">
          <span className={`material-symbols-outlined text-[26px] mb-1 transition-colors ${isActive('/history') ? 'text-primary' : 'text-gray-500 dark:text-gray-400'}`} style={{ fontVariationSettings: isActive('/history') ? "'FILL' 1" : "'FILL' 0" }}>
            history
          </span>
          <span className={`text-[11px] font-bold tracking-wide transition-colors ${isActive('/history') ? 'text-primary' : 'text-gray-500 dark:text-gray-400'}`}>
            History
          </span>
        </Link>
      </nav>
    </div>
  );
}
