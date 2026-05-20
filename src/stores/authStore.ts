import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User } from '../types';
import api from '../lib/api';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
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
    }),
    { name: 'vedama-auth' }
  )
);
