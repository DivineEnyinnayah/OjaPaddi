import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Network from 'expo-network';
import { useAuthStore } from '../stores/authStore';
import { env } from './env';
import { getMockResponse, getMockFormDataResponse } from './mockApi';
import { ERROR_MESSAGES } from '@/constants/errorMessages';

const BASE_URL = env.SERVER_URL;

// ── Retry & Offline Queue Types ───────────────────────────────────

export interface RetryOptions {
  /** Number of retry attempts (default: 3) */
  retries?: number;
  /** Whether to queue requests when offline (default: true) */
  enableOfflineQueue?: boolean;
}

interface QueuedRequest {
  id: string;
  endpoint: string;
  options: RequestInit;
  timestamp: number;
  isFormData?: boolean;
  formDataEntries?: [string, string | Blob][];
}

const OFFLINE_QUEUE_KEY = '@ojapaddi:offline_queue';
const MAX_QUEUE_SIZE = 50;
const BASE_DELAY_MS = 1000;

// ── Network Status ────────────────────────────────────────────────

async function isOnline(): Promise<boolean> {
  try {
    const status = await Network.getNetworkStateAsync();
    return status.isConnected ?? false;
  } catch {
    // If we can't check, assume online to avoid false queues
    return true;
  }
}

// ── Offline Queue Management ──────────────────────────────────────

