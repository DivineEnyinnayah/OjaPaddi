import Constants from 'expo-constants';

const BASE_URL = process.env.EXPO_PUBLIC_SERVER_URL || 'http://localhost:3001';

export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<{ success: boolean; data?: T; error?: { code: string; message: string } }> {
  const url = `${BASE_URL}${endpoint}`;

  const defaultHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  // If we have a token in storage, we should add it here. 
  // For now, let's assume it's handled by the caller or we'll add it in a more central way.

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
