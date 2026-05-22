import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User } from '../types';
import api from '../lib/api';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  updateProfile: (updates: Partial<User>) => void;
  requestOtp: (email: string, phone: string | undefined, purpose: 'signup' | 'reset' | 'change') => Promise<{ success: boolean; error?: string; simulatedOtp?: string }>;
  verifyAndSignUp: (name: string, email: string, phone: string, password: string, otp: string) => Promise<{ success: boolean; error?: string }>;
  verifyAndResetPassword: (email: string, otp: string, newPassword: string) => Promise<{ success: boolean; error?: string }>;
  verifyAndChangePassword: (email: string, otp: string, newPassword: string) => Promise<{ success: boolean; error?: string }>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      login: async (email, password) => {
        try {
          const response = await api.post('/auth?action=login', { email, password });
          if (response.data.success) {
            set({ user: response.data.user, isAuthenticated: true });
            return { success: true };
          }
          return { success: false, error: response.data.error || 'Invalid credentials' };
        } catch (error: any) {
          const msg = error.response?.data?.error || error.message || 'Login connection failed.';
          return { success: false, error: msg };
        }
      },
      logout: () => set({ user: null, isAuthenticated: false }),
      updateProfile: (updates) => set((state) => ({
        user: state.user ? { ...state.user, ...updates } : null
      })),
      requestOtp: async (email, phone, purpose) => {
        try {
          const response = await api.post(`/auth?action=request-otp`, { email, phone, purpose });
          if (response.data.success) {
            return { success: true, simulatedOtp: response.data._sandbox?.simulatedOtp };
          }
          return { success: false, error: response.data.error || 'Failed to request verification code.' };
        } catch (error: any) {
          const msg = error.response?.data?.error || error.message || 'Request failed.';
          return { success: false, error: msg };
        }
      },
      verifyAndSignUp: async (name, email, phone, password, otp) => {
        try {
          const response = await api.post(`/auth?action=verify-otp-signup`, { name, email, phone, password, otp });
          if (response.data.success) {
            set({ user: response.data.user, isAuthenticated: true });
            return { success: true };
          }
          return { success: false, error: response.data.error || 'Verification failed.' };
        } catch (error: any) {
          const msg = error.response?.data?.error || error.message || 'Registration failed.';
          return { success: false, error: msg };
        }
      },
      verifyAndResetPassword: async (email, otp, newPassword) => {
        try {
          const response = await api.post(`/auth?action=verify-otp-reset`, { email, otp, password: newPassword });
          if (response.data.success) {
            return { success: true };
          }
          return { success: false, error: response.data.error || 'Reset failed.' };
        } catch (error: any) {
          const msg = error.response?.data?.error || error.message || 'Password reset failed.';
          return { success: false, error: msg };
        }
      },
      verifyAndChangePassword: async (email, otp, newPassword) => {
        try {
          const response = await api.post(`/auth?action=verify-otp-change`, { email, otp, password: newPassword });
          if (response.data.success) {
            return { success: true };
          }
          return { success: false, error: response.data.error || 'Update failed.' };
        } catch (error: any) {
          const msg = error.response?.data?.error || error.message || 'Password update failed.';
          return { success: false, error: msg };
        }
      },
    }),
    { name: 'vedama-auth' }
  )
);
