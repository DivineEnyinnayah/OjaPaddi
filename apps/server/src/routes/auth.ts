import { Hono } from "hono";
import { registerUser, loginUser, logoutUser, refreshAccessToken, forgotPassword, resetPassword } from "../services/authService";

export const authRoutes = new Hono();

authRoutes.post("/register", async (c) => {
  try {
    const body = await c.req.json();
    const result = await registerUser(body);
    return c.json({ success: true, data: result }, 201);
  } catch (error: any) {
    return c.json({ success: false, error: { code: "REGISTRATION_FAILED", message: error.message } }, 400);
  }
});

authRoutes.post("/login", async (c) => {
  try {
    const { email, password } = await c.req.json();
    const result = await loginUser(email, password);
    return c.json({ success: true, data: result }, 200);
  } catch (error: any) {
    return c.json({ success: false, error: { code: "LOGIN_FAILED", message: error.message } }, 401);
  }
});

authRoutes.post("/refresh", async (c) => {
  try {
    const { refresh_token } = await c.req.json();
    const result = await refreshAccessToken(refresh_token);
    return c.json({ success: true, data: result }, 200);
  } catch (error: any) {
    return c.json({ success: false, error: { code: "REFRESH_FAILED", message: error.message } }, 401);
  }
});

authRoutes.post("/logout", async (c) => {
  try {
    const { refresh_token } = await c.req.json();
    await logoutUser(refresh_token);
    return c.json({ success: true, data: { message: "Logged out" } }, 200);
  } catch (error: any) {
    return c.json({ success: false, error: { code: "LOGOUT_FAILED", message: error.message } }, 400);
  }
});

authRoutes.post("/forgot-password", async (c) => {
  try {
    const { email } = await c.req.json();
    await forgotPassword(email);
    return c.json({ success: true, data: { message: "Reset email sent" } }, 200);
  } catch (error: any) {
    return c.json({ success: false, error: { code: "FORGOT_PASSWORD_FAILED", message: error.message } }, 400);
  }
});

authRoutes.post("/reset-password", async (c) => {
  try {
    const { token, new_password } = await c.req.json();
    await resetPassword(token, new_password);
    return c.json({ success: true, data: { message: "Password reset successful" } }, 200);
  } catch (error: any) {
    return c.json({ success: false, error: { code: "RESET_PASSWORD_FAILED", message: error.message } }, 400);
  }
});
