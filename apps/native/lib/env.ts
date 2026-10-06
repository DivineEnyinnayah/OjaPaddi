/**
 * Typed environment variable access.
 *
 * All environment variables used across the native app MUST be accessed
 * through this module — never use `process.env.X` inline anywhere else.
 *
 * In development (Expo Go / dev client), values come from `process.env`
 * (injected by Metro). In native builds (prebuild / EAS), values are
 * embedded via `app.config.js` → `extra` → `Constants.expoConfig.extra`.
 *
 * @see AGENTS.md Section 12 — "All environment variables accessed via typed env.ts"
 */

import Constants from 'expo-constants';

interface AppEnv {
  /** Base URL for the HonoJS API server (includes /v1 prefix) */
  SERVER_URL: string;
  /**
   * When true, authentication is bypassed and all API calls are routed
   * to the local in-memory mock engine instead of the real backend.
   * Set via EXPO_PUBLIC_DEV_MODE in .env
   */
  IS_DEV_MODE: boolean;
  /** Supabase project URL */
  SUPABASE_URL: string;
  /** Supabase anon key */
  SUPABASE_ANON_KEY: string;
}

function getExtra(): Record<string, any> {
  // In development, Constants.expoConfig may be undefined; fall back to process.env
  const extra = Constants.expoConfig?.extra ?? {};
  return extra;
}

function getEnvVar(key: string, fallback?: string): string {
  // Priority: embedded extra (native builds) > process.env (dev) > fallback
  const extra = getExtra();
  if (extra[key] !== undefined && extra[key] !== null && extra[key] !== '') {
    return String(extra[key]);
  }
  if (process.env[key] !== undefined && process.env[key] !== '') {
    return process.env[key] as string;
  }
  if (fallback !== undefined) {
    return fallback;
  }
  throw new Error(`Missing required environment variable: ${key}`);
}

function getBoolEnvVar(key: string, fallback: boolean = false): boolean {
  const val = getEnvVar(key, String(fallback));
  return val === 'true';
}

export const env: AppEnv = {
  SERVER_URL: getEnvVar('EXPO_PUBLIC_SERVER_URL'),
  IS_DEV_MODE: getBoolEnvVar('EXPO_PUBLIC_DEV_MODE', false),
  SUPABASE_URL: getEnvVar('EXPO_PUBLIC_SUPABASE_URL', ''),
  SUPABASE_ANON_KEY: getEnvVar('EXPO_PUBLIC_SUPABASE_ANON_KEY', ''),
};