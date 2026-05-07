import { Link, useLocation, useNavigate } from 'react-router-dom';
import ThemeToggle from './ThemeToggle';
import Logo from './Logo';

export default function TopAppBar({ title = "", profilePic = "https://ui-avatars.com/api/?name=User&background=7C3AED&color=fff&rounded=true&bold=true", showBack = false, onBack }) {
  const location = useLocation();
  const navigate = useNavigate();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      navigate(-1);
    }
  };

  return (
    <>
      <header className="flex justify-between items-center w-full px-margin-mobile h-touch-target-min bg-surface/80 backdrop-blur-md shadow-sm sticky top-0 z-50 border-b border-outline-variant/20">
        <div className="flex items-center gap-2">
          {showBack && (
            <button 
              onClick={handleBack}
              className="w-8 h-8 -ml-2 rounded-full flex items-center justify-center hover:bg-surface-container transition-colors active:scale-95"
            >
              <span className="material-symbols-outlined text-on-surface">arrow_back</span>
            </button>
          )}
          <Logo size={28} className="rounded-lg shadow-sm" />
          <span className="text-h2 font-h2 text-primary tracking-tight ml-1">Travo</span>
          {title && title !== "Travo" && (
            <>
              <span className="text-on-surface-variant text-sm mx-1">•</span>
              <span className="text-body-sm font-label-bold text-on-surface-variant truncate max-w-[120px]">{title}</span>
            </>
          )}
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Link to="/profile" className="w-8 h-8 rounded-full bg-surface-container-high overflow-hidden border border-outline-variant/30 flex-shrink-0 shadow-sm transition-transform hover:scale-105 active:scale-95">
            <img src={profilePic} alt="User profile" className="w-full h-full object-cover" />
          </Link>
        </div>
      </header>
    </>
  );
}
