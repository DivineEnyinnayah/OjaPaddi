import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, View, Text, Image, TouchableOpacity, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { Button } from '@/components/ui/button';
import { Container } from '@/components/container';
import { useToast } from '@/components/ui/toast';
import { apiRequest } from '../../lib/api';
import { useAuthStore, type User } from '../../stores/authStore';
import { withUniwind } from 'uniwind';
import { useThemeColor } from '@/hooks/useThemeColor';
import { ILLUSTRATIONS } from '@/constants/illustrations';

const StyledView = withUniwind(View);
const StyledText = withUniwind(Text);
const StyledKeyboardAvoidingView = withUniwind(KeyboardAvoidingView);
const StyledTouchableOpacity = withUniwind(TouchableOpacity);
const StyledTextInput = withUniwind(TextInput);
const StyledImage = withUniwind(Image);

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
    if (formData[field]) return 'border-outline-variant';
    return 'border-outline-variant';
  };

  return (
    <Container isScrollable={false} withSafeAreaTop={true} className="bg-background">
      <StyledKeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <StyledView className="flex-1 px-6 justify-between">
          <StyledView className="items-center pt-4">
            <StyledView className="w-20 h-20 rounded-card bg-primary-container/20 items-center justify-center mb-6">
              <StyledImage
                source={{ uri: ILLUSTRATIONS.loginHero }}
                className="w-[56px] h-[56px]"
                resizeMode="contain"
              />
            </StyledView>
            <StyledText className="text-[28px] font-bold text-on-surface mb-2">Welcome back</StyledText>
            <StyledText className="text-body-lg text-on-surface-variant text-center">
              Enter your credentials to continue
            </StyledText>
          </StyledView>

          <StyledView className="gap-5 mt-8">
            <StyledView className="gap-1.5">
              <StyledText className="text-body-sm font-semibold text-on-surface">Email Address</StyledText>
              <StyledView
                className={`flex-row items-center border rounded-input px-3 h-12 bg-surface-container-lowest ${getInputBorderClass('email')}`}
              >
                <MaterialIcons name="person-outline" size={20} color={colors.outline} />
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
                  <MaterialIcons name="check-circle" size={20} color="#2e7d32" />
                )}
                {errors.email && (
                  <MaterialIcons name="cancel" size={20} color="#ba1a1a" />
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
                className={`flex-row items-center border rounded-input px-3 h-12 bg-surface-container-lowest ${getInputBorderClass('password')}`}
              >
                <MaterialIcons name="lock-outline" size={20} color={colors.outline} />
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
                  <MaterialIcons name="check-circle" size={20} color="#2e7d32" />
                )}
                {errors.password && (
                  <MaterialIcons name="cancel" size={20} color="#ba1a1a" />
                )}
                <StyledTouchableOpacity onPress={() => setShowPassword(!showPassword)} className="ml-1">
                  <MaterialIcons
                    name={showPassword ? 'visibility' : 'visibility-off'}
                    size={20}
                    color={colors.outline}
                  />
                </StyledTouchableOpacity>
              </StyledView>
              {errors.password && (
                <StyledText className="text-body-sm text-error">{errors.password}</StyledText>
              )}
            </StyledView>
          </StyledView>

          <StyledView className="gap-5 pb-6 mt-6">
            <Button size="lg" variant="primary" onPress={handleLogin} isDisabled={isLoading}>
              {isLoading ? 'Signing in...' : 'Sign In'}
            </Button>

            <StyledView className="flex-row items-center gap-3">
              <StyledView className="flex-1 h-px bg-outline-variant" />
              <StyledText className="text-body-sm text-on-surface-variant">Or sign in with</StyledText>
              <StyledView className="flex-1 h-px bg-outline-variant" />
            </StyledView>

            <StyledTouchableOpacity className="flex-row items-center justify-center gap-2 py-2">
              <MaterialIcons name="fingerprint" size={22} color="#005129" />
              <StyledText className="text-body-lg font-medium text-primary">Unlock with Fingerprint</StyledText>
            </StyledTouchableOpacity>

            <StyledView className="flex-row justify-center pt-1">
              <StyledText className="text-body-lg text-on-surface-variant">Don't have an account? </StyledText>
              <StyledTouchableOpacity onPress={() => router.push('/register')}>
                <StyledText className="text-body-lg font-semibold text-primary">Sign Up</StyledText>
              </StyledTouchableOpacity>
            </StyledView>
          </StyledView>
        </StyledView>
      </StyledKeyboardAvoidingView>
    </Container>
  );
}
