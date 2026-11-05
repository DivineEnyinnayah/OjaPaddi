import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Check, Eye, EyeSlash } from 'phosphor-react-native';
import { Button } from '@/components/ui/button';
import { Container } from '@/components/container';
import { useToast } from '@/components/ui/toast';
import { useAuthStore } from '../../stores/authStore';
import {
  StyledView,
  StyledText,
  StyledTextInput,
  StyledTouchableOpacity,
  StyledScrollView,
} from '@/components/ui/styled';
import { useThemeColor } from '@/hooks/useThemeColor';
import { colorTokens, typeScale } from '@/constants/tokens';

interface FormErrors {
  fullName?: string;
  email?: string;
  phone?: string;
  password?: string;
}

/**
 * FigCraft `02.3 — Create account` (frame 469), 390×844.
 *
 * VISUAL ONLY. Inspection of frame 469 shows YOUR NAME / BUSINESS NAME /
 * EMAIL / PASSWORD; this screen deliberately collects fullName / email /
 * phone / password and defers business name to onboarding. The field set,
 * validation, store hand-off and PASSWORD_RESET flow are preserved as-is —
 * only the visual language (eyebrow, title, 54px field boxes, brand CTA) is
 * applied. The mismatch is flagged in the rebuild report rather than
 * silently reconciled.
 */
