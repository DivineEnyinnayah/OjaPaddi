import React, { useEffect, useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, type TextInput } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Lock, Eye, EyeSlash, PaperPlaneTilt, ShieldCheck } from 'phosphor-react-native';
import { Button } from '@/components/ui/button';
import { Container } from '@/components/container';
import { useToast } from '@/components/ui/toast';
import { apiRequest } from '../../lib/api';
import { useAuthStore, type User } from '../../stores/authStore';
import { copy } from '@/constants/copy';
import {
  StyledView,
  StyledText,
  StyledTextInput,
  StyledTouchableOpacity,
  StyledKeyboardAvoidingView,
  StyledScrollView,
} from '@/components/ui/styled';
import { useThemeColor } from '@/hooks/useThemeColor';
import { colorTokens } from '@/constants/tokens';

interface FormErrors {
  code?: string;
  password?: string;
  confirm?: string;
}

const RESEND_SECONDS = 60;
const CODE_LENGTH = 6;

function interpolate(template: string, values: Record<string, string | number>) {
  return template.replace(/\{(\w+)\}/g, (_, key) => String(values[key] ?? `{${key}}`));
}

/**
 * FigCraft `02.4 — Confirm it’s you` (frame 496), 390×844.
 *
 * VISUAL ONLY. The frame draws six 46×54 code boxes; the screen has always
 * collected the code in a single `formData.code` field, so the boxes are a
 * presentational mirror of that value with one hidden real input behind them
 * (tapping a box focuses it). Every piece of behaviour — the Supabase-migration
 * resume flow, auto-send on mount, resend countdown, troubleshoot action sheet,
 * wrong-email editor, toasts and copy strings — is preserved unchanged.
 */
