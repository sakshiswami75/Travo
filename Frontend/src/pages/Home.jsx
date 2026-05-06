import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import TopAppBar from '../components/TopAppBar';
import BottomNavBar from '../components/BottomNavBar';
import { homeService } from '../services/api';

export default function Home() {
  const [dashboard, setDashboard] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      // For the hackathon, we might want to auto-login as John Doe if no token is found, or redirect to login.
      // Let's redirect to login for a "proper" flow.
      navigate('/login');
      return;
    }

    const fetchData = async () => {
      try {
        setLoading(true);
        const [dashRes, alertsRes] = await Promise.all([
          homeService.getDashboard(),
          homeService.getAlerts()
        ]);
        setDashboard(dashRes.data);
        setAlerts(alertsRes.data);
      } catch (err) {
        console.error(err);
        setError('Failed to load dashboard data. Please try again.');
        if (err.response && err.response.status === 401) {
          localStorage.removeItem('token');
          navigate('/login');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [navigate]);

  if (loading) {
    return (
      <div className="bg-background text-on-background min-h-screen font-body-md pb-32 flex flex-col antialiased">
        <TopAppBar />
        <main className="flex-1 w-full max-w-md mx-auto px-margin-mobile pt-stack-lg pb-stack-lg flex items-center justify-center">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
        </main>
        <BottomNavBar />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-background text-on-background min-h-screen font-body-md pb-32 flex flex-col antialiased">
        <TopAppBar />
        <main className="flex-1 w-full max-w-md mx-auto px-margin-mobile pt-stack-lg pb-stack-lg text-center text-error">
          <p>{error}</p>
        </main>
        <BottomNavBar />
      </div>
    );
  }

  return (
    <div className="bg-background text-on-background min-h-screen font-body-md pb-32 flex flex-col antialiased">
      <TopAppBar />
      
      <main className="flex-1 w-full max-w-md mx-auto px-margin-mobile pt-stack-lg pb-stack-lg space-y-stack-lg">
        {/* Greeting & Date */}
        <section className="mb-stack-lg">
          <h2 className="text-h1 font-h1 text-on-surface">Hello, {dashboard?.name.split(' ')[0]}</h2>
          <p className="text-body-md font-body-md text-on-surface-variant mt-1">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })} • Safe travels today.
          </p>
        </section>

        {/* Top Bento Grid */}
        <div className="grid grid-cols-1 gap-gutter">
          {/* Safety Score Card */}
          <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/20 shadow-sm p-5 relative overflow-hidden flex flex-col justify-between">
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
                  <circle className="text-secondary" cx="50" cy="50" fill="none" r="45" stroke="currentColor" strokeDasharray="282.7" strokeDashoffset={282.7 - (282.7 * dashboard?.safetyScore) / 100} strokeLinecap="round" strokeWidth="8"></circle>
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-h2 font-h2 text-on-surface leading-none">{dashboard?.safetyScore}</span>
                  <span className="text-[10px] font-caption text-secondary font-bold uppercase tracking-wider mt-1">Excellent</span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 flex-1">
                <div className="bg-surface-container-low rounded-xl p-3 border border-outline-variant/10">
                  <span className="text-caption font-caption text-on-surface-variant flex items-center gap-1">
                    <span className="material-symbols-outlined text-[16px]">speed</span> Avg Speed
                  </span>
                  <p className="text-h3 font-h3 text-on-surface mt-1">{dashboard?.avgSpeed} <span className="text-body-sm font-body-sm text-on-surface-variant">mph</span></p>
                </div>
                <div className="bg-surface-container-low rounded-xl p-3 border border-outline-variant/10">
                  <span className="text-caption font-caption text-on-surface-variant flex items-center gap-1">
                    <span className="material-symbols-outlined text-[16px]">route</span> Safe Routes
                  </span>
                  <p className="text-h3 font-h3 text-on-surface mt-1">{dashboard?.routesSafePercentage}<span className="text-body-sm font-body-sm text-on-surface-variant">%</span></p>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Map Preview */}
          <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/20 shadow-sm overflow-hidden flex flex-col h-full min-h-[200px] relative group">
            <div className="absolute top-4 left-4 z-10 bg-surface/90 backdrop-blur-sm px-3 py-1.5 rounded-full shadow-sm border border-outline-variant/20 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-primary animate-pulse"></div>
              <span className="text-caption font-caption text-on-surface font-semibold">Downtown</span>
            </div>
            <div className="w-full h-full bg-surface-variant relative">
              <img src="https://lh3.googleusercontent.com/aida-public/AB6AXuBu4joWZaYZKbwAwLzFZ_WzrRBAcQKnV7t_znoEZ8zig1trh6txkgcmE0FAxK1N5uD6keszxWuDz-XC-Y_BkS1Cnz91o1XfqKaQBxg2aXzvwSVjl5x0vG4FbqgP5qvtY5CeVeYqcRNZ17oZkofvdMcnq1iJ7cYWM4AyUFegUPmGAQlNx_tPGQvUnKHV021Y3b0hr4cjXBz88E97JWUrr3IfKfNwwtStzWVx7PK4-qnccaF0vxOdQaJYHuO4yHTQOcmfogLS-DOWA_A8" alt="Map preview" className="w-full h-full object-cover opacity-80 mix-blend-multiply group-hover:scale-105 transition-transform duration-700 ease-in-out" />
              <div className="absolute inset-0 bg-gradient-to-t from-surface/90 via-surface/20 to-transparent pointer-events-none"></div>
            </div>
            <div className="absolute bottom-4 left-4 right-4 z-10">
              <Link to="/map" className="w-full bg-surface text-primary border border-outline-variant/20 h-12 rounded-xl flex items-center justify-center gap-2 shadow-sm hover:bg-surface-container transition-colors">
                <span className="material-symbols-outlined">navigation</span>
                <span className="text-label-bold font-label-bold">Find Route</span>
              </Link>
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
            <Link to="/alerts" className="text-primary text-label-bold font-label-bold hover:underline">View All</Link>
          </div>
          <div className="grid grid-cols-1 gap-gutter">
            {alerts.length > 0 ? alerts.map((alert) => (
              <div key={alert._id} className="bg-surface-container-lowest border border-outline-variant/20 rounded-2xl p-4 flex gap-4 shadow-sm hover:shadow-md transition-shadow">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${
                  alert.severity === 'High' ? 'bg-error-container/50 text-error' :
                  alert.severity === 'Moderate' ? 'bg-tertiary-container/20 text-tertiary' :
                  'bg-secondary-container/20 text-secondary'
                }`}>
                  <span className="material-symbols-outlined">
                    {alert.title.toLowerCase().includes('traffic') ? 'traffic' : 
                     alert.title.toLowerCase().includes('construction') ? 'construction' : 'warning'}
                  </span>
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <h4 className="text-label-bold font-label-bold text-on-surface text-base">{alert.title}</h4>
                  </div>
                  <p className="text-body-sm font-body-sm text-on-surface-variant mt-1">{alert.description}</p>
                  <div className="mt-3 flex gap-2">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-caption font-bold bg-surface-variant text-on-surface-variant">{alert.distance}</span>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-caption font-bold ${
                      alert.severity === 'High' ? 'bg-error-container/30 text-error' :
                      alert.severity === 'Moderate' ? 'bg-tertiary-container/20 text-tertiary' :
                      'bg-secondary-container/20 text-secondary'
                    }`}>{alert.severity} Impact</span>
                  </div>
                </div>
              </div>
            )) : (
              <div className="col-span-full p-4 text-center text-on-surface-variant bg-surface-container-lowest border border-outline-variant/20 rounded-2xl">
                No nearby alerts at this time.
              </div>
            )}
          </div>
        </section>
      </main>

      <BottomNavBar />
    </div>
  );
}
