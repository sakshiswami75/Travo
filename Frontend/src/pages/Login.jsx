import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { authService } from '../services/api';
import Logo from '../components/Logo';

export default function Login() {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const toastId = toast.loading(isLogin ? 'Authenticating...' : 'Creating account...');

    try {
      let res;
      if (isLogin) {
        res = await authService.login({ email, password });
        toast.success('Welcome back to Travo', { id: toastId });
      } else {
        if (!name.trim()) throw new Error('Full name is required');
        res = await authService.signup({ name, email, password });
        toast.success('Account created successfully!', { id: toastId });
      }

      localStorage.setItem('token', res.data.token);
      navigate('/home');
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Authentication failed';
      toast.error(errorMessage, { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 relative bg-black font-sans">
      
      {/* Premium Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-primary/20 rounded-full blur-[100px] animate-pulse" style={{ animationDuration: '4s' }}></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-blue-600/10 rounded-full blur-[100px] animate-pulse" style={{ animationDuration: '6s' }}></div>
        <div className="absolute inset-0 bg-[linear-gradient(to_bottom,transparent_0%,#000000_100%)] opacity-90"></div>
      </div>
      
      <div className="w-full max-w-md bg-surface-container-lowest/10 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/10 p-8 z-10 animate-fade-in-up">
        
        {/* Logo Header */}
        <div className="flex flex-col items-center mb-8">
          <div className="p-3 bg-surface-container-lowest/5 rounded-2xl border border-white/5 shadow-inner mb-4">
            <Logo size={48} className="drop-shadow-[0_0_10px_rgba(124,58,237,0.5)]" />
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight drop-shadow-md">Welcome to Travo</h1>
          <p className="text-sm font-medium text-gray-400 mt-1 tracking-wide">AI Powered Smart Road Intelligence</p>
        </div>
        
        {/* Toggle Tabs (Segmented Control) */}
        <div className="flex bg-black/40 rounded-xl p-1 mb-8 border border-white/5 shadow-inner relative">
          <div 
            className={`absolute top-1 bottom-1 w-[calc(50%-4px)] bg-surface-container-lowest/10 border border-white/10 rounded-lg shadow-md transition-all duration-300 ease-out ${isLogin ? 'left-1' : 'left-[calc(50%+3px)]'}`}
          ></div>
          <button 
            type="button"
            className={`flex-1 py-2.5 text-center rounded-lg font-bold text-sm transition-colors relative z-10 ${isLogin ? 'text-white' : 'text-gray-400 hover:text-gray-200'}`}
            onClick={() => setIsLogin(true)}
          >
            Login
          </button>
          <button 
            type="button"
            className={`flex-1 py-2.5 text-center rounded-lg font-bold text-sm transition-colors relative z-10 ${!isLogin ? 'text-white' : 'text-gray-400 hover:text-gray-200'}`}
            onClick={() => setIsLogin(false)}
          >
            Sign Up
          </button>
        </div>

        {/* Login/Signup Form */}
        <form className="flex flex-col gap-5" onSubmit={handleSubmit}>
          {!isLogin && (
            <>
              {/* Name Field */}
              <div className="flex flex-col gap-1.5 relative group">
                <label htmlFor="name" className="text-xs font-bold text-gray-300 uppercase tracking-wider pl-1">Full Name</label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-primary transition-colors text-[20px]">person</span>
                  <input 
                    type="text" 
                    id="name" 
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter your name"
                    autoComplete="off"
                    required={!isLogin}
                    className="w-full h-12 pl-10 pr-4 bg-black/40 border border-white/10 rounded-xl text-white text-sm focus:bg-black/60 focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-all placeholder:text-gray-600 shadow-inner" 
                  />
                </div>
              </div>
            </>
          )}

          <div className="flex flex-col gap-1.5 relative group">
            <label htmlFor="email" className="text-xs font-bold text-gray-300 uppercase tracking-wider pl-1">Email Address</label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-primary transition-colors text-[20px]">mail</span>
              <input 
                type="email" 
                id="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                autoComplete="off"
                required
                className="w-full h-12 pl-10 pr-4 bg-black/40 border border-white/10 rounded-xl text-white text-sm focus:bg-black/60 focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-all placeholder:text-gray-600 shadow-inner" 
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5 relative group">
            <label htmlFor="password" className="text-xs font-bold text-gray-300 uppercase tracking-wider pl-1">Password</label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-primary transition-colors text-[20px]">lock</span>
              <input 
                type="password" 
                id="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="new-password"
                required
                className="w-full h-12 pl-10 pr-4 bg-black/40 border border-white/10 rounded-xl text-white text-sm focus:bg-black/60 focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-all placeholder:text-gray-600 shadow-inner tracking-widest" 
              />
            </div>
          </div>

          <button disabled={loading} type="submit" className="w-full h-14 mt-4 bg-gradient-to-r from-primary to-blue-600 text-white rounded-xl font-bold text-base shadow-[0_4px_20px_rgba(124,58,237,0.4)] hover:shadow-[0_4px_25px_rgba(124,58,237,0.6)] hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed">
            {loading ? (
              <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              <>
                {isLogin ? 'Secure Login' : 'Create Account'}
                <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
              </>
            )}
          </button>
        </form>
        
        <p className="mt-8 text-center text-[11px] text-gray-500 font-medium">
          By continuing, you agree to Travo's <br/>
          <a href="#" className="text-gray-400 hover:text-white transition-colors underline decoration-white/30">Terms of Service</a> and <a href="#" className="text-gray-400 hover:text-white transition-colors underline decoration-white/30">Privacy Policy</a>.
        </p>
      </div>
    </div>
  );
}
