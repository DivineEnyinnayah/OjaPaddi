import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Container } from '@/components/container';
import { useToast } from '@/components/ui/toast';
import { useAuthStore } from '../../stores/authStore';
import { withUniwind } from 'uniwind';
import { MaterialIcons } from '@expo/vector-icons';

const StyledView = withUniwind(View);
const StyledText = withUniwind(Text);
const StyledKeyboardAvoidingView = withUniwind(KeyboardAvoidingView);
const StyledTouchableOpacity = withUniwind(TouchableOpacity);

interface FormErrors {
  fullName?: string;
  email?: string;
  phone?: string;
  password?: string;
}

export default function RegisterScreen() {
  const router = useRouter();
  const setPendingRegistration = useAuthStore(state => state.setPendingRegistration);
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
          <StyledView className="mb-8 mt-4">
            <StyledText className="text-[28px] font-bold text-on-surface mb-2 tracking-tight">Create Account</StyledText>
            <StyledText className="text-body-lg text-on-surface-variant">Join OjaPaddi and start growing your business</StyledText>
          </StyledView>

          <StyledView className="gap-4 mt-2">
            <Input
              label="Full Name"
              placeholder="e.g., Tope Adeyemi"
              value={formData.fullName}
              onChangeText={(value) => updateField('fullName', value)}
              autoCapitalize="words"
              error={errors.fullName}
            />

            <Input
              label="Email Address"
              placeholder="tope@gmail.com"
              value={formData.email}
              onChangeText={(value) => updateField('email', value)}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              error={errors.email}
            />

            <Input
              label="Phone Number"
              placeholder="08012345678"
              value={formData.phone}
              onChangeText={(value) => updateField('phone', value)}
              keyboardType="phone-pad"
              error={errors.phone}
            />

            <Input
              label="Password"
              placeholder="••••••••"
              value={formData.password}
              onChangeText={(value) => updateField('password', value)}
              secureTextEntry
              error={errors.password}
            />
          </StyledView>

          <StyledTouchableOpacity 
            className="flex-row items-center gap-3 mt-6 mb-8" 
            onPress={() => setAgreedToTerms(!agreedToTerms)}
          >
            <StyledView className={`w-6 h-6 rounded-md border flex-row items-center justify-center ${agreedToTerms ? 'bg-primary border-primary' : 'border-outline-variant bg-surface'}`}>
              {agreedToTerms && <MaterialIcons name="check" size={16} color="#FFFFFF" />}
            </StyledView>
            <StyledText className="text-body-sm text-on-surface-variant flex-1">
              I agree to the <StyledText className="text-primary font-semibold">Terms of Service</StyledText> and <StyledText className="text-primary font-semibold">Privacy Policy</StyledText>
            </StyledText>
          </StyledTouchableOpacity>

          <StyledView className="mt-auto gap-6 pb-10">
            <Button
              size="lg"
              variant="primary"
              onPress={handleRegister}
              isDisabled={isLoading}
            >
              {isLoading ? 'Creating account...' : 'Next'}
            </Button>

            <Button
              variant="secondary"
              className="border-0"
              onPress={() => router.push('/login')}
            >
              Already have an account? Sign In
            </Button>
          </StyledView>
        </ScrollView>
      </StyledKeyboardAvoidingView>
    </Container>
  );
}
