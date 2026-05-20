import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Shield, ArrowRight, AlertCircle, ArrowLeft, Mail, Phone, Lock, User } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { useToastStore } from '../components/ui/Toast';
import Logo from '../components/ui/Logo';

type Mode = 'signin' | 'signup' | 'forgot';

export default function LoginPage() {
  const navigate = useNavigate();
  const { addToast } = useToastStore();
  
  // Auth state methods
  const { login, requestOtp, verifyAndSignUp, verifyAndResetPassword, isAuthenticated, user } = useAuthStore();

  // Core state
  const [mode, setMode] = useState<Mode>('signin');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Sign In inputs
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Sign Up inputs
  const [signupName, setSignupName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPhone, setSignupPhone] = useState('');
  const [signupPassword, setSignupPassword] = useState('');

  // Forgot Password / Reset inputs
  const [resetEmail, setResetEmail] = useState('');
  const [resetPassword, setResetPassword] = useState('');

  // OTP Verification state
  const [isOtpVerifying, setIsOtpVerifying] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [otpPurpose, setOtpPurpose] = useState<'signup' | 'reset' | 'change'>('signup');
  const [resendTimer, setResendTimer] = useState(0);

  // If already logged in, redirect to correct portal
  useEffect(() => {
    if (isAuthenticated && user) {
      if (user.role === 'client') navigate('/client');
      else if (user.role === 'landlord') navigate('/landlord');
      else navigate('/dashboard');
    }
  }, [isAuthenticated, user, navigate]);

  // Resend OTP timer countdown
  useEffect(() => {
    let interval: any;
    if (resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [resendTimer]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    const result = await login(email, password);
    if (result.success) {
      addToast('Logged in successfully', 'success');
      const currentUser = useAuthStore.getState().user;
      if (currentUser?.role === 'client') navigate('/client');
      else if (currentUser?.role === 'landlord') navigate('/landlord');
      else navigate('/dashboard');
    } else {
      setError(result.error || 'Login failed');
      setIsLoading(false);
    }
  };

  const handleRequestSignupOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    if (!signupName || !signupEmail || !signupPhone || !signupPassword) {
      setError('All fields are required.');
      setIsLoading(false);
      return;
    }

    const result = await requestOtp(signupEmail, signupPhone, 'signup');
    if (result.success) {
      setOtpPurpose('signup');
      setIsOtpVerifying(true);
      setIsLoading(false);
      setResendTimer(60);
      addToast('OTP verification code sent to your details.', 'info');
    } else {
      setError(result.error || 'Failed to dispatch OTP verification code.');
      setIsLoading(false);
    }
  };

  const handleRequestResetOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    if (!resetEmail || !resetPassword) {
      setError('Email and new password are required.');
      setIsLoading(false);
      return;
    }

    const result = await requestOtp(resetEmail, undefined, 'reset');
    if (result.success) {
      setOtpPurpose('reset');
      setIsOtpVerifying(true);
      setIsLoading(false);
      setResendTimer(60);
      addToast('Password reset code sent to your email.', 'info');
    } else {
      setError(result.error || 'Failed to dispatch OTP verification code.');
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    if (otpCode.length !== 6) {
      setError('Please enter a valid 6-digit verification code.');
      setIsLoading(false);
      return;
    }

    if (otpPurpose === 'signup') {
      const result = await verifyAndSignUp(signupName, signupEmail, signupPhone, signupPassword, otpCode);
      if (result.success) {
        addToast('Account created and verified successfully!', 'success');
        navigate('/client');
      } else {
        setError(result.error || 'OTP verification failed.');
        setIsLoading(false);
      }
    } else if (otpPurpose === 'reset') {
      const result = await verifyAndResetPassword(resetEmail, otpCode, resetPassword);
      if (result.success) {
        addToast('Password reset successfully! Please sign in.', 'success');
        setIsOtpVerifying(false);
        setMode('signin');
        setIsLoading(false);
      } else {
        setError(result.error || 'OTP verification failed.');
        setIsLoading(false);
      }
    }
  };

  const handleResendOtp = async () => {
    if (resendTimer > 0) return;
    setError('');
    setIsLoading(true);

    const targetEmail = otpPurpose === 'signup' ? signupEmail : resetEmail;
    const targetPhone = otpPurpose === 'signup' ? signupPhone : undefined;

    const result = await requestOtp(targetEmail, targetPhone, otpPurpose);
    if (result.success) {
      setResendTimer(60);
      addToast('Verification code resent successfully.', 'info');
    } else {
      setError(result.error || 'Resend failed.');
    }
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-bg py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Curved Emerald Decorative Header Backdrop */}
      <div className="absolute top-0 left-0 w-full h-[55%] bg-gradient-to-br from-vedama-emerald to-vedama-emerald-light rounded-b-[4.5rem] z-0 shadow-lg transition-all duration-700"></div>

      <div className="max-w-md w-full space-y-6 bg-white/95 backdrop-blur-md p-8 sm:p-10 rounded-3xl shadow-card-lg border border-white/40 relative z-10 animate-scale-in transition-all duration-300">
        <div className="flex flex-col items-center text-center">
          <Link to="/" className="mb-4 hover:scale-105 transition-transform">
            <Logo size="lg" />
          </Link>
          <h2 className="text-2xl sm:text-3xl font-heading font-extrabold text-text-primary tracking-tight">
            {isOtpVerifying ? 'Security Verification' : mode === 'signin' ? 'Welcome Back' : mode === 'signup' ? 'Join as Client' : 'Recover Password'}
          </h2>
          <p className="mt-2 text-sm text-text-secondary">
            {isOtpVerifying 
              ? `Enter the 6-digit OTP code dispatched to confirm request.`
              : mode === 'signin'
                ? 'Sign in to access your secure Vedama portfolio portal.'
                : mode === 'signup'
                  ? 'Verify your phone & email with active OTP codes for security.'
                  : 'We will dispatch an OTP to verify your account recovery.'
            }
          </p>
        </div>

        {error && (
          <div className="bg-status-danger-bg border border-status-danger/20 text-status-danger px-4 py-3.5 rounded-2xl flex items-center text-sm font-semibold animate-shake">
            <AlertCircle size={18} className="mr-2.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* OTP VERIFICATION VIEW */}
        {isOtpVerifying ? (
          <form className="mt-6 space-y-6" onSubmit={handleVerifyOtp}>
            <div className="space-y-4">
              <div>
                <label htmlFor="otpCode" className="label text-center block mb-2 text-xs font-bold tracking-wider uppercase text-text-muted">6-Digit Verification Code</label>
                <input
                  id="otpCode"
                  type="text"
                  maxLength={6}
                  required
                  autoFocus
                  className="w-full text-center text-3xl tracking-[0.6em] font-mono font-bold bg-surface-bg border border-surface-border focus:border-vedama-emerald focus:ring-4 focus:ring-vedama-emerald/10 outline-none rounded-2xl py-4 transition-all"
                  placeholder="000000"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading || otpCode.length !== 6}
              className="w-full flex justify-center items-center py-4 px-4 border border-transparent rounded-2xl text-sm font-bold text-white bg-vedama-emerald hover:bg-vedama-emerald-light focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-vedama-emerald transition-all shadow-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Verifying...' : 'Verify & Continue'}
              {!isLoading && <ArrowRight size={18} className="ml-2" />}
            </button>

            <div className="flex flex-col items-center gap-3 text-xs border-t border-surface-border pt-4">
              <button
                type="button"
                onClick={handleResendOtp}
                disabled={resendTimer > 0 || isLoading}
                className={`font-semibold cursor-pointer transition-colors ${resendTimer > 0 ? 'text-text-muted cursor-not-allowed' : 'text-vedama-emerald hover:text-vedama-emerald-light'}`}
              >
                {resendTimer > 0 ? `Resend Code in ${resendTimer}s` : 'Resend Verification Code'}
              </button>
              
              <button
                type="button"
                onClick={() => {
                  setIsOtpVerifying(false);
                  setError('');
                }}
                className="flex items-center gap-1.5 font-bold text-text-secondary hover:text-text-primary transition-colors cursor-pointer"
              >
                <ArrowLeft size={14} /> Back to forms
              </button>
            </div>
          </form>
        ) : (
          /* STANDARD FORMS VIEW */
          <div className="mt-4">
            {/* Elegant Tab Switcher for Sign In / Sign Up */}
            {mode !== 'forgot' && (
              <div className="bg-surface-bg p-1.5 rounded-2xl flex items-center mb-6 border border-surface-border">
                <button
                  type="button"
                  onClick={() => {
                    setMode('signin');
                    setError('');
                  }}
                  className={`flex-1 text-center py-3 text-sm font-bold rounded-xl transition-all ${mode === 'signin' ? 'bg-white text-vedama-emerald shadow-card' : 'text-text-secondary hover:text-text-primary'}`}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMode('signup');
                    setError('');
                  }}
                  className={`flex-1 text-center py-3 text-sm font-bold rounded-xl transition-all ${mode === 'signup' ? 'bg-white text-vedama-emerald shadow-card' : 'text-text-secondary hover:text-text-primary'}`}
                >
                  Sign Up
                </button>
              </div>
            )}

            {/* A. SIGN IN FORM */}
            {mode === 'signin' && (
              <form className="space-y-5" onSubmit={handleSignIn}>
                <div className="space-y-4">
                  <div className="relative">
                    <label htmlFor="email" className="label flex items-center gap-1.5"><Mail size={14} className="text-text-muted" /> Email Address</label>
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
                      <label htmlFor="password" className="label !mb-0 flex items-center gap-1.5"><Lock size={14} className="text-text-muted" /> Password</label>
                      <button
                        type="button"
                        onClick={() => {
                          setMode('forgot');
                          setError('');
                        }}
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
                  className="w-full flex justify-center items-center py-3.5 px-4 border border-transparent rounded-2xl text-sm font-bold text-white bg-vedama-emerald hover:bg-vedama-emerald-light focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-vedama-emerald transition-all shadow-sm cursor-pointer disabled:opacity-75"
                >
                  {isLoading ? 'Authenticating...' : 'Sign In'}
                  {!isLoading && <ArrowRight size={18} className="ml-2 animate-pulse" />}
                </button>
              </form>
            )}

            {/* B. CLIENT SIGN UP FORM */}
            {mode === 'signup' && (
              <form className="space-y-4" onSubmit={handleRequestSignupOtp}>
                <div className="space-y-3.5">
                  <div>
                    <label htmlFor="signupName" className="label flex items-center gap-1.5"><User size={14} className="text-text-muted" /> Full Name</label>
                    <input
                      id="signupName"
                      type="text"
                      required
                      className="input-field"
                      placeholder="James Mwangi"
                      value={signupName}
                      onChange={(e) => setSignupName(e.target.value)}
                    />
                  </div>
                  <div>
                    <label htmlFor="signupEmail" className="label flex items-center gap-1.5"><Mail size={14} className="text-text-muted" /> Email Address</label>
                    <input
                      id="signupEmail"
                      type="email"
                      required
                      className="input-field"
                      placeholder="client@vedama.co.ke"
                      value={signupEmail}
                      onChange={(e) => setSignupEmail(e.target.value)}
                    />
                  </div>
                  <div>
                    <label htmlFor="signupPhone" className="label flex items-center gap-1.5"><Phone size={14} className="text-text-muted" /> Phone Number (For OTP)</label>
                    <input
                      id="signupPhone"
                      type="tel"
                      required
                      className="input-field"
                      placeholder="e.g. +254712345678"
                      value={signupPhone}
                      onChange={(e) => setSignupPhone(e.target.value)}
                    />
                  </div>
                  <div>
                    <label htmlFor="signupPassword" className="label flex items-center gap-1.5"><Lock size={14} className="text-text-muted" /> Secure Password</label>
                    <input
                      id="signupPassword"
                      type="password"
                      required
                      className="input-field"
                      placeholder="Minimum 6 characters"
                      value={signupPassword}
                      onChange={(e) => setSignupPassword(e.target.value)}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full flex justify-center items-center py-3.5 px-4 mt-2 border border-transparent rounded-2xl text-sm font-bold text-white bg-vedama-emerald hover:bg-vedama-emerald-light focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-vedama-emerald transition-all shadow-sm cursor-pointer disabled:opacity-75"
                >
                  {isLoading ? 'Requesting OTP...' : 'Send OTP & Register'}
                  {!isLoading && <Shield size={18} className="ml-2 animate-pulse" />}
                </button>
              </form>
            )}

            {/* C. FORGOT PASSWORD RECOVERY FORM */}
            {mode === 'forgot' && (
              <form className="space-y-4" onSubmit={handleRequestResetOtp}>
                <div className="space-y-3.5">
                  <div>
                    <label htmlFor="resetEmail" className="label flex items-center gap-1.5"><Mail size={14} className="text-text-muted" /> Registered Email Address</label>
                    <input
                      id="resetEmail"
                      type="email"
                      required
                      className="input-field"
                      placeholder="Enter your registered email"
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                    />
                  </div>
                  <div>
                    <label htmlFor="resetPassword" className="label flex items-center gap-1.5"><Lock size={14} className="text-text-muted" /> New Password</label>
                    <input
                      id="resetPassword"
                      type="password"
                      required
                      className="input-field"
                      placeholder="••••••••"
                      value={resetPassword}
                      onChange={(e) => setResetPassword(e.target.value)}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full flex justify-center items-center py-3.5 px-4 mt-2 border border-transparent rounded-2xl text-sm font-bold text-white bg-vedama-emerald hover:bg-vedama-emerald-light focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-vedama-emerald transition-all shadow-sm cursor-pointer disabled:opacity-75"
                >
                  {isLoading ? 'Requesting OTP...' : 'Send Recovery Code'}
                  {!isLoading && <Shield size={18} className="ml-2" />}
                </button>

                <div className="text-center pt-3">
                  <button
                    type="button"
                    onClick={() => {
                      setMode('signin');
                      setError('');
                    }}
                    className="flex items-center gap-1.5 text-xs font-bold text-text-secondary hover:text-text-primary transition-colors cursor-pointer mx-auto"
                  >
                    <ArrowLeft size={14} /> Back to Sign In
                  </button>
                </div>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
