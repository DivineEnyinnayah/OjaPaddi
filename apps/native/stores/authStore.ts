import { create } from 'zustand';
import { secureStorage } from '@/lib/secureStorage';

interface User {
  id: string;
  email: string;
  fullName: string;
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
      // Store only refresh token and user in secure storage
      await secureStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
      await secureStorage.setItem(USER_KEY, JSON.stringify(user));
    } else {
      await secureStorage.deleteItem(REFRESH_TOKEN_KEY);
      await secureStorage.deleteItem(USER_KEY);
    }
    // Set everything in memory
    set({ user, accessToken, refreshToken, isInitialized: true });
  },
  clearAuth: async () => {
    await secureStorage.deleteItem(REFRESH_TOKEN_KEY);
    await secureStorage.deleteItem(USER_KEY);
    set({ user: null, accessToken: null, refreshToken: null, isInitialized: true });
  },
  initialize: async () => {
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

    // If we have a refresh token, try to get a new access token
    if (refreshToken && user) {
      try {
        const BASE_URL = process.env.EXPO_PUBLIC_SERVER_URL || 'http://localhost:3001';
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
          // Refresh failed, clear everything
          await secureStorage.deleteItem(REFRESH_TOKEN_KEY);
          await secureStorage.deleteItem(USER_KEY);
          set({ user: null, accessToken: null, refreshToken: null });
        }
      } catch (error) {
        console.error("Failed to refresh token during initialization", error);
      }
    }
  },
  setPendingRegistration: (data) => set({ pendingRegistration: data }),
  setPendingOnboarding: (data) => set({ pendingOnboarding: data }),
  clearPendingData: () => set({ pendingRegistration: null, pendingOnboarding: null }),
}));
