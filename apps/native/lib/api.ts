import { useAuthStore } from '../stores/authStore';

const BASE_URL = process.env.EXPO_PUBLIC_SERVER_URL || 'http://localhost:3001';

export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<{ success: boolean; data?: T; error?: { code: string; message: string } }> {
  const url = `${BASE_URL}${endpoint}`;

  const { accessToken } = useAuthStore.getState();

  const defaultHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (accessToken) {
    defaultHeaders['Authorization'] = `Bearer ${accessToken}`;
  }

  const response = await fetch(url, {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  });

  const responseData = await response.json();

  if (!response.ok) {
    return {
      success: false,
      error: responseData.error || { code: 'UNKNOWN_ERROR', message: 'An unknown error occurred' },
    };
  }

  return {
    success: true,
    data: responseData.data,
  };
}
