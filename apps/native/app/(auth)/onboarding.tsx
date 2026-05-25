import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, Alert, View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Container } from '@/components/container';
import { Ionicons } from '@expo/vector-icons';
import { apiRequest } from '../../lib/api';
import { useAuthStore } from '../../stores/authStore';
import { withUniwind } from 'uniwind';

const StyledView = withUniwind(View);
const StyledText = withUniwind(Text);
const StyledKeyboardAvoidingView = withUniwind(KeyboardAvoidingView);
const StyledTouchableOpacity = withUniwind(TouchableOpacity);

interface FormErrors {
  businessName?: string;
  category?: string;
  whatsappNumber?: string;
  city?: string;
  state?: string;
}

const BUSINESS_CATEGORIES = [
  'Clothing & Fashion',
  'Food & Beverages',
  'Electronics',
  'Beauty & Cosmetics',
  'Home & Furniture',
  'Pharmacy/Medical',
  'Jewelry & Accessories',
  'Books & Stationery',
  'Sports & Fitness',
  'General Goods',
  'Other',
];

export default function OnboardingScreen() {
  const router = useRouter();
  const setUser = useAuthStore(state => state.setUser);
  const setPendingOnboarding = useAuthStore(state => state.setPendingOnboarding);
  const clearPendingData = useAuthStore(state => state.clearPendingData);
  const pendingRegistration = useAuthStore(state => state.pendingRegistration);
  
  const [formData, setFormData] = useState({
    businessName: '',
    category: '',
    whatsappNumber: '',
    city: '',
    state: '',
    logoUri: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);

  const validateForm = () => {
    const newErrors: FormErrors = {};
    
    if (!formData.businessName.trim()) {
      newErrors.businessName = 'Business name is required';
    }
    
    if (!formData.category) {
      newErrors.category = 'Please select a category';
    }
    
    if (!formData.whatsappNumber.trim()) {
      newErrors.whatsappNumber = 'WhatsApp number is required';
    } else if (!/^\d{10,11}$/.test(formData.whatsappNumber.replace(/\D/g, ''))) {
      newErrors.whatsappNumber = 'Enter a valid phone number';
    }
    
    if (!formData.city.trim()) {
      newErrors.city = 'City is required';
    }
    
    if (!formData.state.trim()) {
      newErrors.state = 'State is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleComplete = async () => {
    if (!validateForm()) return;
    
    setIsLoading(true);
    
    try {
      setPendingOnboarding({
        businessName: formData.businessName,
        category: formData.category,
        whatsappNumber: formData.whatsappNumber,
        city: formData.city,
        state: formData.state,
      });

      if (!pendingRegistration) {
        throw new Error('Missing registration information. Please go back and register first.');
      }

      const result = await apiRequest<{ user: any; access_token: string; refresh_token: string }>('/auth/complete-registration', {
        method: 'POST',
        body: JSON.stringify({
          registration: pendingRegistration,
          onboarding: {
            businessName: formData.businessName,
            category: formData.category,
            whatsappNumber: formData.whatsappNumber,
            city: formData.city,
            state: formData.state,
          },
        }),
      });

      if (result.success && result.data) {
        await setUser(result.data.user, result.data.access_token, result.data.refresh_token);
        clearPendingData();
        router.replace('/');
      } else {
        Alert.alert('Setup Failed', result.error?.message || 'Failed to complete business setup.');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to set up your business. Please try again.');
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
    <Container isScrollable={false} className="bg-background">
      <StyledKeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <ScrollView 
          contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 24, paddingVertical: 24 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <StyledView className="mb-8 mt-10">
            <StyledText className="text-[28px] font-bold text-on-surface mb-2 tracking-tight">Business Setup</StyledText>
            <StyledText className="text-body-lg text-on-surface-variant">Tell us about your business</StyledText>
          </StyledView>

          <StyledView className="gap-2 mb-8">
            <StyledView className="items-center mb-4">
              <StyledTouchableOpacity className="w-[100px] h-[100px] rounded-[20px] justify-center items-center border-2 border-dashed border-outline-variant bg-surface">
                <Ionicons name="camera-outline" size={32} color="#8a9389" />
              </StyledTouchableOpacity>
              <StyledText className="text-body-sm mt-2 text-outline">Upload your business logo (optional)</StyledText>
            </StyledView>

            <Input
              label="Business Name"
              placeholder="e.g., Tope's Fashion Hub"
              value={formData.businessName}
              onChangeText={(value) => updateField('businessName', value)}
              autoCapitalize="words"
              error={errors.businessName}
            />

            <StyledView className="w-full mb-4">
              <StyledText className="text-body-sm text-on-surface font-semibold mb-2 ml-1">Business Category</StyledText>
              <StyledTouchableOpacity
                className="w-full rounded-input border border-outline-variant bg-surface-container-lowest px-4 h-12 flex-row justify-between items-center"
                onPress={() => setShowCategoryPicker(!showCategoryPicker)}
              >
                <StyledText className={formData.category ? "text-body-lg text-on-surface" : "text-body-lg text-[#8a9389]"}>
                  {formData.category || 'Select a category'}
                </StyledText>
                <Ionicons name={showCategoryPicker ? 'chevron-up' : 'chevron-down'} size={20} color="#707a70" />
              </StyledTouchableOpacity>
              {showCategoryPicker && (
                <StyledView className="mt-2 rounded-xl bg-surface border border-outline-variant max-h-[200px] overflow-hidden">
                  <ScrollView nestedScrollEnabled>
                    {BUSINESS_CATEGORIES.map((category) => (
                      <StyledTouchableOpacity
                        key={category}
                        className={`px-4 py-3 border-b border-surface-variant ${formData.category === category ? 'bg-secondary-container' : ''}`}
                        onPress={() => {
                          updateField('category', category);
                          setShowCategoryPicker(false);
                        }}
                      >
                        <StyledText className={`text-body-lg text-on-surface ${formData.category === category ? 'font-semibold text-on-secondary-container' : ''}`}>
                          {category}
                        </StyledText>
                      </StyledTouchableOpacity>
                    ))}
                  </ScrollView>
                </StyledView>
              )}
              {errors.category && <StyledText className="text-body-sm text-error mt-1 ml-1">{errors.category}</StyledText>}
            </StyledView>

            <Input
              label="WhatsApp Number"
              placeholder="08012345678"
              value={formData.whatsappNumber}
              onChangeText={(value) => updateField('whatsappNumber', value)}
              keyboardType="phone-pad"
              error={errors.whatsappNumber}
            />

            <StyledView className="flex-row gap-4 w-full">
              <StyledView className="flex-1">
                <Input
                  label="City"
                  placeholder="e.g., Lagos"
                  value={formData.city}
                  onChangeText={(value) => updateField('city', value)}
                  error={errors.city}
                />
              </StyledView>
              <StyledView className="flex-1">
                <Input
                  label="State"
                  placeholder="e.g., Lagos"
                  value={formData.state}
                  onChangeText={(value) => updateField('state', value)}
                  error={errors.state}
                />
              </StyledView>
            </StyledView>
          </StyledView>

          <StyledView className="mt-auto gap-4 pb-10">
            <Button
              size="lg"
              variant="primary"
              onPress={handleComplete}
              isDisabled={isLoading}
            >
              {isLoading ? 'Setting up...' : 'Complete Setup'}
            </Button>

            <Button
              variant="secondary"
              className="border-0"
              onPress={() => router.replace('/')}
            >
              Skip for now
            </Button>
          </StyledView>
        </ScrollView>
      </StyledKeyboardAvoidingView>
    </Container>
  );
}
