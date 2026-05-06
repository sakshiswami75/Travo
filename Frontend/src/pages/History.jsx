import { useState, useEffect } from 'react';
import TopAppBar from '../components/TopAppBar';
import BottomNavBar from '../components/BottomNavBar';
import { reportService } from '../services/api';
import toast from 'react-hot-toast';

export default function History() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('All Status');
  
  const filters = ['All Status', 'Pending', 'Resolved'];

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        setLoading(true);
        const res = await reportService.getReports();
        setReports(res.data);
      } catch (err) {
        console.error('[HISTORY] Fetch error:', err);
        toast.error('Failed to load report history');
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, []);

  const filteredReports = reports.filter(r => {
    if (filter === 'All Status') return true;
    return r.status === filter;
  });

  return (
    <div className="bg-background text-on-background min-h-screen pb-32 flex flex-col antialiased">
      <TopAppBar title="History" />

      <main className="flex-1 w-full max-w-md mx-auto px-margin-mobile pt-stack-lg pb-stack-lg space-y-stack-lg">
        {/* Header & Summary Section */}
        <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/20 p-6 shadow-sm flex flex-col justify-center mb-6">
          <h1 className="text-h1 font-h1 text-on-surface mb-1">History</h1>
          <p className="text-body-sm text-on-surface-variant">Track your reported hazards and status updates.</p>
          
          <div className="mt-4 pt-4 border-t border-outline-variant/10 flex items-center gap-4">
            <div className="flex flex-col">
              <span className="text-h2 font-h2 text-primary leading-none">{reports.length}</span>
              <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider mt-1">Reports</span>
            </div>
            <div className="w-px h-8 bg-outline-variant/30"></div>
            <div className="flex flex-col">
              <span className="text-h2 font-h2 text-secondary leading-none">{reports.filter(r => r.status === 'Resolved').length}</span>
              <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider mt-1">Resolved</span>
            </div>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="flex gap-2 overflow-x-auto pb-2 hide-scrollbar items-center mb-6">
          {filters.map(f => (
            <button 
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 h-[40px] rounded-full text-[12px] font-bold shadow-sm whitespace-nowrap flex items-center gap-2 shrink-0 transition-colors ${
                filter === f 
                  ? 'bg-primary text-on-primary' 
                  : 'bg-surface-container-low text-on-surface-variant border border-outline-variant/30 hover:bg-surface-container'
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        {/* List */}
        <div className="space-y-4">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
              <p className="text-body-sm text-on-surface-variant">Loading your history...</p>
            </div>
          ) : filteredReports.length > 0 ? (
            filteredReports.map((report) => (
              <div key={report._id} className="bg-surface-container-lowest rounded-2xl border border-outline-variant/20 p-4 shadow-sm flex gap-4 items-start group">
                <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0 bg-surface-variant border border-outline-variant/10">
                  <img src={report.imageUrl} alt="Hazard" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start mb-1 gap-2">
                    <h4 className="text-body-lg font-bold text-on-surface truncate">{report.location || 'Unknown Location'}</h4>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0 border ${
                      report.status === 'Resolved' ? 'bg-secondary-container/20 text-secondary border-secondary/20' : 
                      'bg-surface-container-high text-on-surface-variant border-outline-variant/20'
                    }`}>
                      {report.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`w-2 h-2 rounded-full ${
                      report.severity === 'Critical' ? 'bg-error' : 
                      report.severity === 'High' ? 'bg-tertiary' :
                      report.severity === 'Medium' ? 'bg-outline' : 'bg-secondary'
                    }`}></span>
                    <p className="text-body-sm text-on-surface-variant">{report.severity} Risk</p>
                  </div>
                  <div className="flex items-center gap-3 text-[11px] font-medium text-on-surface-variant/70">
                    <span className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-[14px]">calendar_today</span>
                      {new Date(report.createdAt).toLocaleDateString()}
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-[14px]">schedule</span>
                      {new Date(report.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="p-8 text-center bg-surface-container-low border border-dashed border-outline-variant/50 rounded-2xl">
              <span className="material-symbols-outlined text-4xl text-outline mb-3">history</span>
              <p className="text-body-md text-on-surface-variant">No reports found.</p>
              <button onClick={() => setFilter('All Status')} className="text-primary text-label-bold mt-2">Clear filters</button>
            </div>
          )}
        </div>
      </main>

      <BottomNavBar />
    </div>
  );
}
