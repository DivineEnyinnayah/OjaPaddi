/**
 * Maps server error codes to user-friendly messages.
 * Falls back to the raw server message if code is unknown.
 */
export const ERROR_MESSAGES: Record<string, string> = {
  UNAUTHORIZED: "Please log in again to continue.",
  FORBIDDEN: "You don't have permission to do this.",
  NOT_FOUND: "We couldn't find what you're looking for.",
  VALIDATION_ERROR: "Please check your inputs and try again.",
  PLAN_LIMIT_REACHED: "You've reached the free plan limit. Upgrade to continue.",
  CONFLICT: "This already exists. Please use a different value.",
  TOO_MANY_REQUESTS: "Too many requests. Please wait a moment and try again.",
  REGISTRATION_FAILED: "Registration failed. Please try again.",
  LOGIN_FAILED: "Invalid email or password.",
  REFRESH_FAILED: "Your session has expired. Please log in again.",
  RECEIPT_FETCH_FAILED: "Could not load receipt. Please try again.",
  PRODUCT_FETCH_FAILED: "Could not load product details.",
  INSUFFICIENT_STOCK: "Not enough stock for this product.",
};

export function getUserFriendlyError(code?: string, fallback?: string): string {
  if (code && ERROR_MESSAGES[code]) return ERROR_MESSAGES[code];
  return fallback || "Something went wrong. Please try again.";
}
