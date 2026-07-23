import { Hono } from "hono";
import { loginUser, logoutUser, refreshAccessToken, forgotPassword, resetPassword, completeRegistration } from "../services/authService";
import { validate } from "../middleware/validate";
import { CompleteRegistrationSchema, LoginSchema, RefreshTokenSchema, ForgotPasswordSchema, ResetPasswordSchema } from "../validators/auth";
import type { HonoEnv } from "../types";

export const authRoutes = new Hono<HonoEnv>();

authRoutes.post("/complete-registration", validate(CompleteRegistrationSchema), async (c) => {
  try {
    const db = c.get("db");
    const { registration, onboarding } = c.get("validatedBody");
    
    const result = await completeRegistration(db, registration, onboarding);
    return c.json({ success: true, data: result }, 201);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[AUTH] Complete registration failed:", message);
    return c.json({ success: false, error: { code: "REGISTRATION_FAILED", message } }, 400);
  }
});

authRoutes.post("/login", validate(LoginSchema), async (c) => {
  try {
    const db = c.get("db");
    const { email, password } = c.get("validatedBody");
    const result = await loginUser(db, email, password);
    return c.json({ success: true, data: result }, 200);
  } catch (error: unknown) {
    return c.json({ success: false, error: { code: "LOGIN_FAILED", message: error instanceof Error ? error.message : String(error) } }, 401);
  }
});

authRoutes.post("/refresh", validate(RefreshTokenSchema), async (c) => {
  try {
    const db = c.get("db");
    const { refresh_token } = c.get("validatedBody");
    const result = await refreshAccessToken(db, refresh_token);
    return c.json({ success: true, data: result }, 200);
  } catch (error: unknown) {
    return c.json({ success: false, error: { code: "REFRESH_FAILED", message: error instanceof Error ? error.message : String(error) } }, 401);
  }
});

authRoutes.post("/logout", validate(RefreshTokenSchema), async (c) => {
  try {
    const db = c.get("db");
    const { refresh_token } = c.get("validatedBody");
    await logoutUser(db, refresh_token);
    return c.json({ success: true, data: { message: "Logged out" } }, 200);
  } catch (error: unknown) {
    return c.json({ success: false, error: { code: "LOGOUT_FAILED", message: error instanceof Error ? error.message : String(error) } }, 400);
  }
});

authRoutes.post("/forgot-password", validate(ForgotPasswordSchema), async (c) => {
  try {
    const { email } = c.get("validatedBody");
    await forgotPassword(email);
    return c.json({ success: true, data: { message: "Reset email sent" } }, 200);
  } catch (error: unknown) {
    return c.json({ success: false, error: { code: "FORGOT_PASSWORD_FAILED", message: error instanceof Error ? error.message : String(error) } }, 400);
  }
});

authRoutes.post("/reset-password", validate(ResetPasswordSchema), async (c) => {
  try {
    const { token, new_password } = c.get("validatedBody");
    await resetPassword(token, new_password);
    return c.json({ success: true, data: { message: "Password reset successful" } }, 200);
  } catch (error: unknown) {
    return c.json({ success: false, error: { code: "RESET_PASSWORD_FAILED", message: error instanceof Error ? error.message : String(error) } }, 400);
  }
});
