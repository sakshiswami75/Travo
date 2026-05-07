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
  const [role, setRole] = useState('Citizen'); // Default role
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
        res = await authService.signup({ name, email, password, role });
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

              {/* Segmented Role Selection */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-gray-300 uppercase tracking-wider pl-1">Select Role</label>
                <div className="grid grid-cols-2 gap-3">
                  <div 
                    onClick={() => setRole('Citizen')}
                    className={`cursor-pointer rounded-xl p-3 border flex items-center justify-center gap-2 transition-all duration-300 ${role === 'Citizen' ? 'bg-primary/20 border-primary text-white shadow-[inset_0_0_15px_rgba(124,58,237,0.2)]' : 'bg-black/40 border-white/5 text-gray-400 hover:bg-black/60 hover:border-white/20'}`}
                  >
                    <span className="material-symbols-outlined text-[18px]">group</span>
                    <span className="font-bold text-sm">Citizen</span>
                  </div>
                  <div 
                    onClick={() => setRole('Driver')}
                    className={`cursor-pointer rounded-xl p-3 border flex items-center justify-center gap-2 transition-all duration-300 ${role === 'Driver' ? 'bg-blue-500/20 border-blue-500 text-white shadow-[inset_0_0_15px_rgba(59,130,246,0.2)]' : 'bg-black/40 border-white/5 text-gray-400 hover:bg-black/60 hover:border-white/20'}`}
                  >
                    <span className="material-symbols-outlined text-[18px]">directions_car</span>
                    <span className="font-bold text-sm">Driver</span>
                  </div>
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
        
        {/* Divider */}
        <div className="flex items-center gap-4 my-8">
          <div className="h-px bg-white/10 flex-1"></div>
          <span className="text-xs text-gray-500 font-bold uppercase tracking-widest">Or connect via</span>
          <div className="h-px bg-white/10 flex-1"></div>
        </div>
        
        {/* Social Logins */}
        <div className="flex flex-col gap-3">
          <button type="button" className="w-full h-12 bg-white/5 border border-white/10 text-white rounded-xl font-bold text-sm shadow-sm hover:bg-white/10 transition-colors flex items-center justify-center gap-3">
            <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.62-1.496 3.603-2.947 1.156-1.689 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.533 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.68.727-1.303 2.145-1.107 3.531 1.353.104 2.548-.507 3.394-1.519z"></path>
            </svg>
            Apple
          </button>
          <button type="button" className="w-full h-12 bg-white/5 border border-white/10 text-white rounded-xl font-bold text-sm shadow-sm hover:bg-white/10 transition-colors flex items-center justify-center gap-3">
            <svg className="w-5 h-5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"></path>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"></path>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"></path>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"></path>
            </svg>
            Google
          </button>
        </div>
        
        <p className="mt-8 text-center text-[11px] text-gray-500 font-medium">
          By continuing, you agree to Travo's <br/>
          <a href="#" className="text-gray-400 hover:text-white transition-colors underline decoration-white/30">Terms of Service</a> and <a href="#" className="text-gray-400 hover:text-white transition-colors underline decoration-white/30">Privacy Policy</a>.
        </p>
      </div>
    </div>
  );
}
