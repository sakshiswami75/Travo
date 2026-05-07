import React from 'react';
import logoImg from '../assets/logo.png';

export default function Logo({ size = 40, className = '' }) {
  // We use inline styles for dynamic sizing, and Tailwind classes for the premium look.
  // The 'rounded-full' removes the square white background around the circular logo.
  return (
    <div 
      className={`relative flex items-center justify-center bg-white rounded-full shadow-[0_0_20px_rgba(124,58,237,0.3)] border border-white/20 ${className}`}
      style={{ width: size, height: size }}
    >
      <img 
        src={logoImg} 
        alt="Travo Logo" 
        className="w-full h-full object-cover rounded-full mix-blend-multiply drop-shadow-sm"
        style={{ padding: size > 50 ? '4px' : '2px' }}
      />
      {/* Subtle inner glow overlay */}
      <div className="absolute inset-0 rounded-full border border-black/5 pointer-events-none"></div>
    </div>
  );
}
