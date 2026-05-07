import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Logo from '../components/Logo';

export default function Splash() {
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => {
      navigate('/login');
    }, 2800);
    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="h-screen bg-black flex flex-col justify-center items-center relative overflow-hidden font-sans">
      
      {/* Background Deep Space/Tech Glow Effects */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-[100px] animate-pulse" style={{ animationDuration: '4s' }}></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-600/20 rounded-full blur-[100px] animate-pulse" style={{ animationDuration: '5s' }}></div>
        <div className="absolute inset-0 bg-[linear-gradient(to_bottom,transparent_0%,#000000_100%)] opacity-80"></div>
      </div>
      
      {/* Central Identity Container */}
      <div className="z-10 flex flex-col items-center justify-center transform transition-all animate-fade-in-up">
        
        {/* Animated Logo Container */}
        <div className="relative mb-6">
          <div className="absolute inset-0 bg-primary/30 rounded-[32px] blur-xl animate-pulse" style={{ animationDuration: '2s' }}></div>
          <div className="relative bg-surface-container-lowest/10 backdrop-blur-md border border-white/10 p-5 rounded-[32px] shadow-2xl">
            <Logo size={100} className="drop-shadow-[0_0_15px_rgba(124,58,237,0.8)]" />
          </div>
        </div>

        {/* Brand Typography */}
        <div className="text-center flex flex-col items-center gap-2">
          <h1 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400 tracking-tight drop-shadow-lg">
            TRAVO
          </h1>
          <div className="flex items-center gap-3 opacity-0 animate-fade-in" style={{ animationDelay: '0.8s', animationFillMode: 'forwards' }}>
            <div className="w-8 h-[1px] bg-primary"></div>
            <p className="text-sm font-semibold tracking-[0.2em] text-primary-fixed uppercase drop-shadow-md">
              AI Smart Road Intelligence
            </p>
            <div className="w-8 h-[1px] bg-primary"></div>
          </div>
        </div>

      </div>

      {/* Bottom Loading Bar */}
      <div className="absolute bottom-12 w-48 z-10 opacity-0 animate-fade-in" style={{ animationDelay: '1.2s', animationFillMode: 'forwards' }}>
        <div className="h-1 w-full bg-white/10 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-primary to-blue-500 rounded-full animate-loading-bar origin-left"></div>
        </div>
      </div>

    </div>
  );
}
