import React, { useState } from 'react';
import TopAppBar from '../components/TopAppBar';
import BottomNavBar from '../components/BottomNavBar';

export default function Scan() {
  const [step, setStep] = useState('select'); // 'select', 'camera', 'analyze', 'success'
  const [severity, setSeverity] = useState('Medium');
  const [description, setDescription] = useState('');

  const handleFileUpload = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      triggerAnalysis();
    }
  };

  const handleCapture = () => {
    triggerAnalysis();
  };

  const triggerAnalysis = () => {
    // Simulate AI randomly determining severity
    const severities = ['Basic', 'Medium', 'Dangerous'];
    setSeverity(severities[Math.floor(Math.random() * severities.length)]);
    setStep('analyze');
  };

  return (
    <div className="bg-background text-on-background font-body-md min-h-screen flex flex-col relative antialiased">
      <TopAppBar />

      {/* Select Image Step */}
      {step === 'select' && (
        <main className="flex-grow w-full max-w-2xl mx-auto p-margin-mobile flex flex-col pt-8 pb-32">
          {/* Header */}
          <div className="mb-stack-lg">
            <h2 className="text-h1 font-h1 text-on-surface mb-2">Report Hazard</h2>
            <p className="text-body-md text-on-surface-variant">Help keep our roads safe by reporting an issue.</p>
          </div>

          {/* Step 1: Select Image Container */}
          <div className="bg-surface-container-lowest border border-outline-variant/20 rounded-3xl p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-xs">
                1
              </div>
              <h3 className="text-label-bold font-label-bold tracking-wider text-on-surface-variant uppercase">Select Image</h3>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Take Photo Card */}
              <button 
                onClick={() => setStep('camera')}
                className="bg-surface border border-outline-variant/30 hover:border-primary/50 hover:bg-surface-container-low transition-all rounded-2xl p-6 flex flex-col items-center justify-center gap-2 aspect-square group shadow-sm"
              >
                <div className="w-14 h-14 rounded-full bg-primary-container/20 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                  <span className="material-symbols-outlined text-primary text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>photo_camera</span>
                </div>
                <span className="text-body-lg font-bold text-on-surface">Take Photo</span>
                <span className="text-body-sm text-on-surface-variant">Use camera</span>
              </button>

              {/* Upload Photo Card */}
              <div className="relative bg-surface border border-outline-variant/30 hover:border-secondary/50 hover:bg-surface-container-low transition-all rounded-2xl p-6 flex flex-col items-center justify-center gap-2 aspect-square group shadow-sm overflow-hidden cursor-pointer">
                <input type="file" accept="image/*" onChange={handleFileUpload} className="absolute inset-0 opacity-0 cursor-pointer z-10 w-full h-full" />
                <div className="w-14 h-14 rounded-full bg-secondary-container/20 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                  <span className="material-symbols-outlined text-secondary text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>photo_library</span>
                </div>
                <span className="text-body-lg font-bold text-on-surface">Upload Photo</span>
                <span className="text-body-sm text-on-surface-variant">From gallery</span>
              </div>
            </div>
          </div>
        </main>
      )}

      {/* Camera View Step */}
      {step === 'camera' && (
        <main className="flex-grow relative w-full h-full bg-[#1A1A1A] pt-[calc(var(--touch-target-min)+var(--gutter))] pb-[calc(64px+var(--stack-lg))] min-h-screen">
          {/* Back Button */}
          <div className="absolute top-24 left-margin-mobile z-40">
            <button onClick={() => setStep('select')} className="w-10 h-10 bg-surface/80 backdrop-blur-md rounded-full shadow-lg flex items-center justify-center text-on-surface hover:bg-surface transition-colors border border-outline-variant/20">
              <span className="material-symbols-outlined">arrow_back</span>
            </button>
          </div>

          {/* Live Camera Feed Background Simulation */}
          <div 
            className="absolute inset-0 z-0 bg-center bg-cover opacity-60" 
            style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuBosNUEVlIzNz-oEGfNBDe75Le9auxkeRFTikbqcOSHIZnJvLNIseN8iSiulkEeOqNHM8IlJYhkMilEbwqDtQOYWcbWmJBsClV3wsmHzX1JYLx3Gbl3oMf4shuitrhS4t3g-K2ANJC6CSH58g9Z8G-BjlGZhpCCGUCsTUP2yp5EFNtZSayCAd23DD5QoTLLmEx9JYBGmVA0-QoBiCDl55FBInxBZxVytDwDoD-WqlcZzUvEt0eN8YM5wplhb8MFnQianyQK3rZr6pXq')" }}
          ></div>

          {/* Scanning Overlay Frame */}
          <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none p-margin-mobile">
            <div className="relative w-full max-w-sm aspect-square">
              <div className="corner-border tl"></div>
              <div className="corner-border tr"></div>
              <div className="corner-border bl"></div>
              <div className="corner-border br"></div>
              
              {/* Scanning Bar */}
              <div className="absolute top-1/2 left-0 w-full h-1 bg-primary-container shadow-[0_0_8px_#7c3aed] transform -translate-y-1/2"></div>
              
              {/* Center Reticle */}
              <div className="absolute inset-0 flex items-center justify-center opacity-50">
                <span className="material-symbols-outlined text-4xl text-primary-fixed" style={{ fontVariationSettings: "'FILL' 0" }}>filter_center_focus</span>
              </div>
            </div>
          </div>

          {/* Top Status Bar (Overlay) */}
          <div className="absolute top-24 left-0 right-0 z-20 flex justify-center px-margin-mobile">
            <div className="bg-surface/90 backdrop-blur-md rounded-full px-4 py-2 flex items-center gap-2 shadow-lg border border-outline-variant/20">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-secondary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-secondary"></span>
              </span>
              <span className="text-label-bold font-label-bold text-on-surface">AI Active Scanning</span>
            </div>
          </div>

          {/* Camera Controls Bar */}
          <div className="absolute bottom-[100px] left-0 right-0 z-30 flex justify-center items-center gap-8 px-margin-mobile">
            {/* Upload Photo Button */}
            <div className="w-12 h-12 bg-surface/80 backdrop-blur-md rounded-full shadow-lg flex items-center justify-center text-on-surface hover:bg-surface transition-colors border border-outline-variant/20 relative overflow-hidden">
              <input type="file" accept="image/*" onChange={handleFileUpload} className="absolute inset-0 opacity-0 cursor-pointer w-full h-full" />
              <span className="material-symbols-outlined">photo_library</span>
            </div>

            {/* Capture Button */}
            <button aria-label="Capture" onClick={handleCapture} className="w-16 h-16 bg-primary-container text-on-primary rounded-full shadow-[0_8px_24px_rgba(124,58,237,0.3)] flex items-center justify-center hover:bg-primary transition-colors border-4 border-surface">
              <span className="material-symbols-outlined text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>camera</span>
            </button>

            {/* Toggle Flash */}
            <button aria-label="Toggle Flash" className="w-12 h-12 bg-surface/80 backdrop-blur-md rounded-full shadow-lg flex items-center justify-center text-on-surface hover:bg-surface transition-colors border border-outline-variant/20">
              <span className="material-symbols-outlined">flash_on</span>
            </button>
          </div>
        </main>
      )}

      {/* Analysis & Details Step */}
      {step === 'analyze' && (
        <main className="flex-grow w-full max-w-2xl mx-auto p-margin-mobile flex flex-col pt-8 pb-32">
          {/* Header & Back */}
          <div className="flex items-center gap-4 mb-stack-lg">
            <button onClick={() => setStep('select')} className="w-10 h-10 bg-surface-container rounded-full flex items-center justify-center text-on-surface hover:bg-surface-container-high transition-colors">
              <span className="material-symbols-outlined">arrow_back</span>
            </button>
            <div>
              <h2 className="text-h2 font-h2 text-on-surface">Review Details</h2>
              <p className="text-body-sm text-on-surface-variant">Confirm AI analysis and add description.</p>
            </div>
          </div>

          {/* Image Preview Area */}
          <div className="w-full h-48 bg-surface-container-low rounded-2xl overflow-hidden mb-6 relative shadow-sm border border-outline-variant/20">
            <img src="https://lh3.googleusercontent.com/aida-public/AB6AXuBPYiwpXVT48ygE9hANFwF6IeV3be-7vauhzDx385V1MRxh5LfnbgnEFrUSX61raOGlmZ6EsfxaAW9W6oXLK-kZpnX4GWwz94Cx37D2PJLXegRKwR1xkogxn169zZ8QbhT3ehZXcvl6Iqz3p3rF_uRGT8EWCufUHOyv0Fhe6Uh3lyvmfFEryKoVq5hxUFkgUYbrHcOQ8YyWNLkLYXQuwzkmu45vafm6DoK8uhZmP0gAVOXXamvVBRi4pPsUGnsvi8XN5oMkqp_hVGpD" alt="Captured Hazard" className="w-full h-full object-cover" />
            <div className="absolute top-4 right-4 bg-surface/90 backdrop-blur-md px-3 py-1.5 rounded-full flex items-center gap-2 shadow-sm border border-outline-variant/10">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
              </span>
              <span className="text-[10px] font-bold text-on-surface uppercase tracking-wider">AI Scanned</span>
            </div>
          </div>

          {/* AI Analysis Result Card */}
          <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-2xl p-4 mb-6 flex items-start gap-4 shadow-sm relative overflow-hidden">
            <div className="absolute right-0 top-0 w-32 h-32 bg-primary/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2"></div>
            
            <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 shadow-sm z-10 ${
              severity === 'Dangerous' ? 'bg-error-container text-error' : 
              severity === 'Medium' ? 'bg-tertiary-container text-tertiary' : 
              'bg-secondary-container text-secondary'
            }`}>
              <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
                {severity === 'Dangerous' ? 'warning' : severity === 'Medium' ? 'priority_high' : 'info'}
              </span>
            </div>
            
            <div className="z-10">
              <h4 className="text-[11px] font-bold text-on-surface-variant uppercase tracking-widest mb-0.5">AI Severity Analysis</h4>
              <p className="text-h3 font-h3 text-on-surface flex items-center gap-2">
                {severity} Risk
              </p>
              <p className="text-body-sm text-on-surface-variant mt-1">
                {severity === 'Dangerous' ? 'Deep structural damage detected. High priority.' : 
                 severity === 'Medium' ? 'Moderate pothole. Requires attention soon.' : 
                 'Surface level cracking or minor depression.'}
              </p>
            </div>
          </div>

          {/* Location Field */}
          <div className="mb-4">
            <label className="text-label-bold font-bold text-on-surface block mb-2 uppercase tracking-wider text-xs">Current Location</label>
            <div className="w-full bg-surface-container-lowest border border-outline-variant/30 rounded-xl p-3 flex items-center gap-3 shadow-sm">
              <span className="material-symbols-outlined text-primary">location_on</span>
              <div className="flex-1">
                <p className="text-body-md text-on-surface font-medium">Near Central Park, 5th Ave</p>
                <p className="text-caption text-on-surface-variant">GPS Accuracy: ±4m</p>
              </div>
              <button className="text-primary text-sm font-label-bold hover:underline">Edit</button>
            </div>
          </div>

          {/* Description Input */}
          <div className="mb-8 flex-grow">
            <label className="text-label-bold font-bold text-on-surface block mb-3 uppercase tracking-wider text-xs">Short Description</label>
            <textarea 
              className="w-full bg-surface-container-lowest border border-outline-variant/30 rounded-xl p-4 text-body-md text-on-surface focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all min-h-[120px] shadow-sm resize-none"
              placeholder="e.g., Right lane near the traffic light, very hard to see at night..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            ></textarea>
          </div>

          {/* Submit Button */}
          <button 
            onClick={() => setStep('success')}
            className="w-full bg-primary text-on-primary h-[56px] rounded-full font-label-bold text-lg shadow-[0_4px_14px_rgba(124,58,237,0.39)] hover:bg-primary-fixed-variant transition-colors flex items-center justify-center gap-2"
          >
            Submit Report
            <span className="material-symbols-outlined text-sm">send</span>
          </button>
        </main>
      )}

      {/* Success Step */}
      {step === 'success' && (
        <main className="flex-grow w-full max-w-md mx-auto p-margin-mobile flex flex-col items-center pt-8 pb-32">
          <div className="w-20 h-20 bg-secondary-container text-on-secondary-container rounded-full flex items-center justify-center mb-4 shadow-[0_8px_24px_rgba(108,248,187,0.3)] animate-bounce-short">
            <span className="material-symbols-outlined text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
          </div>
          
          <h2 className="text-h1 font-h1 text-on-surface text-center mb-2">Report Submitted!</h2>
          <p className="text-body-md text-on-surface-variant text-center mb-6 px-4">
            You've earned <strong className="text-primary">+50 points</strong> for keeping the roads safe.
          </p>

          {/* Report Summary Card */}
          <div className="w-full bg-surface-container-lowest border border-outline-variant/30 rounded-2xl p-5 mb-8 shadow-sm text-left">
            <h3 className="text-label-bold font-bold text-on-surface uppercase tracking-wider text-xs mb-4 border-b border-outline-variant/20 pb-2">Report Summary</h3>
            
            <div className="space-y-4">
              <div>
                <p className="text-[11px] text-on-surface-variant uppercase tracking-wider mb-1">Severity</p>
                <div className="flex items-center gap-2">
                  <span className={`w-3 h-3 rounded-full ${
                    severity === 'Dangerous' ? 'bg-error' : 
                    severity === 'Medium' ? 'bg-tertiary' : 'bg-secondary'
                  }`}></span>
                  <p className="text-body-lg font-bold text-on-surface">{severity} Risk</p>
                </div>
              </div>
              
              <div>
                <p className="text-[11px] text-on-surface-variant uppercase tracking-wider mb-1">Description</p>
                <p className="text-body-md text-on-surface bg-surface p-3 rounded-lg border border-outline-variant/10">
                  {description || "No description provided."}
                </p>
              </div>

              <div>
                <p className="text-[11px] text-on-surface-variant uppercase tracking-wider mb-1">Timestamp</p>
                <p className="text-body-sm text-on-surface">Just now</p>
              </div>
            </div>
          </div>
          
          <div className="w-full flex flex-col gap-3">
            <button 
              onClick={() => { setStep('select'); setDescription(''); }}
              className="w-full bg-primary-container text-on-primary-container h-[56px] rounded-full font-label-bold shadow-sm hover:bg-primary-fixed-variant transition-colors"
            >
              Report Another Hazard
            </button>
            <button 
              onClick={() => window.location.href = '/home'}
              className="w-full bg-transparent border border-outline-variant/30 text-on-surface h-[56px] rounded-full font-label-bold hover:bg-surface-container transition-colors"
            >
              Back to Home
            </button>
          </div>
        </main>
      )}

      <BottomNavBar />
    </div>
  );
}