export default function RegisterScreen() {
  const router = useRouter();
  const setPendingRegistration = useAuthStore((state) => state.setPendingRegistration);
  const colors = useThemeColor();
  const C = colorTokens;
  const toast = useToast();

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [focusedField, setFocusedField] = useState<keyof FormErrors | null>(null);

  const validateForm = () => {
    const newErrors: FormErrors = {};

    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Enter a valid email address';
    }

    if (formData.phone && !/^\d{10,11}$/.test(formData.phone.trim())) {
      newErrors.phone = 'Enter a valid phone number';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = async () => {
    if (!validateForm()) return;

    if (!agreedToTerms) {
      toast.error('Please agree to the terms and conditions to continue.', 'Agreement Required');
      return;
    }

    setIsLoading(true);

    try {
      setPendingRegistration({
        fullName: formData.fullName,
        email: formData.email,
        phone: formData.phone || undefined,
        password: formData.password,
      });
      router.replace('/onboarding');
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const updateField = (field: keyof typeof formData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const getPasswordStrength = (password: string) => {
    if (!password) return 0;
    let score = 0;
    if (password.length >= 8) score += 1;
    if (/[A-Z]/.test(password)) score += 1;
    if (/[0-9]/.test(password)) score += 1;
    if (/[^A-Za-z0-9]/.test(password)) score += 1;
    return score;
  };

  const passwordStrength = getPasswordStrength(formData.password);

  const fieldBorder = (field: keyof FormErrors) =>
    errors[field] ? 'border-danger' : focusedField === field ? 'border-brand' : 'border-border';

  return (
    <Container isScrollable={false} withSafeAreaTop className="bg-background">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <StyledScrollView
          contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 24, paddingVertical: 28 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Eyebrow */}
          <StyledText className="font-label uppercase tracking-[2px]" style={{ fontSize: 9, color: colors.accent }}>
            START FREE
          </StyledText>

          {/* Title */}
          <StyledText
            className="mt-3 font-display"
            style={{ fontSize: 31, lineHeight: 34, letterSpacing: -0.31, color: colors.ink }}
          >
            Open your stall.
          </StyledText>

          {/* Sub */}
          <StyledText className="mt-4 font-body" style={{ fontSize: 13, lineHeight: 18, color: colors.muted }}>
            Everything lives on your phone — even when data is weak.
          </StyledText>

          {/* Your name */}
          <StyledText className="mt-8 font-label uppercase tracking-[1.5px]" style={{ fontSize: 9, color: colors.muted }}>
            YOUR NAME
          </StyledText>
          <StyledView
            className={`mt-2 h-[54px] flex-row items-center rounded-input border bg-card px-4 ${fieldBorder('fullName')}`}
          >
            <StyledTextInput
              className="flex-1 px-0 font-body text-body text-ink"
              placeholder="e.g., Tope Adeyemi"
              placeholderTextColor={colors.muted}
              value={formData.fullName}
              onChangeText={(value) => updateField('fullName', value)}
              onFocus={() => setFocusedField('fullName')}
              onBlur={() => setFocusedField(null)}
              autoCapitalize="words"
              accessibilityLabel="Your name"
            />
            {formData.fullName && !errors.fullName ? <Check size={18} color={colors.brand} weight="bold" /> : null}
          </StyledView>
          {errors.fullName ? (
            <StyledText className="mt-1.5 ml-1 font-body text-micro text-danger" accessibilityRole="alert">
              {errors.fullName}
            </StyledText>
          ) : null}

          {/* Phone */}
          <StyledText className="mt-6 font-label uppercase tracking-[1.5px]" style={{ fontSize: 9, color: colors.muted }}>
            PHONE
          </StyledText>
          <StyledView
            className={`mt-2 h-[54px] flex-row items-center overflow-hidden rounded-input border bg-card ${fieldBorder('phone')}`}
          >
            <StyledView className="h-full justify-center border-r border-border px-4">
              <StyledText className="font-label" style={{ fontSize: 15, color: colors.ink }}>
                +234
              </StyledText>
            </StyledView>
            <StyledTextInput
              className="flex-1 px-4 py-0 font-body text-body text-ink"
              placeholder="8012345678"
              placeholderTextColor={colors.muted}
              value={formData.phone}
              onChangeText={(value) => updateField('phone', value)}
              onFocus={() => setFocusedField('phone')}
              onBlur={() => setFocusedField(null)}
              keyboardType="phone-pad"
              accessibilityLabel="Phone number"
            />
          </StyledView>
          {errors.phone ? (
            <StyledText className="mt-1.5 ml-1 font-body text-micro text-danger" accessibilityRole="alert">
              {errors.phone}
            </StyledText>
          ) : null}

          {/* Email */}
          <StyledText className="mt-6 font-label uppercase tracking-[1.5px]" style={{ fontSize: 9, color: colors.muted }}>
            EMAIL
          </StyledText>
          <StyledView
            className={`mt-2 h-[54px] flex-row items-center rounded-input border bg-card px-4 ${fieldBorder('email')}`}
          >
            <StyledTextInput
              className="flex-1 px-0 font-body text-body text-ink"
              placeholder="tope@gmail.com"
              placeholderTextColor={colors.muted}
              value={formData.email}
              onChangeText={(value) => updateField('email', value)}
              onFocus={() => setFocusedField('email')}
              onBlur={() => setFocusedField(null)}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              accessibilityLabel="Email address"
            />
            {formData.email && !errors.email ? <Check size={18} color={colors.brand} weight="bold" /> : null}
          </StyledView>
          {errors.email ? (
            <StyledText className="mt-1.5 ml-1 font-body text-micro text-danger" accessibilityRole="alert">
              {errors.email}
            </StyledText>
          ) : null}

          {/* Password */}
          <StyledText className="mt-6 font-label uppercase tracking-[1.5px]" style={{ fontSize: 9, color: colors.muted }}>
            PASSWORD
          </StyledText>
          <StyledView
            className={`mt-2 h-[54px] flex-row items-center rounded-input border bg-card px-4 ${fieldBorder('password')}`}
          >
            <StyledTextInput
              className="flex-1 px-0 font-body text-body text-ink"
              placeholder="••••••••"
              placeholderTextColor={colors.muted}
              value={formData.password}
              onChangeText={(value) => updateField('password', value)}
              onFocus={() => setFocusedField('password')}
              onBlur={() => setFocusedField(null)}
              secureTextEntry={!showPassword}
              accessibilityLabel="Password"
            />
            <StyledTouchableOpacity
              onPress={() => setShowPassword(!showPassword)}
              accessibilityRole="button"
              accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
              accessibilityState={{ expanded: showPassword }}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              {showPassword ? <Eye size={20} color={colors.muted} /> : <EyeSlash size={20} color={colors.muted} />}
            </StyledTouchableOpacity>
          </StyledView>

          {/* Password strength meter + helper (frame 469 PASSWORD helper) */}
          {formData.password.length > 0 ? (
            <StyledView className="mt-2 flex-row gap-1.5">
              {[0, 1, 2, 3].map((index) => (
                <StyledView
                  key={index}
                  className="h-1.5 flex-1 rounded-pill"
                  style={{ backgroundColor: index < passwordStrength ? C.brand.light : C.border.light }}
                />
              ))}
            </StyledView>
          ) : null}
          {errors.password ? (
            <StyledText className="mt-1.5 ml-1 font-body text-micro text-danger" accessibilityRole="alert">
              {errors.password}
            </StyledText>
          ) : (
            <StyledText className="mt-2 font-label" style={{ fontSize: 10, color: colors.brand }}>
              Strong — add one symbol or number.
            </StyledText>
          )}

          {/* Terms */}
          <StyledTouchableOpacity
            className="mt-6 flex-row items-start gap-3"
            onPress={() => setAgreedToTerms(!agreedToTerms)}
            accessibilityRole="checkbox"
            accessibilityLabel="Agree to terms and conditions"
            accessibilityState={{ checked: agreedToTerms }}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <StyledView
              className={`mt-0.5 h-4 w-4 flex-row items-center justify-center rounded-[4px] border ${
                agreedToTerms ? 'border-brand bg-brand' : 'border-border bg-card'
              }`}
            >
              {agreedToTerms ? <Check size={12} color={colors.card} weight="bold" /> : null}
            </StyledView>
            <StyledText className="flex-1 font-body" style={{ fontSize: 11, lineHeight: 16, color: colors.muted }}>
              I agree to the{' '}
              <StyledText className="font-label" style={{ fontSize: 11, color: colors.brand }}>
                Terms of Service
              </StyledText>{' '}
              and{' '}
              <StyledText className="font-label" style={{ fontSize: 11, color: colors.brand }}>
                Privacy Policy
              </StyledText>
            </StyledText>
          </StyledTouchableOpacity>

          {/* CTA */}
          <StyledTouchableOpacity
            className={`mt-7 h-14 flex-row items-center justify-center rounded-button bg-brand ${
              isLoading ? 'opacity-50' : ''
            }`}
            onPress={handleRegister}
            disabled={isLoading}
            accessibilityRole="button"
            accessibilityState={{ disabled: isLoading, busy: isLoading }}
          >
            <StyledText className="font-label" style={{ fontSize: typeScale.body.fontSize, color: colors.card }}>
              {isLoading ? 'Creating account…' : 'Create free account'}
            </StyledText>
          </StyledTouchableOpacity>

          {/* Terms blurb */}
          <StyledText className="mt-4 font-body" style={{ fontSize: 11, lineHeight: 16, color: colors.muted }}>
            By continuing, you agree to fair use. Never enter card data — OjaPaddi never asks for it.
          </StyledText>

          {/* Sign in link */}
          <StyledView className="mt-4 flex-row items-center justify-center gap-1">
            <StyledText className="font-body" style={{ fontSize: 12, color: colors.muted }}>
              Already have an account?
            </StyledText>
            <StyledTouchableOpacity
              onPress={() => router.push('/login')}
              className="min-h-11 justify-center"
              accessibilityRole="button"
              accessibilityLabel="Log in"
            >
              <StyledText className="font-label" style={{ fontSize: 13, color: colors.brand }}>
                Log in
              </StyledText>
            </StyledTouchableOpacity>
          </StyledView>

          <StyledView className="flex-1" />

          {/* Free proof */}
          <StyledText className="mt-8 text-center font-label" style={{ fontSize: 11, color: colors.brand }}>
            Free plan · 50 products · Unlimited sales · No card
          </StyledText>
        </StyledScrollView>
      </KeyboardAvoidingView>
    </Container>
  );
}
