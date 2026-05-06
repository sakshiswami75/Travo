import { Link, useLocation } from 'react-router-dom';
import ThemeToggle from './ThemeToggle';

export default function TopAppBar({ title = "Travo", profilePic = "https://lh3.googleusercontent.com/aida-public/AB6AXuAT4cq7DH4zotFxiVSys6pvXLYHZNzaM861HSHp5NI8ZuQYQ8oOTtJCmQRVBVKsZ4mhI9o52oorPNyOapAnpLef9be90qw5yV5I4V-6KmfLMKYT8nYzrcRn6IfE1uzmiJPRU4bx1EvworJL8l9x0jftPNesvbBfCy8y_3C-66rWBwiDH2vC__iftTi5qIuaJoicd-6QN4t0Xn1m2YDAyHVhFxK49XwwYF_CZrs1BlYT80Phq3jzfXW_gsf6IbipbNo6XmzJlVMYrT-0" }) {
  const location = useLocation();
  const currentPath = location.pathname;

  return (
    <>
      {/* Mobile Top App Bar */}
      <header className="md:hidden flex justify-between items-center w-full px-margin-mobile h-touch-target-min bg-surface/80 backdrop-blur-md shadow-sm sticky top-0 z-50 border-b border-outline-variant/20">
        <div className="flex items-center gap-2">
          <button className="w-10 h-10 flex items-center justify-center text-primary hover:bg-surface-container transition-colors rounded-full">
            <span className="material-symbols-outlined">menu</span>
          </button>
          <span className="text-h2 font-h2 text-primary tracking-tight">{title}</span>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Link to="/profile" className="w-10 h-10 rounded-full bg-surface-container-high overflow-hidden border border-outline-variant/30 flex-shrink-0">
            <img src={profilePic} alt="User profile photo" className="w-full h-full object-cover" />
          </Link>
        </div>
      </header>

      {/* Web Top App Bar */}
      <header className="hidden md:flex justify-between items-center w-full px-margin-mobile h-touch-target-min bg-surface/80 backdrop-blur-md shadow-sm sticky top-0 z-50 max-w-7xl mx-auto border-b border-outline-variant/20">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <img src={profilePic} alt="Travo App Icon" className="w-8 h-8 rounded-lg object-cover" />
            <h1 className="text-h2 font-h2 text-primary tracking-tight">{title}</h1>
          </div>
        </div>
        
        {/* Web Nav Links */}
        <nav className="flex gap-6">
          <Link to="/home" className={`px-4 py-2 rounded-lg text-label-bold font-label-bold flex items-center gap-2 transition-colors ${currentPath === '/home' ? 'text-primary font-bold bg-surface-container' : 'text-on-surface-variant hover:bg-surface-container'}`}>
            <span className="material-symbols-outlined" style={{ fontVariationSettings: currentPath === '/home' ? "'FILL' 1" : "'FILL' 0" }}>home</span>Home
          </Link>
          <Link to="/map" className={`px-4 py-2 rounded-lg text-label-bold font-label-bold flex items-center gap-2 transition-colors ${currentPath === '/map' ? 'text-primary font-bold bg-surface-container' : 'text-on-surface-variant hover:bg-surface-container'}`}>
            <span className="material-symbols-outlined" style={{ fontVariationSettings: currentPath === '/map' ? "'FILL' 1" : "'FILL' 0" }}>map</span>Maps
          </Link>
          <Link to="/alerts" className={`px-4 py-2 rounded-lg text-label-bold font-label-bold flex items-center gap-2 transition-colors ${currentPath === '/alerts' ? 'text-primary font-bold bg-surface-container' : 'text-on-surface-variant hover:bg-surface-container'}`}>
            <span className="material-symbols-outlined" style={{ fontVariationSettings: currentPath === '/alerts' ? "'FILL' 1" : "'FILL' 0" }}>notifications</span>Alerts
          </Link>
          <Link to="/history" className={`px-4 py-2 rounded-lg text-label-bold font-label-bold flex items-center gap-2 transition-colors ${currentPath === '/history' ? 'text-primary font-bold bg-surface-container' : 'text-on-surface-variant hover:bg-surface-container'}`}>
            <span className="material-symbols-outlined" style={{ fontVariationSettings: currentPath === '/history' ? "'FILL' 1" : "'FILL' 0" }}>history</span>History
          </Link>
        </nav>

        <div className="flex items-center gap-4">
          <ThemeToggle />
          <Link to="/scan" className="hidden md:flex bg-primary-container text-on-primary rounded-full px-6 py-2 items-center gap-2 shadow-sm hover:shadow-md transition-all">
            <span className="material-symbols-outlined text-sm">center_focus_strong</span>
            <span className="text-label-bold font-label-bold">Report</span>
          </Link>
          <Link to="/profile" className="w-10 h-10 rounded-full bg-surface-variant overflow-hidden border border-outline-variant/20 hover:opacity-80 transition-opacity cursor-pointer">
            <img src={profilePic} alt="User Profile" className="w-full h-full object-cover" />
          </Link>
        </div>
      </header>
    </>
  );
}
