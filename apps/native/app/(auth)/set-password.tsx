import React, { useEffect, useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { EnvelopeSimple, Lock, Eye, EyeSlash, CheckCircle, XCircle, PaperPlaneTilt } from 'phosphor-react-native';
import { Button } from '@/components/ui/button';
import { Container } from '@/components/container';
import { useToast } from '@/components/ui/toast';
import { apiRequest } from '../../lib/api';
import { useAuthStore, type User } from '../../stores/authStore';
import { copy } from '@/constants/copy';
import { StyledView, StyledText, StyledTextInput, StyledTouchableOpacity, StyledKeyboardAvoidingView, StyledImage } from '@/components/ui/styled';
import { useThemeColor } from '@/hooks/useThemeColor';

interface FormErrors {
  code?: string;
  password?: string;
  confirm?: string;
}

const RESEND_SECONDS = 60;

function interpolate(template: string, values: Record<string, string | number>) {
  return template.replace(/\{(\w+)\}/g, (_, key) => String(values[key] ?? `{${key}}`));
}

export default function SetPasswordScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ email?: string }>();
  const setUser = useAuthStore((state) => state.setUser);
  const colors = useThemeColor();
  const toast = useToast();

  // Login hands the email forward so the user does not retype it.
  const params = useLocalSearchParams<{ email?: string }>();
  const [email, setEmail] = useState((params.email as string | undefined) ?? '');
  const [isEditingEmail, setIsEditingEmail] = useState(false);
  const setUser = useAuthStore((state) => state.setUser);
  const colors = useThemeColor();
  const toast = useToast();

  const [formData, setFormData] = useState({ code: '', password: '', confirm: '' });
  const [errors, setErrors] = useState<FormErrors>({});
  const [focusedField, setFocusedField] = useState<'code' | 'password' | 'confirm' | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const mounted = useRef(true);

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
          style: 'primary', 
          onPress: () => void sendCode(true) 
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
    if (errors[field]) return 'border-error';
    if (focusedField === field) return 'border-primary';
    return 'border-outline-variant';
  };

  const field = (
    label: string,
    name: 'code' | 'password' | 'confirm',
    icon: React.ReactNode,
    placeholder: string,
    extra: { secureTextEntry?: boolean; keyboardType?: 'default'; autoCapitalize?: 'none' } = {}
  ) => (
    <StyledView className="gap-1.5">
      <StyledText className="text-body-sm font-semibold text-on-surface">{label}</StyledText>
      <StyledView
        className={`flex-row items-center border rounded-input px-4 h-12 bg-surface-container-lowest ${borderClass(name)}`}
      >
        {icon}
        <StyledTextInput
          className="flex-1 text-body-lg text-on-surface ml-3 px-0"
          placeholder={placeholder}
          placeholderTextColor={colors.outline}
          value={formData[name]}
          onChangeText={(value) => updateField(name, value)}
          onFocus={() => setFocusedField(name)}
          onBlur={() => setFocusedField(null)}
          {...extra}
        />
        {formData[name] && !errors[name] && <CheckCircle size={20} color={colors.primary} />}
        {errors[name] && <XCircle size={20} color={colors.error} />}
      </StyledView>
      {errors[name] ? (
        <StyledText className="text-body-sm text-error">{errors[name]}</StyledText>
      ) : null}
    </StyledView>
  );

  return (
    <Container isScrollable={false} withSafeAreaTop className="bg-background">
      <StyledKeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <StyledView className="flex-1 px-4 justify-center py-6">
          <StyledView className="items-center mb-6">
            <StyledView className="w-16 h-16 mb-3">
              <StyledImage
                source={require('@/assets/images/logo.png')}
                className="w-full h-full"
                resizeMode="contain"
              />
            </StyledView>
            <StyledText className="text-display font-bold text-on-surface text-center mb-1">
              {copy.setPassword.title}
            </StyledText>
            <StyledText className="text-body-lg text-on-surface-variant text-center text-pretty">
              {copy.setPassword.subtitle}
            </StyledText>
          </StyledView>

          <StyledView className="bg-surface-container-lowest rounded-[16px] border border-outline-variant p-4 gap-5">
            {field(
              copy.setPassword.codeLabel,
              'code',
              <EnvelopeSimple size={20} color={colors.outline} />,
              copy.setPassword.codePlaceholder,
              { autoCapitalize: 'none', keyboardType: 'default' }
            )}

            {/*
              The code is delivered by email only — the API never returns it,
              because it is the sole proof that the requester controls the inbox.
            */}
            <StyledView className="bg-surface-container rounded-input p-3 gap-1">
              <StyledView className="flex-row justify-between items-center">
                <StyledText className="text-body-sm font-semibold text-on-surface">
                  {copy.setPassword.codeSentTitle}
                </StyledText>
                <StyledTouchableOpacity onPress={() => setIsEditingEmail(!isEditingEmail)}>
                  <StyledText className="text-body-sm font-medium text-primary">
                    {copy.setPassword.wrongEmail}
                  </StyledText>
                </StyledTouchableOpacity>
              </StyledView>
              {isEditingEmail ? (
                <StyledView className="flex-row gap-2 items-center mt-1">
                  <StyledTextInput
                    className="flex-1 text-body-sm text-on-surface border border-outline-variant rounded-md px-2 h-8 bg-surface-container-lowest"
                    placeholder={copy.setPassword.editEmailPlaceholder}
                    placeholderTextColor={colors.outline}
                    value={email}
                    onChangeText={setEmail}
                    autoCapitalize="none"
                  />
                  <StyledTouchableOpacity
                    onPress={() => {
                      setIsEditingEmail(false);
                      void sendCode(true);
                    }}
                    className="bg-primary px-3 h-8 rounded-md justify-center"
                  >
                    <StyledText className="text-body-sm font-semibold text-on-primary">OK</StyledText>
                  </StyledTouchableOpacity>
                </StyledView>
              ) : (
                <StyledText className="text-body-sm text-on-surface-variant">
                  {interpolate(copy.setPassword.codeSentBody, { email })}
                </StyledText>
              )}
            </StyledView>

            {field(
              copy.setPassword.newPasswordLabel,
              'password',
              <Lock size={20} color={colors.outline} />,
              'At least 8 characters',
              { secureTextEntry: !showPassword }
            )}

            {field(
              copy.setPassword.confirmPasswordLabel,
              'confirm',
              <Lock size={20} color={colors.outline} />,
              'Re-enter your password',
              { secureTextEntry: !showPassword }
            )}

            <StyledView className="flex-row justify-between items-center -mt-2">
              <StyledTouchableOpacity
                onPress={() => setShowPassword((v) => !v)}
                accessibilityLabel="Toggle password visibility"
              >
                <StyledText className="text-body-sm font-medium text-primary">
                  {showPassword ? 'Hide' : 'Show'} password
                </StyledText>
              </StyledTouchableOpacity>

              <StyledView className="flex-row gap-x-4 items-center">
                <StyledTouchableOpacity 
                  onPress={handleTroubleshoot}
                  disabled={isSending}
                >
                  <StyledText className="text-body-sm font-medium text-on-surface-variant">
                    Didn't get code?
                  </StyledText>
                </StyledTouchableOpacity>

                <StyledTouchableOpacity
                  onPress={() => void sendCode(true)}
                  disabled={countdown > 0 || isSending}
                  className="flex-row items-center gap-1.5"
                >
                  {isSending ? (
                    <PaperPlaneTilt size={16} color={colors.primary} />
                  ) : null}
                  <StyledText
                    className={`text-body-sm font-medium ${
                      countdown > 0 || isSending ? 'text-on-surface-variant' : 'text-primary'
                    }`}
                  >
                    {countdown > 0
                      ? interpolate(copy.setPassword.resendIn, { seconds: countdown })
                      : copy.setPassword.resend}
                  </StyledText>
                </StyledTouchableOpacity>
              </StyledView>
            </StyledView>

            <Button
              size="lg"
              variant="primary"
              onPress={handleSubmit}
              isDisabled={isLoading}
              className="w-full"
            >
              {isLoading ? copy.setPassword.submitting : copy.setPassword.submit}
            </Button>
          </StyledView>

          <StyledView className="flex-row justify-center mt-6">
            <StyledTouchableOpacity onPress={() => router.replace('/login')}>
              <StyledText className="text-body-lg font-semibold text-primary">
                {copy.setPassword.backToLogin}
              </StyledText>
            </StyledTouchableOpacity>
          </StyledView>
        </StyledView>
      </StyledKeyboardAvoidingView>
    </Container>
  );
}