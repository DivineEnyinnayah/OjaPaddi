import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, View, Text, Image, TouchableOpacity, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { EnvelopeSimple, CheckCircle, XCircle, Lock, Eye, EyeSlash, Fingerprint, QrCode } from 'phosphor-react-native';
import { Button } from '@/components/ui/button';
import { Container } from '@/components/container';
import { useToast } from '@/components/ui/toast';
import { apiRequest } from '../../lib/api';
import { useAuthStore, type User } from '../../stores/authStore';
import { StyledView, StyledText, StyledTouchableOpacity, StyledTextInput, StyledImage, StyledKeyboardAvoidingView } from '@/components/ui/styled';
import { useThemeColor } from '@/hooks/useThemeColor';

interface FormErrors {
  email?: string;
  password?: string;
}

export default function LoginScreen() {
  const router = useRouter();
  const setUser = useAuthStore(state => state.setUser);
  const colors = useThemeColor();
  const toast = useToast();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [focusedField, setFocusedField] = useState<'email' | 'password' | null>(null);

  const validateForm = () => {
    const newErrors: FormErrors = {};
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Enter a valid email address';
    }
    if (!formData.password) {
      newErrors.password = 'Password is required';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    if (!validateForm()) return;
    setIsLoading(true);
    try {
      const result = await apiRequest<{ user: User; access_token: string; refresh_token: string }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify(formData),
      });
      if (result.success && result.data) {
        await setUser(result.data.user, result.data.access_token, result.data.refresh_token);
        router.replace('/');
      } else {
        toast.error(result.error?.message || 'An error occurred', 'Login Failed');
      }
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!formData.email.trim()) {
      toast.error('Please enter your email address first.', 'Email Required');
      return;
    }
    setIsLoading(true);
    try {
      const result = await apiRequest('/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email: formData.email }),
      });
      if (result.success) {
        toast.success('If an account exists with that email, we\'ve sent a password reset link.', 'Check Your Email');
      } else {
        toast.error(result.error?.message || 'Failed to send reset email.');
      }
    } catch {
      toast.error('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const updateField = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const getInputBorderClass = (field: 'email' | 'password') => {
    if (errors[field]) return 'border-error';
    if (focusedField === field) return 'border-primary';
    return 'border-outline-variant';
  };

  return (
    <Container isScrollable={false} withSafeAreaTop={true} className="bg-background">
      <StyledKeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <StyledView className="flex-1 px-4 justify-between">
          <StyledView className="items-center pt-2">
            <StyledView className="w-20 h-20 mb-2">
              <StyledImage
                source={require('@/assets/images/logo.png')}
                className="w-full h-full"
                resizeMode="contain"
              />
            </StyledView>
            <StyledText className="text-h1 font-bold text-primary">OjaPaddi</StyledText>
          </StyledView>

          <StyledView className="mt-8">
            <StyledView className="items-center mb-6">
              <StyledText className="text-display font-bold text-on-surface mb-1 text-balance">Welcome Back</StyledText>
              <StyledText className="text-body-lg text-on-surface-variant text-center text-pretty">
                Sign in to manage your shop and sales.
              </StyledText>
            </StyledView>

            <StyledView className="bg-surface-container-lowest rounded-[16px] border border-outline-variant p-4 gap-5">
              <StyledView className="gap-1.5">
                <StyledText className="text-body-sm font-semibold text-on-surface">Email Address</StyledText>
                <StyledView
                  className={`flex-row items-center border rounded-input px-4 h-12 bg-surface-container-lowest ${getInputBorderClass('email')}`}
                >
                  <EnvelopeSimple size={20} color={colors.outline} />
                  <StyledTextInput
                    className="flex-1 text-body-lg text-on-surface ml-3 px-0"
                    placeholder="your@email.com"
                    placeholderTextColor={colors.outline}
                    value={formData.email}
                    onChangeText={(value) => updateField('email', value)}
                    onFocus={() => setFocusedField('email')}
                    onBlur={() => setFocusedField(null)}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                  {formData.email && !errors.email && (
                    <CheckCircle size={20} color={colors.primary} />
                  )}
                  {errors.email && (
                    <XCircle size={20} color={colors.error} />
                  )}
                </StyledView>
                {errors.email && (
                  <StyledText className="text-body-sm text-error">{errors.email}</StyledText>
                )}
              </StyledView>

              <StyledView className="gap-1.5">
                <StyledView className="flex-row justify-between items-center">
                  <StyledText className="text-body-sm font-semibold text-on-surface">Password</StyledText>
                  <StyledTouchableOpacity onPress={handleForgotPassword}>
                    <StyledText className="text-body-sm font-medium text-primary">Forgot password?</StyledText>
                  </StyledTouchableOpacity>
                </StyledView>
                <StyledView
                  className={`flex-row items-center border rounded-input px-4 h-12 bg-surface-container-lowest ${getInputBorderClass('password')}`}
                >
                  <Lock size={20} color={colors.outline} />
                  <StyledTextInput
                    className="flex-1 text-body-lg text-on-surface ml-3 px-0"
                    placeholder="Enter your password"
                    placeholderTextColor={colors.outline}
                    value={formData.password}
                    onChangeText={(value) => updateField('password', value)}
                    onFocus={() => setFocusedField('password')}
                    onBlur={() => setFocusedField(null)}
                    secureTextEntry={!showPassword}
                  />
                  {formData.password && !errors.password && (
                    <CheckCircle size={20} color={colors.primary} />
                  )}
                  {errors.password && (
                    <XCircle size={20} color={colors.error} />
                  )}
                  <StyledTouchableOpacity onPress={() => setShowPassword(!showPassword)} className="ml-1" accessibilityLabel="Toggle password visibility">
                    {showPassword ? <Eye size={20} color={colors.outline} /> : <EyeSlash size={20} color={colors.outline} />}
                  </StyledTouchableOpacity>
                </StyledView>
                {errors.password && (
                  <StyledText className="text-body-sm text-error">{errors.password}</StyledText>
                )}
              </StyledView>

              <Button size="lg" variant="primary" onPress={handleLogin} isDisabled={isLoading} className="w-full">
                {isLoading ? 'Signing in...' : 'Sign In'}
              </Button>
            </StyledView>

            <StyledView className="flex-row items-center gap-3 my-6">
              <StyledView className="flex-1 h-px bg-outline-variant" />
              <StyledText className="text-label-caps text-on-surface-variant">Or secure access</StyledText>
              <StyledView className="flex-1 h-px bg-outline-variant" />
            </StyledView>

            <StyledView className="flex-row gap-4">
              <StyledView className="flex-1 h-12 flex-row items-center justify-center gap-2 border border-outline rounded-input bg-surface-container-lowest">
                <Fingerprint size={20} color={colors.primary} />
                <StyledText className="text-label-bold text-on-surface">Biometric</StyledText>
              </StyledView>
              <StyledView className="flex-1 h-12 flex-row items-center justify-center gap-2 border border-outline rounded-input bg-surface-container-lowest">
                <QrCode size={20} color={colors.primary} />
                <StyledText className="text-label-bold text-on-surface">QR Code</StyledText>
              </StyledView>
            </StyledView>
          </StyledView>

          <StyledView className="flex-row justify-center pb-6 mt-6">
            <StyledText className="text-body-lg text-on-surface-variant">New to OjaPaddi? </StyledText>
            <StyledTouchableOpacity onPress={() => router.push('/register')}>
              <StyledText className="text-body-lg font-semibold text-primary">Create Account</StyledText>
            </StyledTouchableOpacity>
          </StyledView>
        </StyledView>
      </StyledKeyboardAvoidingView>
    </Container>
  );
}