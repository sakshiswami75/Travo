import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Splash() {
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => {
      navigate('/login');
    }, 2500);
    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="h-screen bg-background flex flex-col justify-between items-center relative overflow-hidden font-body-md text-body-md text-on-background">
      {/* Subtle Gradient Background */}
      <div className="absolute inset-0 pointer-events-none z-0 bg-gradient-to-br from-surface-bright via-background to-surface-container-low"></div>
      <div className="absolute inset-0 pointer-events-none z-0 opacity-40 bg-[radial-gradient(circle_at_50%_0%,rgba(124,58,237,0.1)_0%,transparent_50%)]"></div>
      
      {/* Top Spacer */}
      <div className="flex-1 w-full flex flex-col items-center justify-center z-10 p-margin-mobile">
        {/* Logo Container */}
        <div className="w-32 h-32 md:w-40 md:h-40 rounded-3xl bg-surface shadow-[0_12px_24px_-8px_rgba(124,58,237,0.15)] flex items-center justify-center mb-stack-lg border border-outline-variant/30">
          <img src="https://lh3.googleusercontent.com/aida-public/AB6AXuAT4cq7DH4zotFxiVSys6pvXLYHZNzaM861HSHp5NI8ZuQYQ8oOTtJCmQRVBVKsZ4mhI9o52oorPNyOapAnpLef9be90qw5yV5I4V-6KmfLMKYT8nYzrcRn6IfE1uzmiJPRU4bx1EvworJL8l9x0jftPNesvbBfCy8y_3C-66rWBwiDH2vC__iftTi5qIuaJoicd-6QN4t0Xn1m2YDAyHVhFxK49XwwYF_CZrs1BlYT80Phq3jzfXW_gsf6IbipbNo6XmzJlVMYrT-0" alt="Travo Logo" className="w-24 h-24 md:w-32 md:h-32 object-contain" />
        </div>
        {/* Typography */}
        <div className="text-center max-w-sm">
          <h1 className="font-h1 text-h1 text-on-background mb-stack-sm tracking-tight">Travo</h1>
          <p className="font-body-lg text-body-lg text-on-surface-variant font-light">Smart Roads. Safer Journeys.</p>
        </div>
      </div>
      
      {/* Bottom Loading Area */}
      <div className="w-full flex flex-col items-center justify-end z-10 pb-stack-lg px-margin-mobile mb-8">
        {/* Loading Indicator */}
        <div className="flex flex-col items-center gap-stack-sm">
          {/* Spinner */}
          <svg className="animate-spin -ml-1 mr-3 h-8 w-8 text-primary" fill="none" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span className="font-caption text-caption text-outline uppercase tracking-widest mt-2">Initializing</span>
        </div>
      </div>
    </div>
  );
}
