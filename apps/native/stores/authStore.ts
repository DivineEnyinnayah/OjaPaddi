import { create } from 'zustand';
import { secureStorage } from '@/lib/secureStorage';
import { env } from '@/lib/env';
import { MOCK_USER } from '@/lib/mockData';

export interface User {
  id: string;
  email: string;
  fullName: string;
  businessName?: string;
  whatsappNumber?: string;
  plan: 'free' | 'pro' | 'growth';
}

interface RegistrationData {
  fullName: string;
  email: string;
  phone?: string;
  password: string;
}

interface OnboardingData {
  businessName: string;
  category: string;
  whatsappNumber: string;
  city: string;
  state: string;
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isInitialized: boolean;
  pendingRegistration: RegistrationData | null;
  pendingOnboarding: OnboardingData | null;
  setUser: (user: User | null, accessToken: string | null, refreshToken: string | null) => Promise<void>;
  clearAuth: () => Promise<void>;
  logout: () => Promise<void>;
  initialize: () => Promise<void>;
  setPendingRegistration: (data: RegistrationData | null) => void;
  setPendingOnboarding: (data: OnboardingData | null) => void;
  clearPendingData: () => void;
}

const REFRESH_TOKEN_KEY = 'ojapaddi_refresh_token';
const USER_KEY = 'ojapaddi_user';

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,
  refreshToken: null,
  isInitialized: false,
  pendingRegistration: null,
  pendingOnboarding: null,
  setUser: async (user, accessToken, refreshToken) => {
    if (user && accessToken && refreshToken) {
      await secureStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
      await secureStorage.setItem(USER_KEY, JSON.stringify(user));
    } else {
      await secureStorage.deleteItem(REFRESH_TOKEN_KEY);
      await secureStorage.deleteItem(USER_KEY);
    }
    set({ user, accessToken, refreshToken, isInitialized: true });
  },
  clearAuth: async () => {
    await secureStorage.deleteItem(REFRESH_TOKEN_KEY);
    await secureStorage.deleteItem(USER_KEY);
    set({ user: null, accessToken: null, refreshToken: null, isInitialized: true });
  },
  logout: async () => {
    try {
      const { refreshToken } = useAuthStore.getState();
      if (refreshToken && !env.IS_DEV_MODE) {
        await fetch(`${env.SERVER_URL}/auth/logout`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refresh_token: refreshToken }),
        });
      }
    } catch {
      // Best effort
    }
    await secureStorage.deleteItem(REFRESH_TOKEN_KEY);
    await secureStorage.deleteItem(USER_KEY);
    set({ user: null, accessToken: null, refreshToken: null, pendingRegistration: null, pendingOnboarding: null, isInitialized: true });
  },
  initialize: async () => {
    if (env.IS_DEV_MODE) {
      set({
        user: MOCK_USER,
        accessToken: 'mock-access-token-dev',
        refreshToken: 'mock-refresh-token-dev',
        isInitialized: true,
      });
      return;
    }
    const refreshToken = await secureStorage.getItem(REFRESH_TOKEN_KEY);
    const userStr = await secureStorage.getItem(USER_KEY);

    let user: User | null = null;
    if (userStr) {
      try {
        user = JSON.parse(userStr);
      } catch (e) {
        user = null;
      }
    }

    set({
      user,
      refreshToken,
      isInitialized: true,
    });

    if (refreshToken && user) {
      try {
        const BASE_URL = env.SERVER_URL;
        const response = await fetch(`${BASE_URL}/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refresh_token: refreshToken }),
        });

        if (response.ok) {
          const result = await response.json();
          if (result.success && result.data) {
            const { user: userData, access_token, refresh_token } = result.data;
            set({
              user: userData,
              accessToken: access_token,
              refreshToken: refresh_token,
            });
          }
        } else {
          await secureStorage.deleteItem(REFRESH_TOKEN_KEY);
          await secureStorage.deleteItem(USER_KEY);
          set({ user: null, accessToken: null, refreshToken: null });
        }
      } catch (error) {
        console.error("Failed to refresh token during initialization", error);
        if (error instanceof TypeError && error.message.includes('Network request failed')) {
          await secureStorage.deleteItem(REFRESH_TOKEN_KEY);
          await secureStorage.deleteItem(USER_KEY);
          set({ user: null, accessToken: null, refreshToken: null });
        }
      }
    }
  },
  setPendingRegistration: (data) => set({ pendingRegistration: data }),
  setPendingOnboarding: (data) => set({ pendingOnboarding: data }),
  clearPendingData: () => set({ pendingRegistration: null, pendingOnboarding: null }),
}));
