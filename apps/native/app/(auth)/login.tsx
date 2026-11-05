import React, { useState } from "react";
import { KeyboardAvoidingView, Platform } from "react-native";
import { useRouter } from "expo-router";
import { EnvelopeSimple, Lock, Eye, EyeSlash } from "phosphor-react-native";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/container";
import { useToast } from "@/components/ui/toast";
import { apiRequest } from "../../lib/api";
import { useAuthStore, type User } from "../../stores/authStore";
import {
  StyledView,
  StyledText,
  StyledTouchableOpacity,
  StyledTextInput,
  StyledScrollView,
} from "@/components/ui/styled";
import { useThemeColor } from "@/hooks/useThemeColor";
import { colorTokens } from "@/constants/tokens";

interface FormErrors {
  email?: string;
  password?: string;
}

/**
 * FigCraft `02.2 — Sign in` (frame 443), 390×844.
 * Layout from the frame; all auth logic (apiRequest, PASSWORD_RESET_REQUIRED
 * routing, forgot-password) is preserved unchanged.
 */
export default function LoginScreen() {
  const router = useRouter();
  const setUser = useAuthStore((state) => state.setUser);
  const colors = useThemeColor();
  const toast = useToast();

  const [formData, setFormData] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [focusedField, setFocusedField] = useState<"email" | "password" | null>(null);

  const validateForm = () => {
    const newErrors: FormErrors = {};
    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Enter a valid email address";
    }
    if (!formData.password) {
      newErrors.password = "Password is required";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    if (!validateForm()) return;
    setIsLoading(true);
    try {
      const result = await apiRequest<{ user: User; access_token: string; refresh_token: string }>(
        "/auth/login",
        { method: "POST", body: JSON.stringify(formData) },
      );
      if (result.success && result.data) {
        await setUser(result.data.user, result.data.access_token, result.data.refresh_token);
        router.replace("/");
      } else if (result.error?.code === "PASSWORD_RESET_REQUIRED") {
        // Account exists but has never had a password — every user migrated
        // off Supabase is in this state. Send them to set one.
        router.push({
          pathname: "/set-password",
          params: { email: formData.email.trim().toLowerCase() },
        });
      } else {
        toast.error(result.error?.message || "An error occurred", "Login failed");
      }
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!formData.email.trim()) {
      toast.error("Please enter your email address first.", "Email required");
      return;
    }
    setIsLoading(true);
    try {
      const result = await apiRequest("/auth/forgot-password", {
        method: "POST",
        body: JSON.stringify({ email: formData.email }),
      });
      if (result.success) {
        toast.success(
          "If an account exists with that email, we've sent a password reset link.",
          "Check your email",
        );
      } else {
        toast.error(result.error?.message || "Failed to send reset email.");
      }
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const updateField = (field: keyof typeof formData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const fieldBorder = (field: "email" | "password") =>
    errors[field] ? "border-danger" : focusedField === field ? "border-brand" : "border-border";

  return (
    <Container isScrollable={false} withSafeAreaTop={false} className="bg-background">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <StyledScrollView
          contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 24, paddingVertical: 24 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Eyebrow */}
          <StyledText className="font-label uppercase tracking-[2px]" style={{ fontSize: 9, color: colors.accent }}>
            WELCOME BACK
          </StyledText>

          {/* Title */}
          <StyledText
            className="mt-3 font-display"
            style={{ fontSize: 31, lineHeight: 34, letterSpacing: -0.31, color: colors.ink }}
          >
            Sign in.{"\n"}Stock is waiting.
          </StyledText>

          {/* Sub */}
          <StyledText className="mt-4 font-body" style={{ fontSize: 13, color: colors.muted }}>
            See your store before the noise starts.
          </StyledText>

          {/* Error banner (FigCraft 443) */}
          {errors.email || errors.password ? (
            <StyledView
              className="mt-6 min-h-[46px] justify-center rounded-input border px-4"
              style={{ backgroundColor: colorTokens.dangerSoft.light, borderColor: colors.danger }}
              accessibilityRole="alert"
            >
              <StyledText className="font-label" style={{ fontSize: 13, color: colors.danger }}>
                {errors.email || errors.password}
              </StyledText>
            </StyledView>
          ) : null}

          {/* Email */}
          <StyledText className="mt-7 font-label uppercase tracking-[1.5px]" style={{ fontSize: 9, color: colors.muted }}>
            EMAIL
          </StyledText>
          <StyledView
            className={`mt-2 h-[54px] flex-row items-center rounded-input border bg-card px-4 ${fieldBorder("email")}`}
          >
            <EnvelopeSimple size={20} color={colors.muted} />
            <StyledTextInput
              className="ml-3 flex-1 px-0 font-body text-body text-ink"
              placeholder="your@email.com"
              placeholderTextColor={colors.muted}
              value={formData.email}
              onChangeText={(value) => updateField("email", value)}
              onFocus={() => setFocusedField("email")}
              onBlur={() => setFocusedField(null)}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              accessibilityLabel="Email"
            />
          </StyledView>

          {/* Password */}
          <StyledText className="mt-8 font-label uppercase tracking-[1.5px]" style={{ fontSize: 9, color: colors.muted }}>
            PASSWORD
          </StyledText>
          <StyledView
            className={`mt-2 h-[54px] flex-row items-center rounded-input border bg-card px-4 ${fieldBorder("password")}`}
          >
            <Lock size={20} color={colors.muted} />
            <StyledTextInput
              className="ml-3 flex-1 px-0 font-body text-body text-ink"
              placeholder="Enter your password"
              placeholderTextColor={colors.muted}
              value={formData.password}
              onChangeText={(value) => updateField("password", value)}
              onFocus={() => setFocusedField("password")}
              onBlur={() => setFocusedField(null)}
              secureTextEntry={!showPassword}
              accessibilityLabel="Password"
            />
            <StyledTouchableOpacity
              onPress={() => setShowPassword(!showPassword)}
              accessibilityRole="button"
              accessibilityLabel={showPassword ? "Hide password" : "Show password"}
              accessibilityState={{ expanded: showPassword }}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              {showPassword ? <Eye size={20} color={colors.muted} /> : <EyeSlash size={20} color={colors.muted} />}
            </StyledTouchableOpacity>
          </StyledView>

          {/* Forgot password */}
          <StyledTouchableOpacity
            className="mt-4 min-h-11 self-end justify-center"
            onPress={handleForgotPassword}
            accessibilityRole="button"
            accessibilityLabel="Forgot password"
          >
            <StyledText className="font-bold" style={{ fontSize: 12, color: colors.brand }}>
              Forgot password?
            </StyledText>
          </StyledTouchableOpacity>

          {/* CTA */}
          <Button variant="primary" size="lg" className="mt-5" onPress={handleLogin} isLoading={isLoading}>
            Sign in
          </Button>

          {/* Create account */}
          <StyledView className="mt-7 flex-row items-center justify-center gap-1">
            <StyledText className="font-body" style={{ fontSize: 12, color: colors.muted }}>
              New here?
            </StyledText>
            <StyledTouchableOpacity
              onPress={() => router.push("/register")}
              accessibilityRole="button"
              accessibilityLabel="Create an account"
            >
              <StyledText className="font-bold" style={{ fontSize: 13, color: colors.brand }}>
                Create an account →
              </StyledText>
            </StyledTouchableOpacity>
          </StyledView>

          {/* Offline note */}
          <StyledView
            className="mt-8 min-h-[64px] flex-row items-center rounded-input px-4"
            style={{ backgroundColor: colorTokens.accentSoft.light }}
          >
            <StyledView className="mr-3 h-[10px] w-[10px] rounded-pill" style={{ backgroundColor: colors.accent }} />
            <StyledView className="flex-1">
              <StyledText className="font-extrabold" style={{ fontSize: 13, color: colorTokens.ink.light }}>
                No network? Keep working.
              </StyledText>
              <StyledText className="mt-0.5 font-body" style={{ fontSize: 11, color: colorTokens.ink.light }}>
                Sales sync automatically when you&apos;re back.
              </StyledText>
            </StyledView>
          </StyledView>

          <StyledView className="flex-1" />

          <StyledText className="mt-8 text-center font-body" style={{ fontSize: 11, color: colors.muted }}>
            Free forever · 50 products · No card required
          </StyledText>
        </StyledScrollView>
      </KeyboardAvoidingView>
    </Container>
  );
}
