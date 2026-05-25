import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, Alert, View, Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Container } from '@/components/container';
import { apiRequest } from '../../lib/api';
import { useAuthStore } from '../../stores/authStore';
import { withUniwind } from 'uniwind';

const StyledView = withUniwind(View);
const StyledText = withUniwind(Text);
const StyledKeyboardAvoidingView = withUniwind(KeyboardAvoidingView);

interface FormErrors {
  email?: string;
  password?: string;
}

export default function LoginScreen() {
  const router = useRouter();
  const setUser = useAuthStore(state => state.setUser);
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(false);

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
      const result = await apiRequest<{ user: any; access_token: string; refresh_token: string }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify(formData),
      });

      if (result.success && result.data) {
        await setUser(result.data.user, result.data.access_token, result.data.refresh_token);
        router.replace('/');
      } else {
        Alert.alert('Login Failed', result.error?.message || 'An error occurred');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'An error occurred');
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

  return (
    <Container isScrollable={false} className="bg-background">
      <StyledKeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <StyledView className="flex-1 px-4 py-6 justify-between">
          <StyledView className="mb-8 mt-10">
            <StyledText className="text-[28px] font-bold text-on-surface mb-2 tracking-tight">Welcome Back</StyledText>
            <StyledText className="text-body-lg text-on-surface-variant">Sign in to continue managing your business</StyledText>
          </StyledView>

          <StyledView className="gap-2 mt-2">
            <Input
              label="Email Address"
              placeholder="your@email.com"
              value={formData.email}
              onChangeText={(value) => updateField('email', value)}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              error={errors.email}
            />

            <StyledView className="relative">
              <StyledView className="flex-row justify-between items-center z-10 absolute right-1 top-0">
                <TouchableOpacity>
                  <StyledText className="text-body-sm font-medium text-primary">Forgot password?</StyledText>
                </TouchableOpacity>
              </StyledView>
              <Input
                label="Password"
                placeholder="Enter your password"
                value={formData.password}
                onChangeText={(value) => updateField('password', value)}
                secureTextEntry
                error={errors.password}
              />
            </StyledView>
          </StyledView>

          <StyledView className="mt-8 gap-6 pb-10">
            <Button
              size="lg"
              variant="primary"
              onPress={handleLogin}
              isDisabled={isLoading}
            >
              {isLoading ? 'Signing in...' : 'Sign In'}
            </Button>

            <Button
              variant="secondary"
              className="border-0"
              onPress={() => router.push('/register')}
            >
              New to OjaPaddi? Create Account
            </Button>
          </StyledView>
        </StyledView>
      </StyledKeyboardAvoidingView>
    </Container>
  );
}
