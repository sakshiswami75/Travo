import { useState } from 'react';
import TopAppBar from '../components/TopAppBar';
import BottomNavBar from '../components/BottomNavBar';

export default function History() {
  const [filter, setFilter] = useState('All');
  
  const filters = ['All Status', 'Resolved', 'In Progress'];

  return (
    <div className="bg-background text-on-background min-h-screen pb-[100px] antialiased">
      <TopAppBar title="History" />

      <main className="max-w-4xl mx-auto px-margin-mobile py-stack-lg">
        {/* Header & Summary Section (Bento Style) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-gutter mb-stack-lg">
          {/* Title Card */}
          <div className="col-span-1 md:col-span-2 bg-surface rounded-xl border border-outline-variant/20 p-6 shadow-sm flex flex-col justify-center">
            <h1 className="text-h1 font-h1 text-on-surface mb-stack-sm">Contribution History</h1>
            <p className="text-body-md font-body-md text-on-surface-variant">Review the hazards you've reported and their current resolution status.</p>
          </div>
          
          {/* Stats Card */}
          <div className="col-span-1 bg-surface-container-low rounded-xl border border-primary/20 p-6 shadow-sm flex flex-col items-center justify-center relative overflow-hidden">
            <div className="absolute -right-4 -top-4 w-24 h-24 bg-primary-container/20 rounded-full blur-xl"></div>
            <span className="material-symbols-outlined text-4xl text-primary mb-2 z-10" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
            <span className="text-h1 font-h1 text-on-surface z-10">15</span>
            <span className="text-label-bold font-label-bold text-on-surface-variant uppercase tracking-wider mt-1 z-10">Potholes Reported</span>
          </div>
        </div>

        {/* Search and Filter Bar */}
        <div className="flex flex-col sm:flex-row gap-gutter mb-stack-lg">
          <div className="relative flex-1">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline">search</span>
            <input type="text" placeholder="Search reports (e.g., 'Main Street')" className="w-full bg-surface-container-lowest border border-outline-variant/20 rounded-[16px] pl-12 pr-4 h-[56px] text-body-md font-body-md text-on-surface placeholder:text-outline focus:ring-2 focus:ring-primary focus:bg-surface transition-all shadow-sm" />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2 sm:pb-0 hide-scrollbar shrink-0 items-center">
            {filters.map(f => (
              <button 
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 h-[48px] rounded-full text-label-bold font-label-bold shadow-sm whitespace-nowrap flex items-center gap-2 shrink-0 transition-colors ${
                  filter === f 
                    ? 'bg-primary text-on-primary' 
                    : 'bg-surface-container-lowest text-on-surface-variant border border-outline-variant/30 hover:bg-surface-container'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* Timeline List */}
        <div className="space-y-stack-lg">
          {/* Date Group: Today */}
          <div>
            <h3 className="text-label-bold font-label-bold text-outline uppercase tracking-wider mb-stack-md ml-2">Today, Oct 24</h3>
            <div className="space-y-gutter">
              {/* Item 1 */}
              <div className="bg-surface rounded-[16px] border border-outline-variant/20 p-5 shadow-[0_4px_12px_rgba(0,0,0,0.08)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.12)] transition-shadow flex gap-4 items-start group">
                <div className="w-16 h-16 rounded-lg overflow-hidden shrink-0 bg-surface-variant">
                  <img src="https://lh3.googleusercontent.com/aida-public/AB6AXuAh5SivJ-iBlU3CFwpjRbWyza6_0B0aVGg8Zg2P6YwUcM-N1XcXc-fhm_4VEiznZ_EPkGp_BpwvVzolK1RwM_FcKx-scurQ3gpzxcMRLn3yq2NYw9SiEm9sgRPNG9alLBRQdhYMwfoOuG1GoVjVHby8Dj9sYb4XzvvpWm8LdfKSRS01lm0ezvc45uLCE_RlQ4-518PBN-XNXw6lU4sUQL_YOPPTbbqyuatDVeb-fkfj7Y1-PX3RlTm5OQunL_BeRnB85FJB-8A4yiPa" alt="Pothole photo" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start mb-1 gap-2">
                    <h4 className="text-h3 font-h3 text-on-surface truncate">Deep Pothole on 5th Ave</h4>
                    <span className="inline-flex items-center px-3 py-1 rounded-[32px] text-caption font-caption bg-surface-container-high text-on-surface-variant shrink-0 border border-outline-variant/20">
                      <span className="w-2 h-2 rounded-full bg-secondary-fixed mr-1.5"></span>
                      In Progress
                    </span>
                  </div>
                  <p className="text-body-sm font-body-sm text-on-surface-variant mb-2 truncate">Near intersection with Broadway</p>
                  <div className="flex items-center gap-3 text-caption font-caption text-outline">
                    <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[16px]">schedule</span> 08:30 AM</span>
                    <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[16px]">thumb_up</span> 12 verifications</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Date Group: Yesterday */}
          <div>
            <h3 className="text-label-bold font-label-bold text-outline uppercase tracking-wider mb-stack-md ml-2">Yesterday, Oct 23</h3>
            <div className="space-y-gutter">
              {/* Item 2 */}
              <div className="bg-surface rounded-[16px] border border-outline-variant/20 p-5 shadow-[0_4px_12px_rgba(0,0,0,0.08)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.12)] transition-shadow flex gap-4 items-start group">
                <div className="w-16 h-16 rounded-lg overflow-hidden shrink-0 bg-surface-variant relative">
                  <div className="absolute inset-0 bg-black/10 z-10"></div>
                  <img src="https://lh3.googleusercontent.com/aida-public/AB6AXuD8mgfhlL5HBRt0hshmLqNjP-Cez2YO9CKyh-imB7FXZRKx8h9e96eKvqcYXnMCyjIMy5WA4-SblPidB7AtbkjKqQlA3FKRMtP9eOHj4r-Cw0gJTownizCoF7oHrkFqftbW6PvIIZwrWpwqvPxhUiIbZhm0LKuBfDXIm135sX7pLEhLpMUayUUjrBIqA3GLsCwNML2gZCIqzFlXwtd7gJD2CHw4A3p02BCqMLBtO7LXg-2gBWlB9G1Av18jqp0Bnpff_-H0MEIWwzpH" alt="Bus photo" className="w-full h-full object-cover grayscale group-hover:scale-105 transition-transform duration-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start mb-1 gap-2">
                    <h4 className="text-h3 font-h3 text-on-surface truncate line-through opacity-70">Minor Road Crack</h4>
                    <span className="inline-flex items-center px-3 py-1 rounded-[32px] text-caption font-caption bg-secondary/10 text-secondary shrink-0 border border-secondary/20">
                      <span className="material-symbols-outlined text-[14px] mr-1">check_circle</span>
                      Resolved
                    </span>
                  </div>
                  <p className="text-body-sm font-body-sm text-on-surface-variant mb-2 truncate opacity-70">Elm Street, block 400</p>
                  <div className="flex items-center gap-3 text-caption font-caption text-outline">
                    <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[16px]">schedule</span> 02:15 PM</span>
                    <span className="text-secondary font-medium">Fixed on Oct 24</span>
                  </div>
                </div>
              </div>

              {/* Item 3 */}
              <div className="bg-surface rounded-[16px] border border-outline-variant/20 p-5 shadow-[0_4px_12px_rgba(0,0,0,0.08)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.12)] transition-shadow flex gap-4 items-start group">
                <div className="w-16 h-16 rounded-lg overflow-hidden shrink-0 bg-surface-variant">
                  <img src="https://lh3.googleusercontent.com/aida-public/AB6AXuBPYiwpXVT48ygE9hANFwF6IeV3be-7vauhzDx385V1MRxh5LfnbgnEFrUSX61raOGlmZ6EsfxaAW9W6oXLK-kZpnX4GWwz94Cx37D2PJLXegRKwR1xkogxn169zZ8QbhT3ehZXcvl6Iqz3p3rF_uRGT8EWCufUHOyv0Fhe6Uh3lyvmfFEryKoVq5hxUFkgUYbrHcOQ8YyWNLkLYXQuwzkmu45vafm6DoK8uhZmP0gAVOXXamvVBRi4pPsUGnsvi8XN5oMkqp_hVGpD" alt="Road damage photo" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start mb-1 gap-2">
                    <h4 className="text-h3 font-h3 text-on-surface truncate">Severe Sinkhole forming</h4>
                    <span className="inline-flex items-center px-3 py-1 rounded-[32px] text-caption font-caption bg-error-container text-on-error-container shrink-0 border border-error/20">
                      <span className="material-symbols-outlined text-[14px] mr-1">warning</span>
                      Critical
                    </span>
                  </div>
                  <p className="text-body-sm font-body-sm text-on-surface-variant mb-2 truncate">Oak Avenue &amp; Pine St</p>
                  <div className="flex items-center gap-3 text-caption font-caption text-outline">
                    <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[16px]">schedule</span> 09:45 AM</span>
                    <span className="flex items-center gap-1 text-primary"><span className="material-symbols-outlined text-[16px]">engineering</span> Crew dispatched</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-center pt-stack-md pb-stack-lg">
          <button className="text-primary font-label-bold text-label-bold px-6 py-3 rounded-full border border-primary/20 hover:bg-primary-container/10 transition-colors">
            Load More History
          </button>
        </div>
      </main>

      <BottomNavBar />
    </div>
  );
}
