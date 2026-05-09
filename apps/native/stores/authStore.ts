import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';

interface User {
  id: string;
  email: string;
  fullName: string;
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isInitialized: boolean;
  setUser: (user: User | null, accessToken: string | null, refreshToken: string | null) => Promise<void>;
  clearAuth: () => Promise<void>;
  initialize: () => Promise<void>;
}

const TOKEN_KEY = 'ojapaddi_access_token';
const REFRESH_TOKEN_KEY = 'ojapaddi_refresh_token';
const USER_KEY = 'ojapaddi_user';

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,
  refreshToken: null,
  isInitialized: false,
  setUser: async (user, accessToken, refreshToken) => {
    if (user && accessToken && refreshToken) {
      await SecureStore.setItemAsync(TOKEN_KEY, accessToken);
      await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, refreshToken);
      await SecureStore.setItemAsync(USER_KEY, JSON.stringify(user));
    } else {
      await SecureStore.deleteItemAsync(TOKEN_KEY);
      await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
      await SecureStore.deleteItemAsync(USER_KEY);
    }
    set({ user, accessToken, refreshToken, isInitialized: true });
  },
  clearAuth: async () => {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
    await SecureStore.deleteItemAsync(USER_KEY);
    set({ user: null, accessToken: null, refreshToken: null, isInitialized: true });
  },
  initialize: async () => {
    const accessToken = await SecureStore.getItemAsync(TOKEN_KEY);
    const refreshToken = await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
    const userStr = await SecureStore.getItemAsync(USER_KEY);

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
      accessToken,
      refreshToken,
      isInitialized: true,
    });
  },
}));