async function getOfflineQueue(): Promise<QueuedRequest[]> {
  try {
    const raw = await AsyncStorage.getItem(OFFLINE_QUEUE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

async function saveOfflineQueue(queue: QueuedRequest[]): Promise<void> {
  try {
    // Trim queue if it gets too large (drop oldest)
    const trimmed = queue.slice(-MAX_QUEUE_SIZE);
    await AsyncStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(trimmed));
  } catch (error) {
    console.error('Failed to save offline queue:', error);
  }
}

async function enqueueRequest(
  request: QueuedRequest
): Promise<void> {
  const queue = await getOfflineQueue();
  queue.push(request);
  await saveOfflineQueue(queue);
  console.log(`[API] Request queued offline: ${request.endpoint} (queue size: ${queue.length})`);
}

async function dequeueAndRetry(): Promise<void> {
  const queue = await getOfflineQueue();
  if (queue.length === 0) return;

  console.log(`[API] Connectivity restored. Retrying ${queue.length} queued request(s)...`);
  await AsyncStorage.removeItem(OFFLINE_QUEUE_KEY);

  // Replay all queued requests sequentially
  for (const queued of queue) {
    try {
      if (queued.isFormData) {
        const formData = new FormData();
        // Reconstruct FormData from entries
        for (const [key, value] of queued.formDataEntries || []) {
          if (value instanceof Blob) {
            formData.append(key, value);
          } else {
            formData.append(key, value as string);
          }
        }
        await apiFormDataRequest(queued.endpoint, formData, queued.options.method as string);
      } else {
        await apiRequest(queued.endpoint, queued.options);
      }
      console.log(`[API] Queued request succeeded: ${queued.endpoint}`);
    } catch (error) {
      console.error(`[API] Queued request failed: ${queued.endpoint}`, error);
      // Re-queue failed requests for next connectivity restore
      await enqueueRequest(queued);
    }
  }
}

// ── Connectivity Listener ─────────────────────────────────────────

let connectivityListenerRegistered = false;

function ensureConnectivityListener(): void {
  if (connectivityListenerRegistered) return;
  connectivityListenerRegistered = true;

  // Use polling since expo-network doesn't expose event subscriptions
  // Check every 10 seconds for connectivity restoration
  const interval = setInterval(async () => {
    const online = await isOnline();
    if (online) {
      const queue = await getOfflineQueue();
      if (queue.length > 0) {
        await dequeueAndRetry();
      }
    }
  }, 10000);

  // Cleanup on app termination (best effort)
  if (typeof global !== 'undefined' && (global as any).__DEV__) {
    // In dev mode, clear interval on hot reload
    const original = (global as any).__cleanupOfflineListener;
    if (original) original();
    (global as any).__cleanupOfflineListener = () => clearInterval(interval);
  }
}

// ── Retry Logic ───────────────────────────────────────────────────

function isRetryableError(status: number): boolean {
  return status >= 500 && status < 600;
}

function isNetworkError(error: unknown): boolean {
  if (error instanceof TypeError) {
    const message = error.message.toLowerCase();
    return (
      message.includes('network') ||
      message.includes('fetch') ||
      message.includes('connection') ||
      message.includes('aborted') ||
      message.includes('timeout')
    );
  }
  return false;
}

function getRetryDelay(attempt: number): number {
  // Exponential backoff: 1s, 2s, 4s, ...
  return BASE_DELAY_MS * Math.pow(2, attempt);
}

function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

// ── Core API Request ──────────────────────────────────────────────

async function executeRequest<T>(
  endpoint: string,
  options: RequestInit,
  maxRetries: number,
  enableOfflineQueue: boolean
): Promise<{ success: boolean; data?: T; error?: { code: string; message: string } }> {
  const url = `${BASE_URL}${endpoint}`;
  const { accessToken, refreshToken } = useAuthStore.getState();

  const defaultHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (accessToken) {
    defaultHeaders['Authorization'] = `Bearer ${accessToken}`;
  }

  let lastError: unknown = null;
  let lastResponse: Response | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    // Wait before retry (skip on first attempt)
    if (attempt > 0) {
      const delay = getRetryDelay(attempt - 1);
      console.log(`[API] Retry attempt ${attempt}/${maxRetries} for ${endpoint} in ${delay}ms`);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }

    try {
      // Check connectivity before each attempt (skip on first attempt if we already know we're online)
      if (attempt > 0 && enableOfflineQueue) {
        const online = await isOnline();
        if (!online) {
          // Queue for later
          await enqueueRequest({
            id: generateRequestId(),
            endpoint,
            options,
            timestamp: Date.now(),
          });
          ensureConnectivityListener();
          return { success: false, error: { code: 'OFFLINE', message: 'No network connection. Request queued for retry.' } };
        }
      }

      const response = await fetch(url, {
        ...options,
        headers: {
          ...defaultHeaders,
          ...options.headers,
        },
      });

      // Handle 401 Unauthorized - attempt token refresh (only on first attempt)
      if (response.status === 401 && attempt === 0 && !isAuthEndpoint(endpoint)) {
        if (refreshToken) {
          const refreshed = await handleTokenRefresh();
          if (refreshed) {
            // Retry with new token
            const newAccessToken = useAuthStore.getState().accessToken;
            const retryHeaders = {
              ...defaultHeaders,
              ...options.headers,
              ...(newAccessToken ? { Authorization: `Bearer ${newAccessToken}` } : {}),
            };
            const retryResponse = await fetch(url, { ...options, headers: retryHeaders });
            lastResponse = retryResponse;

            if (isRetryableError(retryResponse.status) && attempt < maxRetries) {
              continue; // Retry on 5xx
            }

            return await parseResponse<T>(retryResponse);
          }
          // Refresh failed — session is dead; expireSession already fired inside handleTokenRefresh.
          return sessionExpiredResult();
        }

        // No refresh token to recover the session with — it's unrecoverable.
        await useAuthStore.getState().expireSession();
        return sessionExpiredResult();
      }

      lastResponse = response;

      // Check if we should retry (5xx errors)
      if (isRetryableError(response.status) && attempt < maxRetries) {
        continue;
      }

      return await parseResponse<T>(response);
    } catch (error) {
      lastError = error;

      // Network error - check if we should queue or retry
      if (isNetworkError(error) && enableOfflineQueue) {
        const online = await isOnline();
        if (!online) {
          await enqueueRequest({
            id: generateRequestId(),
            endpoint,
            options,
            timestamp: Date.now(),
          });
          ensureConnectivityListener();
          return { success: false, error: { code: 'OFFLINE', message: 'No network connection. Request queued for retry.' } };
        }
      }

      // If it's a retryable network error and we have retries left
      if (isNetworkError(error) && attempt < maxRetries) {
        continue;
      }

      // Non-retryable error or no retries left
      console.error(`[API] Request failed: ${endpoint}`, error);
      return {
        success: false,
        error: {
          code: 'NETWORK_ERROR',
          message: error instanceof Error ? error.message : 'Network request failed',
        },
      };
    }
  }

  // All retries exhausted
  if (lastResponse) {
    return await parseResponse<T>(lastResponse);
  }

  return {
    success: false,
    error: {
      code: 'RETRY_EXHAUSTED',
      message: lastError instanceof Error ? lastError.message : 'All retry attempts failed',
    },
  };
}

// ── Token Refresh Helper ──────────────────────────────────────────

let refreshInFlight: Promise<boolean> | null = null;

function isAuthEndpoint(endpoint: string): boolean {
  // Auth endpoints are pre-auth by design — a 401 there (e.g. bad login
  // credentials) means the request failed, not that the session expired.
  return endpoint.startsWith('/auth/');
}

async function handleTokenRefresh(): Promise<boolean> {
  const { refreshToken } = useAuthStore.getState();
  if (!refreshToken) return false;

  // Dedupe concurrent refreshes: many requests can 401 at once (e.g.
  // dashboard), and they should share a single refresh call.
  if (refreshInFlight) return refreshInFlight;

  refreshInFlight = (async () => {
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
          return true;
        }
      }

      // Server rejected the refresh token — session is genuinely dead.
      await useAuthStore.getState().expireSession();
      return false;
    } catch (error) {
      console.error('Token refresh error during apiRequest:', error);
      return false;
    } finally {
      refreshInFlight = null;
    }
  })();

  return refreshInFlight;
}

function sessionExpiredResult(): { success: false; error: { code: string; message: string } } {
  return {
    success: false,
    error: { code: 'SESSION_EXPIRED', message: ERROR_MESSAGES.SESSION_EXPIRED },
  };
}

