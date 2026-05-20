import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Shield, ArrowRight, AlertCircle } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import Logo from '../components/ui/Logo';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showForgotAlert, setShowForgotAlert] = useState(false);
  const navigate = useNavigate();
  const login = useAuthStore((s) => s.login);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const user = useAuthStore((s) => s.user);

  // If already logged in, automatically redirect to correct portal
  useEffect(() => {
    if (isAuthenticated && user) {
      if (user.role === 'client') navigate('/client');
      else if (user.role === 'landlord') navigate('/landlord');
      else navigate('/dashboard');
    }
  }, [isAuthenticated, user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    // Simulate network delay
    await new Promise(r => setTimeout(r, 800));

    const result = await login(email, password);
    if (result.success) {
      const role = useAuthStore.getState().user?.role;
      if (role === 'client') navigate('/client');
      else if (role === 'landlord') navigate('/landlord');
      else navigate('/dashboard');
    } else {
      setError(result.error || 'Login failed');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-bg py-12 px-4 sm:px-6 lg:px-8 relative">
      {/* Background decoration */}
      <div className="absolute top-0 left-0 w-full h-1/2 bg-vedama-emerald rounded-b-[4rem] z-0"></div>

      <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-2xl shadow-card-lg relative z-10 animate-scale-in">
        <div className="flex flex-col items-center text-center">
          <Link to="/" className="mb-6">
            <Logo size="lg" />
          </Link>
          <h2 className="mt-2 text-3xl font-heading font-bold text-text-primary">
            Welcome Back
          </h2>
          <p className="mt-2 text-sm text-text-secondary">
            Sign in to access your Vedama portal
          </p>
        </div>

        {error && (
          <div className="bg-status-danger-bg border border-status-danger/30 text-status-danger px-4 py-3 rounded-lg flex items-center text-sm font-medium">
            <AlertCircle size={18} className="mr-2 shrink-0" />
            {error}
          </div>
        )}

        {showForgotAlert && (
          <div className="bg-status-warning-bg border border-status-warning/30 text-status-warning px-4 py-3 rounded-lg relative animate-scale-in">
            <button
              type="button"
              onClick={() => setShowForgotAlert(false)}
              className="absolute top-2 right-2.5 text-status-warning hover:opacity-85 transition-opacity font-bold text-xs"
            >
              ✕
            </button>
            <div className="flex items-start">
              <AlertCircle size={18} className="mr-2 shrink-0 mt-0.5" />
              <div>
                <div className="font-bold text-sm">Forgot Password?</div>
                <div className="mt-1 text-xs font-normal text-text-secondary leading-relaxed">
                  Password recovery is managed by the system administration team. Please contact <strong className="font-semibold text-text-primary">admin@vedama.co.ke</strong> to request a password reset.
                </div>
              </div>
            </div>
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="label">Email Address</label>
              <input
                id="email"
                type="email"
                required
                className="input-field"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="password" className="label !mb-0">Password</label>
                <button
                  type="button"
                  onClick={() => setShowForgotAlert(true)}
                  className="text-xs font-semibold text-vedama-gold hover:text-vedama-gold-dark transition-colors cursor-pointer"
                >
                  Forgot password?
                </button>
              </div>
              <input
                id="password"
                type="password"
                required
                className="input-field"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex justify-center items-center py-3.5 px-4 border border-transparent rounded-button text-sm font-semibold text-white bg-vedama-emerald hover:bg-vedama-emerald-light focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-vedama-emerald transition-colors disabled:opacity-70"
          >
            {isLoading ? 'Authenticating...' : 'Sign In'}
            {!isLoading && <ArrowRight size={18} className="ml-2" />}
          </button>
        </form>
      </div>
    </div>
  );
}
