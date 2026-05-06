import { useState } from 'react';
import TopAppBar from '../components/TopAppBar';
import BottomNavBar from '../components/BottomNavBar';

export default function Alerts() {
  const [activeTab, setActiveTab] = useState('All');
  
  const tabs = ['All', 'Traffic', 'Hazards', 'System'];

  return (
    <div className="bg-surface text-on-surface min-h-screen pb-24 font-body-md text-body-md">
      <TopAppBar title="Alerts" />

      <main className="pt-8 md:pt-12 px-margin-mobile md:px-8 max-w-3xl mx-auto flex flex-col gap-stack-lg">
        <header>
          <h2 className="text-h1 font-h1 text-on-surface mb-stack-sm">Alerts &amp; Notifications</h2>
          <p className="text-body-lg font-body-lg text-on-surface-variant">Stay informed about your route.</p>
        </header>

        {/* Tabs */}
        <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-2">
          {tabs.map(tab => (
            <button 
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-2 rounded-full font-label-bold text-label-bold shrink-0 transition-colors ${
                activeTab === tab 
                  ? 'bg-primary text-on-primary' 
                  : 'bg-surface-container-lowest border border-outline-variant/30 text-on-surface hover:bg-surface-container'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Alerts List */}
        <div className="flex flex-col gap-4">
          {/* Unread Alert */}
          <div className="p-4 rounded-xl bg-surface-container-low border border-primary/20 shadow-sm relative flex gap-4 items-start">
            <div className="absolute top-4 right-4 w-3 h-3 bg-primary rounded-full animate-pulse"></div>
            <div className="w-12 h-12 rounded-full bg-error-container text-error flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-2xl">traffic</span>
            </div>
            <div className="flex-1 pr-6">
              <div className="flex justify-between items-center mb-1">
                <h4 className="text-h3 font-h3 text-on-surface">Major Traffic Delay</h4>
              </div>
              <p className="text-body-md text-on-surface-variant mb-2">Accident on I-95 North. Expect delays of up to 45 minutes.</p>
              <span className="text-caption font-caption text-outline">Just now</span>
            </div>
          </div>

          {/* Warning Alert */}
          <div className="p-4 rounded-xl bg-surface-container-lowest border border-outline-variant/20 shadow-sm flex gap-4 items-start">
            <div className="w-12 h-12 rounded-full bg-tertiary-container text-on-tertiary-container flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-2xl">construction</span>
            </div>
            <div className="flex-1">
              <h4 className="text-h3 font-h3 text-on-surface mb-1">Construction Zone</h4>
              <p className="text-body-md text-on-surface-variant mb-2">Right lane closed on 5th Avenue. Proceed with caution.</p>
              <span className="text-caption font-caption text-outline">2 hours ago</span>
            </div>
          </div>

          {/* Resolved Alert */}
          <div className="p-4 rounded-xl bg-surface-container-lowest border border-outline-variant/20 shadow-sm flex gap-4 items-start opacity-75">
            <div className="w-12 h-12 rounded-full bg-secondary-container text-on-secondary-container flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-2xl">check_circle</span>
            </div>
            <div className="flex-1">
              <h4 className="text-h3 font-h3 text-on-surface mb-1">Pothole Repaired</h4>
              <p className="text-body-md text-on-surface-variant mb-2">The pothole you reported on Elm St has been fixed.</p>
              <span className="text-caption font-caption text-outline">Yesterday</span>
            </div>
          </div>
        </div>
      </main>

      <BottomNavBar />
    </div>
  );
}
