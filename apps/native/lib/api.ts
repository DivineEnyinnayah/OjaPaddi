import { useAuthStore } from '../stores/authStore';
import { env } from './env';
import { getMockResponse, getMockFormDataResponse } from './mockApi';

const BASE_URL = env.SERVER_URL;

export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<{ success: boolean; data?: T; error?: { code: string; message: string } }> {
  // ── Dev Mode Interception ────────────────────────────────────────
  if (env.IS_DEV_MODE) {
    return getMockResponse<T>(endpoint, options);
  }
  // ── Production Path ──────────────────────────────────────────────
  const url = `${BASE_URL}${endpoint}`;

  const { accessToken, refreshToken } = useAuthStore.getState();

  const defaultHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (accessToken) {
    defaultHeaders['Authorization'] = `Bearer ${accessToken}`;
  }

  let response = await fetch(url, {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  });

  // Handle 401 Unauthorized - attempt token refresh
  if (response.status === 401 && refreshToken) {
    try {
      const refreshResponse = await fetch(`${BASE_URL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: refreshToken }),
      });

      if (refreshResponse.ok) {
        const result = await refreshResponse.json();
        if (result.success && result.data) {
          const { user, access_token, refresh_token } = result.data;
          await useAuthStore.getState().setUser(user, access_token, refresh_token);

          const newHeaders = {
            ...defaultHeaders,
            ...options.headers,
            'Authorization': `Bearer ${access_token}`,
          };

          response = await fetch(url, {
            ...options,
            headers: newHeaders,
          });
        }
      } else {
        await useAuthStore.getState().clearAuth();
      }
    } catch (error) {
      console.error("Token refresh error during apiRequest:", error);
    }
  }

  // Handle empty responses or non-JSON content types
  const contentType = response.headers.get('content-type');
  if (!contentType || !contentType.includes('application/json')) {
    if (!response.ok) {
      return {
        success: false,
        error: { code: 'UNKNOWN_ERROR', message: `Server error: ${response.status}` },
      };
    }
    return { success: true, data: undefined as T };
  }

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

export async function apiFormDataRequest<T>(
  endpoint: string,
  formData: FormData,
  method: string = 'POST'
): Promise<{ success: boolean; data?: T; error?: { code: string; message: string } }> {
  // ── Dev Mode Interception ────────────────────────────────────────
  if (env.IS_DEV_MODE) {
    return getMockFormDataResponse<T>(endpoint, formData, method);
  }
  // ── Production Path ──────────────────────────────────────────────
  const url = `${BASE_URL}${endpoint}`;
  const { accessToken, refreshToken } = useAuthStore.getState();

  const headers: Record<string, string> = {};
  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  }

  let response = await fetch(url, {
    method,
    headers,
    body: formData,
  });

  // Handle 401 Unauthorized - attempt token refresh
  if (response.status === 401 && refreshToken) {
    try {
      const refreshResponse = await fetch(`${BASE_URL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: refreshToken }),
      });

      if (refreshResponse.ok) {
        const result = await refreshResponse.json();
        if (result.success && result.data) {
          const { user, access_token, refresh_token: new_refresh_token } = result.data;
          await useAuthStore.getState().setUser(user, access_token, new_refresh_token);

          const newHeaders = {
            ...headers,
            'Authorization': `Bearer ${access_token}`,
          };

          response = await fetch(url, {
            method,
            headers: newHeaders,
            body: formData,
          });
        }
      } else {
        await useAuthStore.getState().clearAuth();
      }
    } catch (error) {
      console.error("Token refresh error during apiFormDataRequest:", error);
    }
  }

  const contentType = response.headers.get('content-type');
  if (!contentType || !contentType.includes('application/json')) {
    if (!response.ok) {
      return {
        success: false,
        error: { code: 'UNKNOWN_ERROR', message: `Server error: ${response.status}` },
      };
    }
    return { success: true, data: undefined as T };
  }

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