export default function SetPasswordScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ email?: string }>();
  const setUser = useAuthStore((state) => state.setUser);
  const colors = useThemeColor();
  const C = colorTokens;
  const toast = useToast();

  // Login hands the email forward so the user does not retype it.
  const [email, setEmail] = useState((params.email as string | undefined) ?? '');
  const [isEditingEmail, setIsEditingEmail] = useState(false);

  const [formData, setFormData] = useState({ code: '', password: '', confirm: '' });
  const [errors, setErrors] = useState<FormErrors>({});
  const [focusedField, setFocusedField] = useState<'code' | 'password' | 'confirm' | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const mounted = useRef(true);
  const codeInputRef = useRef<TextInput>(null);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setTimeout(() => setCountdown((n) => n - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  // Kick off code delivery as soon as the screen mounts — the user already
  // proved they know this email by getting past the login screen.
  useEffect(() => {
    if (email) void sendCode(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [email]);

  const sendCode = async (announce = true) => {
    if (!email) {
      toast.error('We could not tell which account this is. Please sign in again.', 'Something went wrong');
      return;
    }
    setIsSending(true);
    try {
      const result = await apiRequest<{ message: string }>('/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email }),
      });

      if (result.success) {
        setCountdown(RESEND_SECONDS);
        if (announce) {
          toast.success(interpolate(copy.setPassword.codeSentBody, { email }), copy.setPassword.codeSentTitle);
        }
      } else if (announce) {
        toast.error(copy.setPassword.errors.sendFailed, 'Something went wrong');
      }
    } catch {
      if (announce) toast.error(copy.setPassword.errors.sendFailed, 'Something went wrong');
    } finally {
      if (mounted.current) setIsSending(false);
    }
  };

  const handleTroubleshoot = () => {
    toast.action({
      title: copy.setPassword.troubleshootTitle,
      message: copy.setPassword.troubleshootMessage,
      options: [
        { label: copy.setPassword.troubleshootSpam },
        { label: copy.setPassword.troubleshootDomain },
        { label: copy.setPassword.troubleshootWait },
        {
          label: copy.setPassword.resend,
          style: 'default',
          onPress: () => void sendCode(true),
        },
        { label: 'Cancel', style: 'cancel' },
      ],
    });
  };

  const validateForm = () => {
    const next: FormErrors = {};
    if (!formData.code.trim()) next.code = copy.setPassword.errors.codeRequired;
    if (!formData.password) next.password = copy.setPassword.errors.passwordRequired;
    else if (formData.password.length < 8) next.password = copy.setPassword.errors.passwordTooShort;
    if (!formData.confirm) next.confirm = copy.setPassword.errors.confirmRequired;
    else if (formData.confirm !== formData.password) next.confirm = copy.setPassword.errors.mismatch;
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    setIsLoading(true);
    try {
      const result = await apiRequest('/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({ token: formData.code.trim(), new_password: formData.password }),
      });

      if (!result.success) {
        toast.error(copy.setPassword.errors.submitFailed, 'Could not set password');
        setErrors({ code: ' ' });
        return;
      }

      // Password is set — sign them straight in so they don't retype it.
      const login = await apiRequest<{ user: User; access_token: string; refresh_token: string }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password: formData.password }),
      });

      if (login.success && login.data) {
        await setUser(login.data.user, login.data.access_token, login.data.refresh_token);
        router.replace('/');
      } else {
        toast.success('Password set. Please sign in.', 'All done');
        router.replace('/login');
      }
    } catch {
      toast.error(copy.setPassword.errors.submitFailed, 'Could not set password');
    } finally {
      if (mounted.current) setIsLoading(false);
    }
  };

  const updateField = (field: keyof typeof formData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const borderClass = (field: keyof FormErrors) => {
    if (errors[field]) return 'border-danger';
    if (focusedField === field) return 'border-brand';
    return 'border-border';
  };

  // The six-box mirror of `formData.code`. The index of the next character to
  // be typed receives the accent treatment drawn in frame 496.
  const codeChars = formData.code.replace(/\s/g, '').slice(0, CODE_LENGTH).split('');
  const activeIndex = focusedField === 'code' ? Math.min(codeChars.length, CODE_LENGTH - 1) : -1;

  const field = (
    label: string,
    name: 'code' | 'password' | 'confirm',
    icon: React.ReactNode,
    placeholder: string,
    extra: { secureTextEntry?: boolean; keyboardType?: 'default'; autoCapitalize?: 'none' } = {},
  ) => (
    <StyledView className="mt-6">
      <StyledText className="font-label uppercase tracking-[1.5px]" style={{ fontSize: 9, color: colors.muted }}>
        {label}
      </StyledText>
      <StyledView
        className={`mt-2 h-[54px] flex-row items-center rounded-input border bg-card px-4 ${borderClass(name)}`}
      >
        {icon}
        <StyledTextInput
          className="ml-3 flex-1 px-0 font-body text-body text-ink"
          placeholder={placeholder}
          placeholderTextColor={colors.muted}
          value={formData[name]}
          onChangeText={(value) => updateField(name, value)}
          onFocus={() => setFocusedField(name)}
          onBlur={() => setFocusedField(null)}
          accessibilityLabel={label}
          {...extra}
        />
      </StyledView>
      {errors[name] ? (
        <StyledText className="mt-1.5 ml-1 font-body text-micro text-danger" accessibilityRole="alert">
          {errors[name]}
        </StyledText>
      ) : null}
    </StyledView>
  );

  return (
    <Container isScrollable={false} withSafeAreaTop className="bg-background">
      <StyledKeyboardAvoidingView
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
            SECURITY
          </StyledText>

          {/* Title */}
          <StyledText
            className="mt-3 font-display"
            style={{ fontSize: 31, lineHeight: 34, letterSpacing: -0.31, color: colors.ink }}
          >
            Confirm it’s you.
          </StyledText>

          {/* Sub */}
          <StyledText className="mt-4 font-body" style={{ fontSize: 13, lineHeight: 18, color: colors.muted }}>
            {interpolate(copy.setPassword.codeSentBody, { email })}
          </StyledText>

          {/*
            Six code boxes (frame 496). They mirror `formData.code`; the hidden
            input below is the real control and receives focus when any box is
            tapped, so the existing single-field contract is untouched.
          */}
          <StyledTouchableOpacity
            className="mt-7 flex-row justify-between"
            activeOpacity={1}
            onPress={() => codeInputRef.current?.focus()}
            accessibilityRole="button"
            accessibilityLabel={copy.setPassword.codeLabel}
          >
            {Array.from({ length: CODE_LENGTH }).map((_, index) => {
              const isActive = index === activeIndex;
              const hasValue = index < codeChars.length;
              return (
                <StyledView
                  key={index}
                  className={`h-[54px] w-[46px] items-center justify-center rounded-[12px] border ${
                    errors.code || errors.code === ' ' ? 'border-danger' : 'border-brand'
                  } ${isActive ? 'bg-accent-soft' : 'bg-card'}`}
                  style={
                    isActive
                      ? { borderColor: colors.accent }
                      : errors.code
                        ? { borderColor: colors.danger, backgroundColor: C.dangerSoft.light }
                        : undefined
                  }
                >
                  <StyledText className="font-display" style={{ fontSize: 20, color: colors.ink }}>
                    {hasValue ? codeChars[index] : ''}
                  </StyledText>
                </StyledView>
              );
            })}
          </StyledTouchableOpacity>

          <StyledTextInput
            ref={codeInputRef}
            value={formData.code}
            onChangeText={(value) => updateField('code', value)}
            onFocus={() => setFocusedField('code')}
            onBlur={() => setFocusedField(null)}
            keyboardType="default"
            autoCapitalize="none"
            autoCorrect={false}
            maxLength={CODE_LENGTH}
            accessibilityLabel={copy.setPassword.codeLabel}
            caretHidden
            style={{ position: 'absolute', opacity: 0, height: 1, width: 1 }}
          />
          {errors.code ? (
            <StyledText className="mt-1.5 ml-1 font-body text-micro text-danger" accessibilityRole="alert">
              {errors.code}
            </StyledText>
          ) : null}

          {/* Resend countdown (frame 496) + resend action */}
          <StyledView className="mt-3 flex-row items-center justify-between">
            <StyledText className="font-label" style={{ fontSize: 11, color: colors.muted }}>
              {countdown > 0
                ? interpolate(copy.setPassword.resendIn, { seconds: countdown })
                : copy.setPassword.resend}
            </StyledText>

            <StyledTouchableOpacity
              onPress={() => void sendCode(true)}
              disabled={countdown > 0 || isSending}
              className="min-h-11 flex-row items-center gap-1.5"
              accessibilityRole="button"
              accessibilityLabel={copy.setPassword.resend}
            >
              {isSending ? <PaperPlaneTilt size={16} color={colors.brand} /> : null}
              <StyledText
                className="font-label"
                style={{
                  fontSize: 11,
                  color: countdown > 0 || isSending ? colors.muted : colors.brand,
                }}
              >
                {copy.setPassword.resend}
              </StyledText>
            </StyledTouchableOpacity>
          </StyledView>

          {/*
            Wrong-email recovery. The code is delivered by email only — the API
            never returns it, because it is the sole proof that the requester
            controls the inbox. Kept verbatim from the previous screen.
          */}
          <StyledView className="mt-2 flex-row items-center justify-between">
            <StyledTouchableOpacity
              onPress={() => setIsEditingEmail(!isEditingEmail)}
              className="min-h-11 justify-center"
              accessibilityRole="button"
              accessibilityLabel={copy.setPassword.wrongEmail}
            >
              <StyledText className="font-label" style={{ fontSize: 11, color: colors.brand }}>
                {copy.setPassword.wrongEmail}
              </StyledText>
            </StyledTouchableOpacity>

            <StyledTouchableOpacity
              onPress={handleTroubleshoot}
              disabled={isSending}
              className="min-h-11 justify-center"
              accessibilityRole="button"
              accessibilityLabel={copy.setPassword.troubleshootTitle}
            >
              <StyledText className="font-label" style={{ fontSize: 11, color: colors.muted }}>
                Didn’t get code?
              </StyledText>
            </StyledTouchableOpacity>
          </StyledView>

          {isEditingEmail ? (
            <StyledView className="mt-1 flex-row items-center gap-2">
              <StyledTextInput
                className="h-10 flex-1 rounded-input border border-border bg-card px-3 font-body text-body-sm text-ink"
                placeholder={copy.setPassword.editEmailPlaceholder}
                placeholderTextColor={colors.muted}
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                accessibilityLabel={copy.setPassword.editEmailLabel}
              />
              <StyledTouchableOpacity
                className="h-10 justify-center rounded-input bg-brand px-4"
                onPress={() => {
                  setIsEditingEmail(false);
                  void sendCode(true);
                }}
                accessibilityRole="button"
                accessibilityLabel="Update email"
              >
                <StyledText className="font-label" style={{ fontSize: 13, color: colors.card }}>
                  OK
                </StyledText>
              </StyledTouchableOpacity>
            </StyledView>
          ) : null}

          {/* New password */}
          {field(
            copy.setPassword.newPasswordLabel.toUpperCase(),
            'password',
            <Lock size={20} color={colors.muted} />,
            'At least 8 characters',
            { secureTextEntry: !showPassword },
          )}

          {/* Retype password */}
          {field(
            copy.setPassword.confirmPasswordLabel.toUpperCase(),
            'confirm',
            <Lock size={20} color={colors.muted} />,
            'Re-enter your password',
            { secureTextEntry: !showPassword },
          )}
          <StyledText className="mt-2 font-label" style={{ fontSize: 10, color: colors.brand }}>
            Match. Your receipts stay private.
          </StyledText>

          {/* Show / hide */}
          <StyledTouchableOpacity
            onPress={() => setShowPassword((v) => !v)}
            className="mt-2 min-h-11 justify-center self-start"
            accessibilityRole="button"
            accessibilityLabel="Toggle password visibility"
          >
            <StyledText className="font-label" style={{ fontSize: 11, color: colors.brand }}>
              {showPassword ? 'Hide' : 'Show'} password
            </StyledText>
          </StyledTouchableOpacity>

          {/* CTA */}
          <Button variant="primary" size="lg" className="mt-5" onPress={handleSubmit} isLoading={isLoading}>
            {isLoading ? copy.setPassword.submitting : 'Reset and sign in'}
          </Button>

          {/* Different email / back to sign in */}
          <StyledTouchableOpacity
            className="mt-4 min-h-12 items-center justify-center"
            onPress={() => router.replace('/login')}
            accessibilityRole="button"
            accessibilityLabel={copy.setPassword.backToLogin}
          >
            <StyledText className="font-label" style={{ fontSize: 12, color: colors.brand }}>
              Use a different email
            </StyledText>
          </StyledTouchableOpacity>

          <StyledView className="flex-1" />

          {/* Privacy note */}
          <StyledView
            className="mt-6 min-h-[64px] flex-row items-center rounded-input px-4"
            style={{ backgroundColor: C.brandSoft.light }}
          >
            <ShieldCheck size={20} color={colors.brandStrong} weight="duotone" />
            <StyledView className="ml-3 flex-1">
              <StyledText className="font-label" style={{ fontSize: 13, color: colors.brandStrong }}>
                Your data stays yours.
              </StyledText>
              <StyledText className="mt-0.5 font-body" style={{ fontSize: 11, color: colors.brandStrong }}>
                No ads, no selling contacts — ever.
              </StyledText>
            </StyledView>
          </StyledView>
        </StyledScrollView>
      </StyledKeyboardAvoidingView>
    </Container>
  );
}
