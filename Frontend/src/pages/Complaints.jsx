import React, { useState } from 'react';
import TopAppBar from '../components/TopAppBar';
import BottomNavBar from '../components/BottomNavBar';

export default function Complaints() {
  const [activeTab, setActiveTab] = useState('new'); // 'new' or 'track'
  
  // Form State
  const [roadName, setRoadName] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Dummy Complaints List State
  const [complaints, setComplaints] = useState([
    {
      id: 'CMP-001',
      date: 'May 4, 2026',
      road: 'Main Street near 4th Ave',
      status: 'In Progress',
      severity: 'Medium'
    },
    {
      id: 'CMP-002',
      date: 'May 1, 2026',
      road: 'Highway 61 Offramp',
      status: 'Resolved',
      severity: 'Dangerous'
    }
  ]);

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate API Call
    setTimeout(() => {
      const newComplaint = {
        id: `CMP-00${complaints.length + 1}`,
        date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        road: roadName,
        status: 'Submitted',
        severity: 'Pending'
      };
      
      setComplaints([newComplaint, ...complaints]);
      setRoadName('');
      setDescription('');
      setIsSubmitting(false);
      setActiveTab('track');
    }, 1500);
  };

  return (
    <div className="bg-background text-on-background font-body-md min-h-screen flex flex-col relative antialiased">
      <TopAppBar />

      <main className="flex-grow w-full max-w-2xl mx-auto p-margin-mobile flex flex-col pt-8 pb-32">
        {/* Header */}
        <div className="mb-6">
          <h2 className="text-h1 font-h1 text-on-surface mb-2">Road Complaints</h2>
          <p className="text-body-md text-on-surface-variant">Report bad road conditions directly to local authorities.</p>
        </div>

        {/* Custom Tabs */}
        <div className="flex bg-surface-variant rounded-xl p-1 mb-6">
          <button 
            onClick={() => setActiveTab('new')}
            className={`flex-1 py-2.5 rounded-lg text-label-bold font-bold transition-colors ${activeTab === 'new' ? 'bg-surface shadow-sm text-primary' : 'text-on-surface-variant hover:text-on-surface'}`}
          >
            New Complaint
          </button>
          <button 
            onClick={() => setActiveTab('track')}
            className={`flex-1 py-2.5 rounded-lg text-label-bold font-bold transition-colors ${activeTab === 'track' ? 'bg-surface shadow-sm text-primary' : 'text-on-surface-variant hover:text-on-surface'}`}
          >
            Track Status
          </button>
        </div>

        {/* Tab Content: New Complaint */}
        {activeTab === 'new' && (
          <form onSubmit={handleSubmit} className="bg-surface-container-lowest border border-outline-variant/30 rounded-3xl p-6 shadow-sm flex flex-col gap-6">
            <div>
              <label className="text-label-bold font-bold text-on-surface block mb-2 uppercase tracking-wider text-xs">Road/Location Name</label>
              <input 
                type="text" 
                required
                value={roadName}
                onChange={(e) => setRoadName(e.target.value)}
                placeholder="e.g. MG Road, Near City Mall"
                className="w-full bg-surface border border-outline-variant/30 rounded-xl p-4 text-body-md text-on-surface focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all shadow-sm"
              />
            </div>
            
            <div>
              <label className="text-label-bold font-bold text-on-surface block mb-2 uppercase tracking-wider text-xs">Photo Evidence (Optional)</label>
              <div className="w-full bg-surface border border-outline-variant/30 border-dashed rounded-xl p-6 flex flex-col items-center justify-center gap-2 hover:border-primary/50 transition-colors relative cursor-pointer group shadow-sm">
                <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer z-10 w-full h-full" />
                <div className="w-12 h-12 rounded-full bg-primary-container/20 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                  <span className="material-symbols-outlined text-2xl">add_a_photo</span>
                </div>
                <span className="text-label-bold font-bold text-on-surface">Upload Photo</span>
                <span className="text-caption text-on-surface-variant">JPG, PNG up to 5MB</span>
              </div>
            </div>

            <div>
              <label className="text-label-bold font-bold text-on-surface block mb-2 uppercase tracking-wider text-xs">Complaint Details</label>
              <textarea 
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe the issue (e.g. huge craters, waterlogging, missing manhole cover)..."
                className="w-full bg-surface border border-outline-variant/30 rounded-xl p-4 text-body-md text-on-surface focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all shadow-sm min-h-[120px] resize-none"
              ></textarea>
            </div>

            <button 
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-primary text-on-primary h-[56px] rounded-full font-label-bold text-lg shadow-[0_4px_14px_rgba(124,58,237,0.39)] hover:bg-primary-fixed-variant transition-colors flex items-center justify-center gap-2 mt-2 disabled:opacity-70"
            >
              {isSubmitting ? (
                <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
              ) : (
                <>Submit Complaint <span className="material-symbols-outlined text-sm">send</span></>
              )}
            </button>
          </form>
        )}

        {/* Tab Content: Track Complaints */}
        {activeTab === 'track' && (
          <div className="flex flex-col gap-4">
            {complaints.length === 0 ? (
              <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-3xl p-8 text-center">
                <span className="material-symbols-outlined text-4xl text-outline mb-2">assignment</span>
                <p className="text-body-md text-on-surface-variant">No complaints submitted yet.</p>
              </div>
            ) : (
              complaints.map(complaint => (
                <div key={complaint.id} className="bg-surface-container-lowest border border-outline-variant/30 rounded-2xl p-5 shadow-sm">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <span className="text-xs font-bold text-outline-variant tracking-wider">{complaint.id} • {complaint.date}</span>
                      <h3 className="text-h3 font-h3 text-on-surface mt-1">{complaint.road}</h3>
                    </div>
                    <div className={`px-2.5 py-1 rounded-md text-xs font-bold tracking-wide ${
                      complaint.status === 'Resolved' ? 'bg-secondary-container text-secondary' : 
                      complaint.status === 'In Progress' ? 'bg-tertiary-container text-tertiary' : 
                      'bg-surface-variant text-on-surface-variant'
                    }`}>
                      {complaint.status}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4 mt-4 pt-4 border-t border-outline-variant/10">
                    <div className="flex-1">
                      <p className="text-[10px] text-on-surface-variant uppercase tracking-wider mb-0.5">Severity</p>
                      <p className={`text-sm font-bold ${
                        complaint.severity === 'Dangerous' ? 'text-error' : 
                        complaint.severity === 'Medium' ? 'text-tertiary' : 'text-on-surface'
                      }`}>{complaint.severity}</p>
                    </div>
                    <button className="text-primary text-sm font-bold flex items-center gap-1 hover:underline">
                      View Timeline <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </main>

      <BottomNavBar />
    </div>
  );
}
