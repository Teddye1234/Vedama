import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Shield, ArrowRight, AlertCircle, ArrowLeft, Mail, Phone, Lock, User, Eye, EyeOff, CheckCircle } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { useToastStore } from '../components/ui/Toast';
import Logo from '../components/ui/Logo';

type Mode = 'signin' | 'signup' | 'forgot';

export default function LoginPage() {
  const navigate = useNavigate();
  const { addToast } = useToastStore();
  const { login, requestOtp, verifyAndSignUp, verifyAndResetPassword, isAuthenticated, user } = useAuthStore();

  // Main mode
  const [mode, setMode] = useState<Mode>('signin');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Sign In fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showSigninPwd, setShowSigninPwd] = useState(false);

  // Sign Up fields
  const [signupName, setSignupName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPhone, setSignupPhone] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupConfirm, setSignupConfirm] = useState('');
  const [showSignupPwd, setShowSignupPwd] = useState(false);
  const [showSignupConfirm, setShowSignupConfirm] = useState(false);

  // Forgot / Reset fields
  const [resetEmail, setResetEmail] = useState('');
  const [resetPassword, setResetPassword] = useState('');
  const [resetConfirm, setResetConfirm] = useState('');
  const [showResetPwd, setShowResetPwd] = useState(false);

  // OTP flow
  const [isOtpStep, setIsOtpStep] = useState(false);
  const [otpPurpose, setOtpPurpose] = useState<'signup' | 'reset'>('signup');
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const [sandboxOtp, setSandboxOtp] = useState<string | null>(null);
  const [resendTimer, setResendTimer] = useState(0);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Redirect if already logged in
  useEffect(() => {
    if (isAuthenticated && user) {
      if (user.role === 'client') navigate('/client');
      else if (user.role === 'landlord') navigate('/landlord');
      else navigate('/dashboard');
    }
  }, [isAuthenticated, user, navigate]);

  // Resend countdown
  useEffect(() => {
    if (resendTimer <= 0) return;
    const t = setInterval(() => setResendTimer(p => p - 1), 1000);
    return () => clearInterval(t);
  }, [resendTimer]);

  const otpCode = otpDigits.join('');

  // Handle OTP digit input
  const handleOtpChange = (idx: number, val: string) => {
    const digit = val.replace(/\D/g, '').slice(-1);
    const next = [...otpDigits];
    next[idx] = digit;
    setOtpDigits(next);
    if (digit && idx < 5) otpRefs.current[idx + 1]?.focus();
  };

  const handleOtpKeyDown = (idx: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otpDigits[idx] && idx > 0) {
      otpRefs.current[idx - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length === 6) {
      setOtpDigits(pasted.split(''));
      otpRefs.current[5]?.focus();
    }
    e.preventDefault();
  };

  // ── Sign In ──
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    const result = await login(email, password);
    if (result.success) {
      addToast('Welcome back! Redirecting...', 'success');
      const u = useAuthStore.getState().user;
      if (u?.role === 'client') navigate('/client');
      else if (u?.role === 'landlord') navigate('/landlord');
      else navigate('/dashboard');
    } else {
      setError(result.error || 'Invalid credentials. Please try again.');
    }
    setIsLoading(false);
  };

  // ── Sign Up: Step 1 — request OTP ──
  const handleRequestSignupOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!signupName.trim()) { setError('Please enter your full name.'); return; }
    if (!signupEmail.trim()) { setError('Please enter your email address.'); return; }
    if (!signupPhone.trim()) { setError('Please enter your phone number.'); return; }
    if (signupPassword.length < 6) { setError('Password must be at least 6 characters.'); return; }
    if (signupPassword !== signupConfirm) { setError('Passwords do not match.'); return; }

    setIsLoading(true);
    const result = await requestOtp(signupEmail, signupPhone, 'signup');
    if (result.success) {
      setOtpPurpose('signup');
      if (result.simulatedOtp) {
        setOtpDigits(result.simulatedOtp.split(''));
        setSandboxOtp(result.simulatedOtp);
        setIsOtpStep(true);
        setResendTimer(60);
        setTimeout(() => otpRefs.current[5]?.focus(), 100);
        addToast(`[Sandbox Mode] OTP code auto-filled: ${result.simulatedOtp}`, 'info');
      } else {
        setOtpDigits(['', '', '', '', '', '']);
        setSandboxOtp(null);
        setIsOtpStep(true);
        setResendTimer(60);
        setTimeout(() => otpRefs.current[0]?.focus(), 100);
        addToast('OTP code sent! Check your phone/email.', 'success');
      }
    } else {
      setError(result.error || 'Failed to send OTP. Please try again.');
    }
    setIsLoading(false);
  };

  // ── Forgot Password: Step 1 — request OTP ──
  const handleRequestResetOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!resetEmail.trim()) { setError('Please enter your registered email.'); return; }
    if (resetPassword.length < 6) { setError('New password must be at least 6 characters.'); return; }
    if (resetPassword !== resetConfirm) { setError('Passwords do not match.'); return; }

    setIsLoading(true);
    const result = await requestOtp(resetEmail, undefined, 'reset');
    if (result.success) {
      setOtpPurpose('reset');
      if (result.simulatedOtp) {
        setOtpDigits(result.simulatedOtp.split(''));
        setSandboxOtp(result.simulatedOtp);
        setIsOtpStep(true);
        setResendTimer(60);
        setTimeout(() => otpRefs.current[5]?.focus(), 100);
        addToast(`[Sandbox Mode] OTP code auto-filled: ${result.simulatedOtp}`, 'info');
      } else {
        setOtpDigits(['', '', '', '', '', '']);
        setSandboxOtp(null);
        setIsOtpStep(true);
        setResendTimer(60);
        setTimeout(() => otpRefs.current[0]?.focus(), 100);
        addToast('Recovery code sent to your email!', 'success');
      }
    } else {
      setError(result.error || 'No account found with this email.');
    }
    setIsLoading(false);
  };

  // ── OTP Step 2 — verify ──
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (otpCode.length !== 6) { setError('Please enter all 6 digits of the OTP code.'); return; }

    setIsLoading(true);
    if (otpPurpose === 'signup') {
      const result = await verifyAndSignUp(signupName, signupEmail, signupPhone, signupPassword, otpCode);
      if (result.success) {
        addToast('Account created! Welcome to Vedama! 🎉', 'success');
        navigate('/client');
      } else {
        setError(result.error || 'OTP verification failed. Check the code and try again.');
        setIsLoading(false);
      }
    } else {
      const result = await verifyAndResetPassword(resetEmail, otpCode, resetPassword);
      if (result.success) {
        addToast('Password reset! You can now sign in.', 'success');
        setIsOtpStep(false);
        setMode('signin');
        setIsLoading(false);
      } else {
        setError(result.error || 'OTP verification failed. Check the code and try again.');
        setIsLoading(false);
      }
    }
  };

  // ── Resend OTP ──
  const handleResend = async () => {
    if (resendTimer > 0) return;
    setError('');
    setIsLoading(true);
    const targetEmail = otpPurpose === 'signup' ? signupEmail : resetEmail;
    const targetPhone = otpPurpose === 'signup' ? signupPhone : undefined;
    const result = await requestOtp(targetEmail, targetPhone, otpPurpose);
    if (result.success) {
      if (result.simulatedOtp) {
        setOtpDigits(result.simulatedOtp.split(''));
        setSandboxOtp(result.simulatedOtp);
        setResendTimer(60);
        addToast(`[Sandbox Mode] OTP code auto-filled: ${result.simulatedOtp}`, 'info');
      } else {
        setOtpDigits(['', '', '', '', '', '']);
        setSandboxOtp(null);
        setResendTimer(60);
        addToast('New OTP code sent!', 'info');
      }
    } else {
      setError(result.error || 'Resend failed. Try again shortly.');
    }
    setIsLoading(false);
  };

  const switchMode = (m: Mode) => { setMode(m); setError(''); setIsOtpStep(false); setSandboxOtp(null); };

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-bg py-10 px-4 relative overflow-hidden">
      {/* Background gradient header */}
      <div className="absolute top-0 left-0 w-full h-[50%] bg-gradient-to-br from-vedama-emerald to-vedama-emerald-light rounded-b-[5rem] z-0 shadow-xl" />

      <div className="max-w-md w-full bg-white/97 backdrop-blur-md p-8 sm:p-10 rounded-3xl shadow-card-lg border border-white/50 relative z-10 animate-scale-in">

        {/* Logo + Heading */}
        <div className="flex flex-col items-center text-center mb-6">
          <Link to="/" className="mb-4 hover:scale-105 transition-transform">
            <Logo size="lg" />
          </Link>
          <h1 className="text-2xl sm:text-3xl font-heading font-extrabold text-text-primary tracking-tight">
            {isOtpStep
              ? '🔐 Enter Verification Code'
              : mode === 'signin' ? 'Welcome Back'
              : mode === 'signup' ? 'Create Client Account'
              : 'Reset Your Password'}
          </h1>
          <p className="mt-2 text-sm text-text-secondary max-w-xs">
            {isOtpStep
              ? `A 6-digit code was sent to ${otpPurpose === 'signup' ? signupPhone || signupEmail : resetEmail}. Enter it below.`
              : mode === 'signin' ? 'Sign in to your secure Vedama portal.'
              : mode === 'signup' ? 'Register as a client. We verify your identity via OTP.'
              : 'Enter your email and new password, then verify via OTP.'}
          </p>
        </div>

        {/* Error banner */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-2xl flex items-start gap-2.5 text-sm font-medium mb-5 animate-shake">
            <AlertCircle size={17} className="shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* ═══ OTP VERIFICATION STEP ═══ */}
        {isOtpStep ? (
          <form onSubmit={handleVerifyOtp} className="space-y-6">

            <div>
              <label className="block text-center text-xs font-bold uppercase tracking-widest text-text-muted mb-4">
                6-Digit Verification Code
              </label>

              {/* Individual digit boxes */}
              <div className="flex justify-center gap-3" onPaste={handleOtpPaste}>
                {otpDigits.map((digit, idx) => (
                  <input
                    key={idx}
                    ref={el => { otpRefs.current[idx] = el; }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={e => handleOtpChange(idx, e.target.value)}
                    onKeyDown={e => handleOtpKeyDown(idx, e)}
                    className={`w-12 h-14 text-center text-2xl font-mono font-bold border-2 rounded-xl outline-none transition-all
                      ${digit ? 'border-vedama-emerald bg-vedama-emerald/5 text-vedama-emerald' : 'border-surface-border bg-surface-bg text-text-primary'}
                      focus:border-vedama-emerald focus:ring-4 focus:ring-vedama-emerald/10`}
                  />
                ))}
              </div>

              {otpCode.length === 6 && (
                <div className="flex items-center justify-center gap-1.5 mt-3 text-xs text-status-success font-semibold">
                  <CheckCircle size={13} /> Code complete — ready to verify
                </div>
              )}

              {sandboxOtp && (
                <div className="mt-5 bg-blue-50 border border-blue-150 p-4 rounded-2xl flex flex-col items-center gap-1 text-center animate-pulse shadow-sm">
                  <span className="text-[9px] font-extrabold text-blue-600 uppercase tracking-widest">Sandbox Mode Active</span>
                  <p className="text-[10px] text-blue-800 leading-normal">
                    No SMS/Email credentials configured. Enter simulated code:
                  </p>
                  <div className="font-mono text-lg font-black text-blue-700 bg-blue-100/60 px-4 py-1.5 rounded-xl tracking-[0.2em] border border-blue-200 mt-1">
                    {sandboxOtp}
                  </div>
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading || otpCode.length !== 6}
              className="w-full flex justify-center items-center py-4 px-4 rounded-2xl text-sm font-bold text-white bg-vedama-emerald hover:bg-vedama-emerald-light transition-all shadow-md cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed gap-2"
            >
              {isLoading ? 'Verifying...' : `Verify & ${otpPurpose === 'signup' ? 'Create Account' : 'Reset Password'}`}
              {!isLoading && <ArrowRight size={17} />}
            </button>

            <div className="flex flex-col items-center gap-3 text-xs border-t border-surface-border pt-4">
              <button
                type="button"
                onClick={handleResend}
                disabled={resendTimer > 0 || isLoading}
                className={`font-semibold transition-colors cursor-pointer ${resendTimer > 0 ? 'text-text-muted cursor-not-allowed' : 'text-vedama-emerald hover:underline'}`}
              >
                {resendTimer > 0 ? `Resend code in ${resendTimer}s` : '↻ Resend OTP Code'}
              </button>
              <button
                type="button"
                onClick={() => { setIsOtpStep(false); setError(''); }}
                className="flex items-center gap-1 font-bold text-text-secondary hover:text-text-primary transition-colors cursor-pointer"
              >
                <ArrowLeft size={13} /> Go Back
              </button>
            </div>
          </form>

        ) : (
          /* ═══ STANDARD FORMS ═══ */
          <div>
            {/* Sign In / Sign Up tab switcher */}
            {mode !== 'forgot' && (
              <div className="bg-surface-bg p-1.5 rounded-2xl flex items-center mb-6 border border-surface-border">
                <button
                  type="button"
                  onClick={() => switchMode('signin')}
                  className={`flex-1 text-center py-3 text-sm font-bold rounded-xl transition-all ${mode === 'signin' ? 'bg-white text-vedama-emerald shadow-card' : 'text-text-secondary hover:text-text-primary'}`}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => switchMode('signup')}
                  className={`flex-1 text-center py-3 text-sm font-bold rounded-xl transition-all ${mode === 'signup' ? 'bg-white text-vedama-emerald shadow-card' : 'text-text-secondary hover:text-text-primary'}`}
                >
                  Sign Up as Client
                </button>
              </div>
            )}

            {/* ── A. SIGN IN ── */}
            {mode === 'signin' && (
              <form className="space-y-5" onSubmit={handleSignIn}>
                <div>
                  <label htmlFor="signin-email" className="label flex items-center gap-1.5"><Mail size={14} className="text-text-muted" /> Email Address</label>
                  <input id="signin-email" type="email" required className="input-field" placeholder="Enter your email" value={email} onChange={e => setEmail(e.target.value)} />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label htmlFor="signin-pwd" className="label !mb-0 flex items-center gap-1.5"><Lock size={14} className="text-text-muted" /> Password</label>
                    <button type="button" onClick={() => switchMode('forgot')} className="text-xs font-semibold text-vedama-gold hover:text-vedama-gold-dark transition-colors cursor-pointer">
                      Forgot password?
                    </button>
                  </div>
                  <div className="relative">
                    <input id="signin-pwd" type={showSigninPwd ? 'text' : 'password'} required className="input-field pr-10" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} />
                    <button type="button" onClick={() => setShowSigninPwd(p => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary cursor-pointer">
                      {showSigninPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
                <button type="submit" disabled={isLoading} className="w-full flex justify-center items-center py-4 px-4 rounded-2xl text-sm font-bold text-white bg-vedama-emerald hover:bg-vedama-emerald-light transition-all shadow-md cursor-pointer disabled:opacity-75 gap-2">
                  {isLoading ? 'Signing in...' : 'Sign In'}
                  {!isLoading && <ArrowRight size={17} className="animate-pulse" />}
                </button>
              </form>
            )}

            {/* ── B. SIGN UP (Client registration via OTP) ── */}
            {mode === 'signup' && (
              <form className="space-y-4" onSubmit={handleRequestSignupOtp}>
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-2xl flex gap-2 text-xs text-blue-800">
                  <Shield size={14} className="text-blue-500 shrink-0 mt-0.5" />
                  Fill your details below. We'll send a <strong>6-digit OTP</strong> to your phone number to verify your identity before creating the account.
                </div>

                <div>
                  <label htmlFor="su-name" className="label flex items-center gap-1.5"><User size={14} className="text-text-muted" /> Full Name</label>
                  <input id="su-name" type="text" required className="input-field" placeholder="e.g. James Mwangi" value={signupName} onChange={e => setSignupName(e.target.value)} />
                </div>
                <div>
                  <label htmlFor="su-email" className="label flex items-center gap-1.5"><Mail size={14} className="text-text-muted" /> Email Address</label>
                  <input id="su-email" type="email" required className="input-field" placeholder="your@email.com" value={signupEmail} onChange={e => setSignupEmail(e.target.value)} />
                </div>
                <div>
                  <label htmlFor="su-phone" className="label flex items-center gap-1.5"><Phone size={14} className="text-text-muted" /> Phone Number <span className="text-vedama-emerald font-bold">(OTP sent here)</span></label>
                  <input id="su-phone" type="tel" required className="input-field" placeholder="+254712345678" value={signupPhone} onChange={e => setSignupPhone(e.target.value)} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="su-pwd" className="label flex items-center gap-1.5"><Lock size={14} className="text-text-muted" /> Password</label>
                    <div className="relative">
                      <input id="su-pwd" type={showSignupPwd ? 'text' : 'password'} required className="input-field pr-9" placeholder="Min. 6 chars" value={signupPassword} onChange={e => setSignupPassword(e.target.value)} minLength={6} />
                      <button type="button" onClick={() => setShowSignupPwd(p => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted cursor-pointer"><Eye size={14} /></button>
                    </div>
                  </div>
                  <div>
                    <label htmlFor="su-confirm" className="label flex items-center gap-1.5"><Lock size={14} className="text-text-muted" /> Confirm</label>
                    <div className="relative">
                      <input id="su-confirm" type={showSignupConfirm ? 'text' : 'password'} required className="input-field pr-9" placeholder="Re-enter" value={signupConfirm} onChange={e => setSignupConfirm(e.target.value)} />
                      <button type="button" onClick={() => setShowSignupConfirm(p => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted cursor-pointer"><Eye size={14} /></button>
                    </div>
                    {signupPassword && signupConfirm && signupPassword !== signupConfirm && (
                      <p className="text-[10px] text-status-danger mt-1 font-semibold">Passwords don't match</p>
                    )}
                  </div>
                </div>

                <button type="submit" disabled={isLoading} className="w-full flex justify-center items-center py-4 px-4 mt-1 rounded-2xl text-sm font-bold text-white bg-vedama-emerald hover:bg-vedama-emerald-light transition-all shadow-md cursor-pointer disabled:opacity-75 gap-2">
                  {isLoading ? 'Sending OTP...' : 'Send OTP & Continue'}
                  {!isLoading && <Shield size={17} />}
                </button>
              </form>
            )}

            {/* ── C. FORGOT PASSWORD ── */}
            {mode === 'forgot' && (
              <form className="space-y-4" onSubmit={handleRequestResetOtp}>
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl flex gap-2 text-xs text-amber-800">
                  <Shield size={14} className="text-amber-500 shrink-0 mt-0.5" />
                  Enter your registered email and new password. We'll send an OTP to verify it's really you.
                </div>

                <div>
                  <label htmlFor="r-email" className="label flex items-center gap-1.5"><Mail size={14} className="text-text-muted" /> Registered Email</label>
                  <input id="r-email" type="email" required className="input-field" placeholder="Enter your account email" value={resetEmail} onChange={e => setResetEmail(e.target.value)} />
                </div>
                <div>
                  <label htmlFor="r-pwd" className="label flex items-center gap-1.5"><Lock size={14} className="text-text-muted" /> New Password</label>
                  <div className="relative">
                    <input id="r-pwd" type={showResetPwd ? 'text' : 'password'} required className="input-field pr-10" placeholder="Min. 6 characters" value={resetPassword} onChange={e => setResetPassword(e.target.value)} minLength={6} />
                    <button type="button" onClick={() => setShowResetPwd(p => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted cursor-pointer">{showResetPwd ? <EyeOff size={16} /> : <Eye size={16} />}</button>
                  </div>
                </div>
                <div>
                  <label htmlFor="r-confirm" className="label flex items-center gap-1.5"><Lock size={14} className="text-text-muted" /> Confirm New Password</label>
                  <input id="r-confirm" type="password" required className="input-field" placeholder="Repeat new password" value={resetConfirm} onChange={e => setResetConfirm(e.target.value)} />
                  {resetPassword && resetConfirm && resetPassword !== resetConfirm && (
                    <p className="text-xs text-status-danger mt-1 font-semibold">Passwords don't match</p>
                  )}
                </div>

                <button type="submit" disabled={isLoading} className="w-full flex justify-center items-center py-4 px-4 mt-1 rounded-2xl text-sm font-bold text-white bg-vedama-emerald hover:bg-vedama-emerald-light transition-all shadow-md cursor-pointer disabled:opacity-75 gap-2">
                  {isLoading ? 'Sending OTP...' : 'Send Recovery OTP'}
                  {!isLoading && <Shield size={17} />}
                </button>

                <div className="text-center pt-2">
                  <button type="button" onClick={() => switchMode('signin')} className="flex items-center gap-1.5 text-xs font-bold text-text-secondary hover:text-text-primary transition-colors cursor-pointer mx-auto">
                    <ArrowLeft size={13} /> Back to Sign In
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
