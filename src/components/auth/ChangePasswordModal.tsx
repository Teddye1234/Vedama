import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../../stores/authStore';
import { useToastStore } from '../ui/Toast';
import Modal from '../ui/Modal';
import { Lock, Shield, AlertCircle, ArrowRight } from 'lucide-react';

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ChangePasswordModal({ isOpen, onClose }: ChangePasswordModalProps) {
  const { user, requestOtp, verifyAndChangePassword } = useAuthStore();
  const { addToast } = useToastStore();

  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [resendTimer, setResendTimer] = useState(0);

  // Auto-request OTP when modal opens
  useEffect(() => {
    if (isOpen && user?.email) {
      setError('');
      setOtp('');
      setNewPassword('');
      setConfirmPassword('');
      handleSendOtp();
    }
  }, [isOpen, user]);

  // Resend OTP countdown
  useEffect(() => {
    let interval: any;
    if (resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [resendTimer]);

  const handleSendOtp = async () => {
    if (!user?.email) return;
    setIsLoading(true);
    setError('');
    
    const result = await requestOtp(user.email, user.phone, 'change');
    if (result.success) {
      setResendTimer(60);
      addToast('OTP verification code sent to your active email/phone.', 'info');
    } else {
      setError(result.error || 'Failed to dispatch verification OTP.');
    }
    setIsLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (otp.length !== 6) {
      setError('Please enter a valid 6-digit OTP code.');
      return;
    }
    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setIsLoading(true);
    if (user?.email) {
      const result = await verifyAndChangePassword(user.email, otp, newPassword);
      if (result.success) {
        addToast('Password updated successfully!', 'success');
        onClose();
      } else {
        setError(result.error || 'Failed to verify OTP code.');
      }
    }
    setIsLoading(false);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Change Password" size="sm">
      <form onSubmit={handleSubmit} className="space-y-5">
        <p className="text-xs text-text-secondary leading-relaxed bg-surface-bg p-3.5 rounded-2xl border border-surface-border">
          We have automatically dispatched a 6-digit verification code to your registered details (<span className="font-semibold text-text-primary">{user?.email}</span>) to verify this operation.
        </p>

        {error && (
          <div className="bg-status-danger-bg border border-status-danger/25 text-status-danger px-4 py-3 rounded-2xl flex items-center text-xs font-semibold">
            <AlertCircle size={16} className="mr-2.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="label text-xs font-bold uppercase tracking-wider text-text-muted mb-1 flex items-center gap-1.5"><Shield size={14} /> Verification Code (OTP)</label>
            <input
              type="text"
              maxLength={6}
              required
              className="w-full text-center text-2xl tracking-[0.5em] font-mono font-bold bg-surface-bg border border-surface-border focus:border-vedama-emerald focus:ring-4 focus:ring-vedama-emerald/10 outline-none rounded-xl py-2.5 transition-all"
              placeholder="000000"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
            />
          </div>

          <div>
            <label className="label text-xs font-bold uppercase tracking-wider text-text-muted mb-1 flex items-center gap-1.5"><Lock size={14} /> New Password</label>
            <input
              type="password"
              required
              placeholder="Minimum 6 characters"
              className="input-field"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
          </div>

          <div>
            <label className="label text-xs font-bold uppercase tracking-wider text-text-muted mb-1 flex items-center gap-1.5"><Lock size={14} /> Confirm New Password</label>
            <input
              type="password"
              required
              placeholder="Repeat new password"
              className="input-field"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full btn-emerald py-3.5 text-sm font-bold flex items-center justify-center gap-2 cursor-pointer shadow-md"
        >
          {isLoading ? 'Updating...' : 'Update Password'}
          {!isLoading && <ArrowRight size={16} />}
        </button>

        <div className="text-center pt-2">
          <button
            type="button"
            onClick={handleSendOtp}
            disabled={resendTimer > 0 || isLoading}
            className={`text-xs font-semibold cursor-pointer transition-colors ${resendTimer > 0 ? 'text-text-muted cursor-not-allowed' : 'text-vedama-emerald hover:text-vedama-emerald-light'}`}
          >
            {resendTimer > 0 ? `Resend Code in ${resendTimer}s` : 'Resend Verification Code'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
