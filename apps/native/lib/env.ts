/**
 * Typed environment variable access.
 *
 * All environment variables used across the native app MUST be accessed
 * through this module — never use `process.env.X` inline anywhere else.
 *
 * @see AGENTS.md Section 12 — "All environment variables accessed via typed env.ts"
 */

interface AppEnv {
  /** Base URL for the HonoJS API server */
  SERVER_URL: string;
  /**
   * When true, authentication is bypassed and all API calls are routed
   * to the local in-memory mock engine instead of the real backend.
   * Set via EXPO_PUBLIC_DEV_MODE in .env
   */
  IS_DEV_MODE: boolean;
}

export const env: AppEnv = {
  SERVER_URL: process.env.EXPO_PUBLIC_SERVER_URL || 'http://localhost:3001',
  IS_DEV_MODE: process.env.EXPO_PUBLIC_DEV_MODE === 'true',
};
