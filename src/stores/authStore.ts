import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User, UserRole } from '../types';
import { mockUsers } from '../lib/mockData';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => { success: boolean; error?: string };
  logout: () => void;
}

// Demo credentials mapping
const DEMO_CREDENTIALS: Record<string, string> = {
  'admin@vedama.co.ke': 'admin123',
  'finance@vedama.co.ke': 'finance123',
  'landlord@vedama.co.ke': 'landlord123',
  'client@vedama.co.ke': 'client123',
  'provider@vedama.co.ke': 'provider123',
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      login: (email, password) => {
        const expectedPwd = DEMO_CREDENTIALS[email.toLowerCase()];
        if (!expectedPwd || expectedPwd !== password) {
          return { success: false, error: 'Invalid email or password.' };
        }
        const user = mockUsers.find((u) => u.email.toLowerCase() === email.toLowerCase());
        if (!user) return { success: false, error: 'User not found.' };
        set({ user, isAuthenticated: true });
        return { success: true };
      },
      logout: () => set({ user: null, isAuthenticated: false }),
    }),
    { name: 'vedama-auth' }
  )
);
