import React from 'react';
import { Link } from 'react-router-dom';
import TopAppBar from '../components/TopAppBar';
import BottomNavBar from '../components/BottomNavBar';

export default function Home() {
  return (
    <div className="bg-background text-on-background min-h-screen font-body-md pb-32 flex flex-col antialiased">
      <TopAppBar />
      
      <main className="flex-1 w-full max-w-7xl mx-auto px-margin-mobile pt-stack-lg pb-stack-lg md:px-8 space-y-stack-lg">
        {/* Greeting & Date */}
        <section className="mb-stack-lg">
          <h2 className="text-h1 font-h1 text-on-surface">Hello, Alex</h2>
          <p className="text-body-md font-body-md text-on-surface-variant mt-1">Thursday, October 26 • Safe travels today.</p>
        </section>

        {/* Top Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-gutter">
          {/* Safety Score Card */}
          <div className="md:col-span-8 bg-surface-container-lowest rounded-2xl border border-outline-variant/20 shadow-sm p-5 relative overflow-hidden flex flex-col justify-between">
            <div className="absolute -right-20 -top-20 w-64 h-64 bg-secondary-container/20 rounded-full blur-3xl pointer-events-none"></div>
            <div className="flex justify-between items-start z-10 relative">
              <div>
                <h3 className="text-h3 font-h3 text-on-surface flex items-center gap-2">
                  Safety Score
                  <span className="material-symbols-outlined text-secondary text-xl">verified_user</span>
                </h3>
                <p className="text-body-sm font-body-sm text-on-surface-variant mt-1 max-w-sm">Your recent driving and routing patterns indicate a high level of safety consciousness.</p>
              </div>
              <button className="text-primary hover:bg-surface-container p-2 rounded-full transition-colors">
                <span className="material-symbols-outlined">info</span>
              </button>
            </div>
            <div className="mt-stack-lg flex items-center gap-6 z-10 relative">
              <div className="relative w-24 h-24 flex items-center justify-center shrink-0">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  <circle className="text-surface-variant" cx="50" cy="50" fill="none" r="45" stroke="currentColor" strokeWidth="8"></circle>
                  <circle className="text-secondary" cx="50" cy="50" fill="none" r="45" stroke="currentColor" strokeDasharray="282.7" strokeDashoffset="35" strokeLinecap="round" strokeWidth="8"></circle>
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-h2 font-h2 text-on-surface leading-none">92</span>
                  <span className="text-[10px] font-caption text-secondary font-bold uppercase tracking-wider mt-1">Excellent</span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 flex-1">
                <div className="bg-surface-container-low rounded-xl p-3 border border-outline-variant/10">
                  <span className="text-caption font-caption text-on-surface-variant flex items-center gap-1">
                    <span className="material-symbols-outlined text-[16px]">speed</span> Avg Speed
                  </span>
                  <p className="text-h3 font-h3 text-on-surface mt-1">42 <span className="text-body-sm font-body-sm text-on-surface-variant">mph</span></p>
                </div>
                <div className="bg-surface-container-low rounded-xl p-3 border border-outline-variant/10">
                  <span className="text-caption font-caption text-on-surface-variant flex items-center gap-1">
                    <span className="material-symbols-outlined text-[16px]">route</span> Safe Routes
                  </span>
                  <p className="text-h3 font-h3 text-on-surface mt-1">100<span className="text-body-sm font-body-sm text-on-surface-variant">%</span></p>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Map Preview */}
          <div className="md:col-span-4 bg-surface-container-lowest rounded-2xl border border-outline-variant/20 shadow-sm overflow-hidden flex flex-col h-full min-h-[200px] relative group">
            <div className="absolute top-4 left-4 z-10 bg-surface/90 backdrop-blur-sm px-3 py-1.5 rounded-full shadow-sm border border-outline-variant/20 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-primary animate-pulse"></div>
              <span className="text-caption font-caption text-on-surface font-semibold">Downtown</span>
            </div>
            <div className="w-full h-full bg-surface-variant relative">
              <img src="https://lh3.googleusercontent.com/aida-public/AB6AXuBu4joWZaYZKbwAwLzFZ_WzrRBAcQKnV7t_znoEZ8zig1trh6txkgcmE0FAxK1N5uD6keszxWuDz-XC-Y_BkS1Cnz91o1XfqKaQBxg2aXzvwSVjl5x0vG4FbqgP5qvtY5CeVeYqcRNZ17oZkofvdMcnq1iJ7cYWM4AyUFegUPmGAQlNx_tPGQvUnKHV021Y3b0hr4cjXBz88E97JWUrr3IfKfNwwtStzWVx7PK4-qnccaF0vxOdQaJYHuO4yHTQOcmfogLS-DOWA_A8" alt="Map preview" className="w-full h-full object-cover opacity-80 mix-blend-multiply group-hover:scale-105 transition-transform duration-700 ease-in-out" />
              <div className="absolute inset-0 bg-gradient-to-t from-surface/90 via-surface/20 to-transparent pointer-events-none"></div>
            </div>
            <div className="absolute bottom-4 left-4 right-4 z-10">
              <button className="w-full bg-surface text-primary border border-outline-variant/20 h-12 rounded-xl flex items-center justify-center gap-2 shadow-sm hover:bg-surface-container transition-colors">
                <span className="material-symbols-outlined">navigation</span>
                <span className="text-label-bold font-label-bold">Find Route</span>
              </button>
            </div>
          </div>
        </div>

        {/* Quick Actions Grid */}
        <section className="mt-stack-lg">
          <h3 className="text-h3 font-h3 text-on-surface mb-stack-md">Quick Actions</h3>
          <div className="grid grid-cols-2 gap-gutter">
            <Link to="/scan" className="bg-primary-container/10 border border-primary/20 rounded-2xl p-4 flex flex-col items-center justify-center gap-3 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all group">
              <div className="w-12 h-12 rounded-full bg-primary-container text-primary flex items-center justify-center group-hover:scale-110 transition-transform">
                <span className="material-symbols-outlined">center_focus_strong</span>
              </div>
              <span className="text-label-bold font-label-bold text-on-surface">Report Hazard</span>
            </Link>
            <Link to="/complaints" className="bg-surface-container-lowest border border-outline-variant/20 rounded-2xl p-4 flex flex-col items-center justify-center gap-3 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all group">
              <div className="w-12 h-12 rounded-full bg-error-container text-error flex items-center justify-center group-hover:scale-110 transition-transform">
                <span className="material-symbols-outlined">campaign</span>
              </div>
              <span className="text-label-bold font-label-bold text-on-surface">File Complaint</span>
            </Link>
          </div>
        </section>

        {/* Nearby Alerts Section */}
        <section className="mt-stack-lg">
          <div className="flex justify-between items-end mb-stack-md">
            <div>
              <h3 className="text-h3 font-h3 text-on-surface">Nearby Road Alerts</h3>
              <p className="text-body-sm font-body-sm text-on-surface-variant mt-1">Within 5 miles of current location</p>
            </div>
            <button className="text-primary text-label-bold font-label-bold hover:underline">View All</button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-gutter">
            {/* Alert Card 1 */}
            <div className="bg-surface-container-lowest border border-outline-variant/20 rounded-2xl p-4 flex gap-4 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-full bg-error-container/50 text-error flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined">traffic</span>
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-start">
                  <h4 className="text-label-bold font-label-bold text-on-surface text-base">Heavy Traffic</h4>
                  <span className="text-caption font-caption text-on-surface-variant">2 mins ago</span>
                </div>
                <p className="text-body-sm font-body-sm text-on-surface-variant mt-1">I-95 Northbound. Expect 15 min delays.</p>
                <div className="mt-3 flex gap-2">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-caption font-bold bg-surface-variant text-on-surface-variant">0.8 mi away</span>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-caption font-bold bg-error-container/30 text-error">High Impact</span>
                </div>
              </div>
            </div>
            {/* Alert Card 2 */}
            <div className="bg-surface-container-lowest border border-outline-variant/20 rounded-2xl p-4 flex gap-4 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-full bg-tertiary-container/20 text-tertiary flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined">construction</span>
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-start">
                  <h4 className="text-label-bold font-label-bold text-on-surface text-base">Construction Zone</h4>
                  <span className="text-caption font-caption text-on-surface-variant">1 hr ago</span>
                </div>
                <p className="text-body-sm font-body-sm text-on-surface-variant mt-1">Right lane closed on Elm St.</p>
                <div className="mt-3 flex gap-2">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-caption font-bold bg-surface-variant text-on-surface-variant">2.1 mi away</span>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-caption font-bold bg-tertiary-container/20 text-tertiary">Moderate</span>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <BottomNavBar />
    </div>
  );
}
