import { Link, useLocation, useNavigate } from 'react-router-dom';
import ThemeToggle from './ThemeToggle';
import Logo from './Logo';

export default function TopAppBar({ title = "Travo", profilePic = "https://lh3.googleusercontent.com/aida-public/AB6AXuAT4cq7DH4zotFxiVSys6pvXLYHZNzaM861HSHp5NI8ZuQYQ8oOTtJCmQRVBVKsZ4mhI9o52oorPNyOapAnpLef9be90qw5yV5I4V-6KmfLMKYT8nYzrcRn6IfE1uzmiJPRU4bx1EvworJL8l9x0jftPNesvbBfCy8y_3C-66rWBwiDH2vC__iftTi5qIuaJoicd-6QN4t0Xn1m2YDAyHVhFxK49XwwYF_CZrs1BlYT80Phq3jzfXW_gsf6IbipbNo6XmzJlVMYrT-0", showBack = false, onBack }) {
  const location = useLocation();
  const navigate = useNavigate();
  const currentPath = location.pathname;

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      navigate(-1);
    }
  };

  return (
    <>
      {/* Unified Top App Bar (Mobile-style for all) */}
      <header className="flex justify-between items-center w-full px-margin-mobile h-touch-target-min bg-surface/80 backdrop-blur-md shadow-sm sticky top-0 z-50 border-b border-outline-variant/20">
        <div className="flex items-center gap-2">
          {showBack ? (
            <button 
              onClick={handleBack}
              className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-surface-container transition-colors active:scale-95"
            >
              <span className="material-symbols-outlined text-on-surface">arrow_back</span>
            </button>
          ) : (
            <Logo size={32} className="rounded-lg shadow-sm" />
          )}
          <span className={`text-h2 font-h2 text-primary tracking-tight ${showBack ? 'ml-1' : ''}`}>{title}</span>
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
