import { Link, useLocation } from 'react-router-dom';
import ThemeToggle from './ThemeToggle';
import logo from '../assets/logo.png';

export default function TopAppBar({ title = "Travo", profilePic = "https://lh3.googleusercontent.com/aida-public/AB6AXuAT4cq7DH4zotFxiVSys6pvXLYHZNzaM861HSHp5NI8ZuQYQ8oOTtJCmQRVBVKsZ4mhI9o52oorPNyOapAnpLef9be90qw5yV5I4V-6KmfLMKYT8nYzrcRn6IfE1uzmiJPRU4bx1EvworJL8l9x0jftPNesvbBfCy8y_3C-66rWBwiDH2vC__iftTi5qIuaJoicd-6QN4t0Xn1m2YDAyHVhFxK49XwwYF_CZrs1BlYT80Phq3jzfXW_gsf6IbipbNo6XmzJlVMYrT-0" }) {
  const location = useLocation();
  const currentPath = location.pathname;

  return (
    <>
      {/* Unified Top App Bar (Mobile-style for all) */}
      <header className="flex justify-between items-center w-full px-margin-mobile h-touch-target-min bg-surface/80 backdrop-blur-md shadow-sm sticky top-0 z-50 border-b border-outline-variant/20">
        <div className="flex items-center gap-2">
          <img src={logo} alt="Travo Logo" className="w-8 h-8 rounded-lg object-cover" />
          <span className="text-h2 font-h2 text-primary tracking-tight">{title}</span>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Link to="/profile" className="w-10 h-10 rounded-full bg-surface-container-high overflow-hidden border border-outline-variant/30 flex-shrink-0">
            <img src={profilePic} alt="User profile photo" className="w-full h-full object-cover" />
          </Link>
        </div>
      </header>
    </>
  );
}
