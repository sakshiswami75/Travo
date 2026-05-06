import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { authService } from '../services/api';
import logo from '../assets/logo.png';

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
    const toastId = toast.loading(isLogin ? 'Logging in...' : 'Creating account...');

    try {
      let res;
      if (isLogin) {
        res = await authService.login({ email, password });
        toast.success('Welcome back!', { id: toastId });
      } else {
        // Validate name for signup
        if (!name.trim()) {
          throw new Error('Full name is required');
        }
        res = await authService.signup({ name, email, password, role });
        toast.success('Account created successfully!', { id: toastId });
      }

      // Save token and navigate
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
    <div className="min-h-screen flex items-center justify-center p-margin-mobile relative bg-background">
      {/* Decorative Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-primary-container/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-secondary-fixed/5 rounded-full blur-3xl"></div>
      </div>
      
      <div className="w-full max-w-md bg-surface-container-lowest rounded-xl shadow-lg border border-outline-variant/20 p-stack-lg z-10">
        {/* Logo Header */}
        <div className="flex flex-col items-center mb-stack-lg">
          <img src={logo} alt="Travo App Icon" className="w-20 h-20 mb-stack-sm object-contain" />
          <h1 className="font-h1 text-h1 text-on-surface">Travo</h1>
        </div>
        
        {/* Toggle Tabs */}
        <div className="flex bg-surface-container-low rounded-lg p-1 mb-stack-lg border border-outline-variant/30">
          <button 
            type="button"
            className={`flex-1 py-2 text-center rounded-md font-label-bold text-label-bold transition-colors ${isLogin ? 'bg-surface-container-lowest shadow-sm text-primary' : 'text-on-surface-variant hover:bg-surface-container'}`}
            onClick={() => setIsLogin(true)}
          >
            Login
          </button>
          <button 
            type="button"
            className={`flex-1 py-2 text-center rounded-md font-label-bold text-label-bold transition-colors ${!isLogin ? 'bg-surface-container-lowest shadow-sm text-primary' : 'text-on-surface-variant hover:bg-surface-container'}`}
            onClick={() => setIsLogin(false)}
          >
            Sign Up
          </button>
        </div>

        {/* Login/Signup Form */}
        <form className="flex flex-col gap-stack-md" onSubmit={handleSubmit}>
          {!isLogin && (
            <>
              <div className="flex flex-col gap-stack-sm">
                <label htmlFor="name" className="font-label-bold text-label-bold text-on-surface">Full Name</label>
                <input 
                  type="text" 
                  id="name" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoComplete="off"
                  required={!isLogin}
                  className="w-full h-touch-target-min px-4 bg-surface-container-low border-none rounded-lg text-on-surface font-body-md text-body-md focus:ring-2 focus:ring-primary-container transition-shadow shadow-sm" 
                />
              </div>

              <div className="flex flex-col gap-stack-sm">
                <label className="font-label-bold text-label-bold text-on-surface">Role</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="radio" 
                      name="role" 
                      value="Citizen" 
                      checked={role === 'Citizen'} 
                      onChange={(e) => setRole(e.target.value)}
                      className="text-primary focus:ring-primary"
                    />
                    <span className="text-body-md text-on-surface">Citizen</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="radio" 
                      name="role" 
                      value="Driver" 
                      checked={role === 'Driver'} 
                      onChange={(e) => setRole(e.target.value)}
                      className="text-primary focus:ring-primary"
                    />
                    <span className="text-body-md text-on-surface">Driver</span>
                  </label>
                </div>
              </div>
            </>
          )}

          <div className="flex flex-col gap-stack-sm">
            <label htmlFor="email" className="font-label-bold text-label-bold text-on-surface">Email Address</label>
            <input 
              type="email" 
              id="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="off"
              required
              className="w-full h-touch-target-min px-4 bg-surface-container-low border-none rounded-lg text-on-surface font-body-md text-body-md focus:ring-2 focus:ring-primary-container transition-shadow shadow-sm" 
            />
          </div>

          <div className="flex flex-col gap-stack-sm">
            <label htmlFor="password" className="font-label-bold text-label-bold text-on-surface">Password</label>
            <input 
              type="password" 
              id="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
              required
              className="w-full h-touch-target-min px-4 bg-surface-container-low border-none rounded-lg text-on-surface font-body-md text-body-md focus:ring-2 focus:ring-primary-container transition-shadow shadow-sm" 
            />
          </div>

          <button disabled={loading} type="submit" className="w-full h-touch-target-min bg-primary-container text-on-primary rounded-lg font-label-bold text-label-bold shadow-md hover:bg-primary transition-colors flex items-center justify-center gap-2 mt-stack-sm disabled:opacity-70">
            {loading ? 'Processing...' : 'Continue'}
            {!loading && <span className="material-symbols-outlined">arrow_forward</span>}
          </button>
        </form>
        
        {/* Divider */}
        <div className="flex items-center gap-4 my-stack-lg">
          <div className="h-px bg-outline-variant/50 flex-1"></div>
          <span className="font-caption text-caption text-on-surface-variant uppercase tracking-wider">Or continue with</span>
          <div className="h-px bg-outline-variant/50 flex-1"></div>
        </div>
        
        {/* Social Logins */}
        <div className="flex flex-col gap-stack-sm">
          <button type="button" className="w-full h-touch-target-min bg-on-surface text-surface rounded-lg font-label-bold text-label-bold shadow-sm hover:opacity-90 transition-opacity flex items-center justify-center gap-3">
            <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.62-1.496 3.603-2.947 1.156-1.689 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.533 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.68.727-1.303 2.145-1.107 3.531 1.353.104 2.548-.507 3.394-1.519z"></path>
            </svg>
            Continue with Apple
          </button>
          <button type="button" className="w-full h-touch-target-min bg-surface-container-lowest border border-outline-variant/50 text-on-surface rounded-lg font-label-bold text-label-bold shadow-sm hover:bg-surface-container transition-colors flex items-center justify-center gap-3">
            <svg className="w-5 h-5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"></path>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"></path>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"></path>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"></path>
            </svg>
            Continue with Google
          </button>
        </div>
        
        <p className="mt-stack-lg text-center font-caption text-caption text-on-surface-variant">
          By continuing, you agree to Travo's <br/>
          <a href="#" className="text-primary hover:underline">Terms of Service</a> and <a href="#" className="text-primary hover:underline">Privacy Policy</a>.
        </p>
      </div>
    </div>
  );
}