// ── Response Parser ───────────────────────────────────────────────

async function parseResponse<T>(
  response: Response
): Promise<{ success: boolean; data?: T; error?: { code: string; message: string } }> {
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

// ── Public API ────────────────────────────────────────────────────

export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {},
  retryOptions: RetryOptions = {}
): Promise<{ success: boolean; data?: T; error?: { code: string; message: string } }> {
  const { retries = 3, enableOfflineQueue = true } = retryOptions;

  // ── Dev Mode Interception ──────────────────────────────────────
  if (env.IS_DEV_MODE) {
    return getMockResponse<T>(endpoint, options);
  }

  return executeRequest<T>(endpoint, options, retries, enableOfflineQueue);
}

export async function apiFormDataRequest<T>(
  endpoint: string,
  formData: FormData,
  method: string = 'POST',
  retryOptions: RetryOptions = {}
): Promise<{ success: boolean; data?: T; error?: { code: string; message: string } }> {
  const { retries = 3, enableOfflineQueue = true } = retryOptions;

  // ── Dev Mode Interception ──────────────────────────────────────
  if (env.IS_DEV_MODE) {
    return getMockFormDataResponse<T>(endpoint, formData, method);
  }

  const url = `${BASE_URL}${endpoint}`;
  const { accessToken, refreshToken } = useAuthStore.getState();

  const headers: Record<string, string> = {};
  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  }

  let lastError: unknown = null;
  let lastResponse: Response | null = null;

  for (let attempt = 0; attempt <= retries; attempt++) {
    // Wait before retry (skip on first attempt)
    if (attempt > 0) {
      const delay = getRetryDelay(attempt - 1);
      console.log(`[API] Retry attempt ${attempt}/${retries} for ${endpoint} in ${delay}ms`);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }

    try {
      // Check connectivity before each attempt
      if (attempt > 0 && enableOfflineQueue) {
        const online = await isOnline();
        if (!online) {
          // Serialize FormData for offline storage
          const entries: [string, string | Blob][] = [];
          formData.forEach((value, key) => {
            entries.push([key, value as string | Blob]);
          });

          await enqueueRequest({
            id: generateRequestId(),
            endpoint,
            options: { method },
            timestamp: Date.now(),
            isFormData: true,
            formDataEntries: entries,
          });
          ensureConnectivityListener();
          return { success: false, error: { code: 'OFFLINE', message: 'No network connection. Request queued for retry.' } };
        }
      }

      let response = await fetch(url, {
        method,
        headers,
        body: formData,
      });

      // Handle 401 Unauthorized - attempt token refresh (only on first attempt)
      if (response.status === 401 && attempt === 0 && !isAuthEndpoint(endpoint)) {
        if (refreshToken) {
          const refreshed = await handleTokenRefresh();
          if (refreshed) {
            const newAccessToken = useAuthStore.getState().accessToken;
            const retryHeaders = {
              ...headers,
              ...(newAccessToken ? { Authorization: `Bearer ${newAccessToken}` } : {}),
            };
            response = await fetch(url, {
              method,
              headers: retryHeaders,
              body: formData,
            });
            lastResponse = response;

            if (isRetryableError(response.status) && attempt < retries) {
              continue;
            }

            return await parseResponse<T>(response);
          }
          // Refresh failed — session is dead; expireSession already fired inside handleTokenRefresh.
          return sessionExpiredResult();
        }

        // No refresh token to recover the session with — it's unrecoverable.
        await useAuthStore.getState().expireSession();
        return sessionExpiredResult();
      }

      lastResponse = response;

      // Check if we should retry (5xx errors)
      if (isRetryableError(response.status) && attempt < retries) {
        continue;
      }

      return await parseResponse<T>(response);
    } catch (error) {
      lastError = error;

      // Network error - check if we should queue or retry
      if (isNetworkError(error) && enableOfflineQueue) {
        const online = await isOnline();
        if (!online) {
          const entries: [string, string | Blob][] = [];
          formData.forEach((value, key) => {
            entries.push([key, value as string | Blob]);
          });

          await enqueueRequest({
            id: generateRequestId(),
            endpoint,
            options: { method },
            timestamp: Date.now(),
            isFormData: true,
            formDataEntries: entries,
          });
          ensureConnectivityListener();
          return { success: false, error: { code: 'OFFLINE', message: 'No network connection. Request queued for retry.' } };
        }
      }

      // If it's a retryable network error and we have retries left
      if (isNetworkError(error) && attempt < retries) {
        continue;
      }

      console.error(`[API] FormData request failed: ${endpoint}`, error);
      return {
        success: false,
        error: {
          code: 'NETWORK_ERROR',
          message: error instanceof Error ? error.message : 'Network request failed',
        },
      };
    }
  }

  // All retries exhausted
  if (lastResponse) {
    return await parseResponse<T>(lastResponse);
  }

  return {
    success: false,
    error: {
      code: 'RETRY_EXHAUSTED',
      message: lastError instanceof Error ? lastError.message : 'All retry attempts failed',
    },
  };
}
