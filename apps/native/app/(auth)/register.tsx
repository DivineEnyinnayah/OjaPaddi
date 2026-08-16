import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, View, Text, Image, TouchableOpacity, TextInput, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Check, CheckCircle, Eye, EyeSlash, ArrowRight } from 'phosphor-react-native';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Container } from '@/components/container';
import { useToast } from '@/components/ui/toast';
import { useAuthStore } from '../../stores/authStore';
import { StyledView, StyledText, StyledImage, StyledTouchableOpacity, StyledTextInput, StyledKeyboardAvoidingView } from '@/components/ui/styled';
import { useThemeColor } from '@/hooks/useThemeColor';

interface FormErrors {
  fullName?: string;
  email?: string;
  phone?: string;
  password?: string;
}

export default function RegisterScreen() {
  const router = useRouter();
  const setPendingRegistration = useAuthStore(state => state.setPendingRegistration);
  const colors = useThemeColor();
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
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
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

  return (
    <Container isScrollable={false} withSafeAreaTop={true} className="bg-background">
      <StyledKeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 24, paddingVertical: 24 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <StyledView className="items-center mb-8">
            <StyledView className="h-16 mb-2">
              <StyledImage
                source={require('@/assets/images/logo.png')}
                className="h-full"
                resizeMode="contain"
              />
            </StyledView>
            <StyledText className="text-display font-bold text-primary mb-1">OjaPaddi</StyledText>
            <StyledText className="text-body-lg text-on-surface-variant text-center text-pretty">
              Join thousands of entrepreneurs growing their business today.
            </StyledText>
          </StyledView>

          <StyledView className="bg-surface-container-lowest rounded-[16px] border border-outline-variant p-6 gap-5">
            <StyledView className="gap-1.5">
              <StyledText className="text-body-sm font-semibold text-on-surface">Full Name</StyledText>
              <StyledView
                className={`flex-row items-center border rounded-input px-4 h-12 bg-surface-container ${errors.fullName ? 'border-error' : 'border-outline-variant'}`}
              >
                <StyledTextInput
                  className="flex-1 text-body-lg text-on-surface px-0"
                  placeholder="e.g., Tope Adeyemi"
                  placeholderTextColor={colors.outline}
                  value={formData.fullName}
                  onChangeText={(value) => updateField('fullName', value)}
                  autoCapitalize="words"
                />
                {formData.fullName && !errors.fullName && (
                  <CheckCircle size={20} color={colors.primary} />
                )}
              </StyledView>
              {formData.fullName && !errors.fullName && (
                <StyledView className="flex-row items-center gap-1 mt-1 ml-1">
                  <StyledText className="text-[11px] text-primary">Looks great!</StyledText>
                </StyledView>
              )}
              {errors.fullName && (
                <StyledText className="text-body-sm text-error">{errors.fullName}</StyledText>
              )}
            </StyledView>

            <StyledView className="gap-1.5">
              <StyledText className="text-body-sm font-semibold text-on-surface">Phone Number</StyledText>
              <StyledView
                className={`flex-row items-center border rounded-input h-12 bg-surface-container overflow-hidden ${errors.phone ? 'border-error' : 'border-outline-variant'}`}
              >
                <StyledView className="h-full px-3 border-r border-outline-variant justify-center">
                  <StyledText className="text-body-lg font-semibold text-on-surface">+234</StyledText>
                </StyledView>
                <StyledTextInput
                  className="flex-1 text-body-lg text-on-surface px-4 py-0"
                  placeholder="8012345678"
                  placeholderTextColor={colors.outline}
                  value={formData.phone}
                  onChangeText={(value) => updateField('phone', value)}
                  keyboardType="phone-pad"
                />
              </StyledView>
              {errors.phone && (
                <StyledText className="text-body-sm text-error">{errors.phone}</StyledText>
              )}
            </StyledView>

            <Input
              label="Email Address"
              placeholder="tope@gmail.com"
              value={formData.email}
              onChangeText={(value) => updateField('email', value)}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              error={errors.email}
              className="bg-surface-container rounded-input"
            />

            <StyledView className="gap-1.5">
              <StyledText className="text-body-sm font-semibold text-on-surface">Password</StyledText>
              <StyledView
                className={`flex-row items-center border rounded-input px-4 h-12 bg-surface-container ${errors.password ? 'border-error' : 'border-outline-variant'}`}
              >
                <StyledTextInput
                  className="flex-1 text-body-lg text-on-surface px-0"
                  placeholder="••••••••"
                  placeholderTextColor={colors.outline}
                  value={formData.password}
                  onChangeText={(value) => updateField('password', value)}
                  secureTextEntry={!showPassword}
                />
                <StyledTouchableOpacity onPress={() => setShowPassword(!showPassword)} className="ml-1" accessibilityLabel="Toggle password visibility">
                  {showPassword ? <Eye size={20} color={colors.outline} /> : <EyeSlash size={20} color={colors.outline} />}
                </StyledTouchableOpacity>
              </StyledView>
              {formData.password.length > 0 && (
                <StyledView className="flex-row gap-1.5 mt-2">
                  {[0, 1, 2, 3].map(index => (
                    <StyledView
                      key={index}
                      className={`flex-1 h-1.5 rounded-full ${index < passwordStrength ? 'bg-primary' : 'bg-outline-variant'}`}
                    />
                  ))}
                </StyledView>
              )}
              {errors.password && (
                <StyledText className="text-body-sm text-error">{errors.password}</StyledText>
              )}
            </StyledView>
          </StyledView>

          <StyledTouchableOpacity
            className="flex-row items-start gap-3 mt-6 mb-8"
            onPress={() => setAgreedToTerms(!agreedToTerms)}
            accessibilityLabel="Agree to terms and conditions"
          >
            <StyledView className={`w-4 h-4 rounded-[4px] border flex-row items-center justify-center mt-0.5 ${agreedToTerms ? 'bg-primary border-primary' : 'border-outline-variant bg-surface'}`}>
              {agreedToTerms && <Check size={12} color={colors.onPrimary} />}
            </StyledView>
            <StyledText className="text-body-sm text-on-surface-variant flex-1">
              I agree to the <StyledText className="text-primary font-bold">Terms of Service</StyledText> and <StyledText className="text-primary font-bold">Privacy Policy</StyledText>
            </StyledText>
          </StyledTouchableOpacity>

          <StyledView className="mt-auto gap-6 pb-10">
            <Button
              size="lg"
              variant="primary"
              onPress={handleRegister}
              isDisabled={isLoading}
              className="w-full"
            >
              <StyledView className="flex-row items-center gap-2">
                <StyledText className="text-h2 text-on-primary font-semibold">{isLoading ? 'Creating account...' : 'Create Account'}</StyledText>
                <ArrowRight size={20} color={colors.onPrimary} />
              </StyledView>
            </Button>

            <StyledView className="flex-row justify-center">
              <StyledText className="text-body-lg text-on-surface-variant">Already have an account? </StyledText>
              <StyledTouchableOpacity onPress={() => router.push('/login')}>
                <StyledText className="text-body-lg font-bold text-primary" style={{ textDecorationLine: 'underline' }}>
                  Log in
                </StyledText>
              </StyledTouchableOpacity>
            </StyledView>
          </StyledView>
        </ScrollView>
      </StyledKeyboardAvoidingView>
    </Container>
  );
}