import React, { useState, useRef } from 'react';
import { KeyboardAvoidingView, Platform, Alert, View, Text, TouchableOpacity, ScrollView, TextInput, Image, Animated, useWindowDimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { Button } from '@/components/ui/button';
import { Container } from '@/components/container';
import { MaterialIcons } from '@expo/vector-icons';
import { useThemeColor } from '@/hooks/useThemeColor';
import { apiRequest } from '../../lib/api';
import { useAuthStore, type User } from '../../stores/authStore';
import { withUniwind } from 'uniwind';
import { ILLUSTRATIONS } from '@/constants/illustrations';

const StyledView = withUniwind(View);
const StyledText = withUniwind(Text);
const StyledKeyboardAvoidingView = withUniwind(KeyboardAvoidingView);
const StyledTouchableOpacity = withUniwind(TouchableOpacity);
const StyledTextInput = withUniwind(TextInput);
const StyledImage = withUniwind(Image);
const StyledScrollView = withUniwind(ScrollView);

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

const STEPS = [
  { title: 'Business Basics', subtitle: 'Tell us about your business' },
  { title: 'Location & Contact', subtitle: 'How customers reach you' },
  { title: 'Final Touch', subtitle: 'Add a logo and finish' },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const setUser = useAuthStore(state => state.setUser);
  const setPendingOnboarding = useAuthStore(state => state.setPendingOnboarding);
  const clearPendingData = useAuthStore(state => state.clearPendingData);
  const pendingRegistration = useAuthStore(state => state.pendingRegistration);
  const colors = useThemeColor();
  const { width: screenWidth } = useWindowDimensions();
  const stepWidth = screenWidth; // Dynamic viewport screen width

  const [currentStep, setCurrentStep] = useState(1);
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

  const slideAnim = useRef(new Animated.Value(1)).current;

  const animateToStep = (step: number) => {
    Animated.timing(slideAnim, {
      toValue: step,
      duration: 250,
      useNativeDriver: true,
    }).start();
  };

  const goToStep = (step: number) => {
    setShowCategoryPicker(false);
    setCurrentStep(step);
    animateToStep(step);
  };

  const validateStep = (step: number) => {
    const newErrors: FormErrors = {};

    if (step === 1) {
      if (!formData.businessName.trim()) {
        newErrors.businessName = 'Business name is required';
      }
      if (!formData.category) {
        newErrors.category = 'Please select a category';
      }
    }

    if (step === 2) {
      if (!formData.whatsappNumber.trim()) {
        newErrors.whatsappNumber = 'WhatsApp number is required';
      } else if (!/^\d{10,15}$/.test(formData.whatsappNumber.replace(/\D/g, ''))) {
        newErrors.whatsappNumber = 'Enter a valid phone number';
      }
      if (!formData.city.trim()) {
        newErrors.city = 'City is required';
      }
      if (!formData.state.trim()) {
        newErrors.state = 'State is required';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      goToStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      goToStep(currentStep - 1);
    }
  };

  const handleComplete = async () => {
    if (!validateStep(currentStep)) return;

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

      const result = await apiRequest<{ user: User; access_token: string; refresh_token: string }>('/auth/complete-registration', {
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
    } catch (error: unknown) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to set up your business. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSkip = async () => {
    if (!pendingRegistration) {
      clearPendingData();
      router.replace('/welcome');
      return;
    }

    setIsLoading(true);
    try {
      const result = await apiRequest<{ user: User; access_token: string; refresh_token: string }>('/auth/complete-registration', {
        method: 'POST',
        body: JSON.stringify({
          registration: pendingRegistration,
        }),
      });

      if (result.success && result.data) {
        await setUser(result.data.user, result.data.access_token, result.data.refresh_token);
        clearPendingData();
        router.replace('/');
      } else {
        Alert.alert('Setup Failed', result.error?.message || 'Failed to complete setup.');
      }
    } catch (error: unknown) {
      Alert.alert('Error', error instanceof Error ? error.message : 'An error occurred.');
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

  const renderStepIndicator = () => (
    <StyledView className="flex-row items-center justify-center gap-2 mb-6 mt-6">
      {[1, 2, 3].map((step) => (
        <StyledView
          key={step}
          className={`h-2 rounded-full ${step === currentStep ? 'w-8 bg-primary' : step < currentStep ? 'w-2 bg-primary/50' : 'w-2 bg-outline-variant'}`}
        />
      ))}
    </StyledView>
  );

  const renderStep1 = () => (
    <StyledView>
      <StyledView className="items-center mb-6">
        <StyledView className="w-16 h-16 rounded-full bg-primary/10 items-center justify-center mb-4">
          <Image source={{ uri: ILLUSTRATIONS.onboardingStore }} style={{ width: 40, height: 40 }} resizeMode="contain" />
        </StyledView>
        <StyledText className="text-[16px] text-on-surface-variant text-center">Let's set up your store in just a few steps!</StyledText>
      </StyledView>

      <StyledView className="w-full mb-4">
        <StyledText className="text-body-sm text-on-surface font-semibold mb-2 ml-1">Business Name</StyledText>
        <StyledView className="flex-row items-center rounded-input border border-outline-variant bg-surface-container-lowest px-4 h-12">
          <MaterialIcons name="storefront" size={20} color={colors.outline} style={{ marginRight: 10 }} />
          <StyledTextInput
            className="flex-1 text-body-lg text-on-surface"
            placeholder="e.g., Tope's Fashion Hub"
            placeholderTextColor={colors.outline}
            value={formData.businessName}
            onChangeText={(value) => updateField('businessName', value)}
            autoCapitalize="words"
          />
        </StyledView>
        {errors.businessName && <StyledText className="text-body-sm text-error mt-1 ml-1">{errors.businessName}</StyledText>}
      </StyledView>

      <StyledView className="w-full mb-4">
        <StyledText className="text-body-sm text-on-surface font-semibold mb-2 ml-1">Business Category</StyledText>
        <StyledTouchableOpacity
          className="flex-row items-center rounded-input border border-outline-variant bg-surface-container-lowest px-4 h-12"
          onPress={() => setShowCategoryPicker(!showCategoryPicker)}
        >
          <MaterialIcons name="category" size={20} color={colors.outline} style={{ marginRight: 10 }} />
          <StyledText className={`flex-1 text-body-lg ${formData.category ? 'text-on-surface' : 'text-on-surface-variant'}`}>
            {formData.category || 'Select a category'}
          </StyledText>
          <MaterialIcons name={showCategoryPicker ? 'keyboard-arrow-up' : 'keyboard-arrow-down'} size={20} color={colors.outline} />
        </StyledTouchableOpacity>
        {showCategoryPicker && (
          <StyledView className="mt-2 rounded-xl bg-surface border border-outline-variant max-h-[220px] overflow-hidden">
            <ScrollView nestedScrollEnabled>
              {BUSINESS_CATEGORIES.map((category) => (
                <StyledTouchableOpacity
                  key={category}
                  className={`flex-row items-center px-4 py-3.5 border-b border-outline-variant ${formData.category === category ? 'bg-secondary-container' : ''}`}
                  onPress={() => {
                    updateField('category', category);
                    setShowCategoryPicker(false);
                  }}
                >
                  <MaterialIcons name="category" size={18} color={formData.category === category ? '#1A6B3C' : colors.outline} style={{ marginRight: 10 }} />
                  <StyledText className={`flex-1 text-body-lg ${formData.category === category ? 'font-semibold text-primary' : ''}`}>
                    {category}
                  </StyledText>
                  {formData.category === category && (
                    <MaterialIcons name="check" size={18} color="#1A6B3C" />
                  )}
                </StyledTouchableOpacity>
              ))}
            </ScrollView>
          </StyledView>
        )}
        {errors.category && <StyledText className="text-body-sm text-error mt-1 ml-1">{errors.category}</StyledText>}
      </StyledView>
    </StyledView>
  );

  const renderStep2 = () => (
    <StyledView>
      <StyledView className="items-center mb-6">
        <StyledView className="w-16 h-16 rounded-full bg-primary/10 items-center justify-center mb-4">
          <Image source={{ uri: ILLUSTRATIONS.onboardingContact }} style={{ width: 40, height: 40 }} resizeMode="contain" />
        </StyledView>
        <StyledText className="text-[16px] text-on-surface-variant text-center">Customers reach you through WhatsApp. Let's set that up!</StyledText>
      </StyledView>

      <StyledView className="w-full mb-4">
        <StyledText className="text-body-sm text-on-surface font-semibold mb-2 ml-1">WhatsApp Number</StyledText>
        <StyledView className="flex-row items-center rounded-input border border-outline-variant bg-surface-container-lowest px-4 h-12">
          <MaterialIcons name="phone" size={20} color={colors.outline} style={{ marginRight: 8 }} />
          <StyledView className="flex-row items-center pr-3 mr-3">
            <StyledText className="text-body-lg text-on-surface font-medium">+234</StyledText>
          </StyledView>
          <StyledView className="w-px h-6 bg-outline-variant mr-3" />
          <StyledTextInput
            className="flex-1 text-body-lg text-on-surface"
            placeholder="801 234 5678"
            placeholderTextColor={colors.outline}
            value={formData.whatsappNumber}
            onChangeText={(value) => updateField('whatsappNumber', value)}
            keyboardType="phone-pad"
          />
        </StyledView>
        {errors.whatsappNumber && <StyledText className="text-body-sm text-error mt-1 ml-1">{errors.whatsappNumber}</StyledText>}
      </StyledView>

      <StyledView className="w-full mb-4">
        <StyledText className="text-body-sm text-on-surface font-semibold mb-2 ml-1">City</StyledText>
        <StyledView className="flex-row items-center rounded-input border border-outline-variant bg-surface-container-lowest px-4 h-12">
          <MaterialIcons name="location-on" size={20} color={colors.outline} style={{ marginRight: 10 }} />
          <StyledTextInput
            className="flex-1 text-body-lg text-on-surface"
            placeholder="e.g., Lagos"
            placeholderTextColor={colors.outline}
            value={formData.city}
            onChangeText={(value) => updateField('city', value)}
          />
        </StyledView>
        {errors.city && <StyledText className="text-body-sm text-error mt-1 ml-1">{errors.city}</StyledText>}
      </StyledView>

      <StyledView className="w-full mb-4">
        <StyledText className="text-body-sm text-on-surface font-semibold mb-2 ml-1">State</StyledText>
        <StyledView className="flex-row items-center rounded-input border border-outline-variant bg-surface-container-lowest px-4 h-12">
          <MaterialIcons name="map" size={20} color={colors.outline} style={{ marginRight: 10 }} />
          <StyledTextInput
            className="flex-1 text-body-lg text-on-surface"
            placeholder="e.g., Lagos"
            placeholderTextColor={colors.outline}
            value={formData.state}
            onChangeText={(value) => updateField('state', value)}
          />
        </StyledView>
        {errors.state && <StyledText className="text-body-sm text-error mt-1 ml-1">{errors.state}</StyledText>}
      </StyledView>
    </StyledView>
  );

  const renderStep3 = () => (
    <StyledView>
      <StyledView className="items-center mb-6">
        <StyledView className="w-16 h-16 rounded-full bg-primary/10 items-center justify-center mb-4">
          <Image source={{ uri: ILLUSTRATIONS.onboardingDone }} style={{ width: 40, height: 40 }} resizeMode="contain" />
        </StyledView>
        <StyledText className="text-[16px] text-on-surface-variant text-center">You're almost ready! Review and finish setup.</StyledText>
      </StyledView>

      <StyledView className="items-center mb-6">
        <StyledTouchableOpacity
          className="w-[100px] h-[100px] rounded-[20px] justify-center items-center border-2 border-dashed border-outline-variant bg-surface"
          onPress={() => Alert.alert('Coming Soon', 'Logo upload will be available soon.')}
        >
          {formData.logoUri ? (
            <StyledImage source={{ uri: formData.logoUri }} className="w-full h-full rounded-[18px]" />
          ) : (
            <StyledView className="items-center">
              <MaterialIcons name="add-a-photo" size={28} color={colors.outline} />
              <StyledText className="text-body-sm mt-1 text-outline">Logo</StyledText>
            </StyledView>
          )}
        </StyledTouchableOpacity>
      </StyledView>

      <StyledView className="bg-surface-container-lowest rounded-xl border border-outline-variant p-4 mb-4">
        <StyledView className="flex-row items-center mb-3 pb-3 border-b border-outline-variant/30">
          <MaterialIcons name="storefront" size={18} color={colors.primary} />
          <StyledText className="flex-1 text-body-lg text-on-surface font-semibold ml-3">{formData.businessName || 'Your Business'}</StyledText>
        </StyledView>
        <StyledView className="flex-row items-center mb-2">
          <MaterialIcons name="category" size={16} color={colors.outline} />
          <StyledText className="text-body-sm text-on-surface-variant ml-3">{formData.category || 'Not set'}</StyledText>
        </StyledView>
        <StyledView className="flex-row items-center mb-2">
          <MaterialIcons name="phone" size={16} color={colors.outline} />
          <StyledText className="text-body-sm text-on-surface-variant ml-3">+234 {formData.whatsappNumber || 'Not set'}</StyledText>
        </StyledView>
        <StyledView className="flex-row items-center">
          <MaterialIcons name="location-on" size={16} color={colors.outline} />
          <StyledText className="text-body-sm text-on-surface-variant ml-3">{formData.city || 'Not set'}{formData.state ? `, ${formData.state}` : ''}</StyledText>
        </StyledView>
      </StyledView>
    </StyledView>
  );

  return (
    <Container isScrollable={false} withSafeAreaTop={true} className="bg-background">
      <StyledKeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, paddingVertical: 24 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <StyledView className="px-6">
            {renderStepIndicator()}

            <StyledView className="mb-6">
              <StyledText className="text-[28px] font-bold text-on-surface mb-1">{STEPS[currentStep - 1].title}</StyledText>
              <StyledText className="text-body-lg text-on-surface-variant">{STEPS[currentStep - 1].subtitle}</StyledText>
            </StyledView>
          </StyledView>

          <Animated.View style={{ transform: [{ translateX: slideAnim.interpolate({ inputRange: [1, 2, 3], outputRange: [0, -stepWidth, -stepWidth * 2], extrapolate: 'clamp' }) }] }}>
            <StyledView className="flex-row" style={{ width: stepWidth * 3 }}>
              <StyledView style={{ width: stepWidth }} className="px-6">{renderStep1()}</StyledView>
              <StyledView style={{ width: stepWidth }} className="px-6">{renderStep2()}</StyledView>
              <StyledView style={{ width: stepWidth }} className="px-6">{renderStep3()}</StyledView>
            </StyledView>
          </Animated.View>

          <StyledView className="mt-auto gap-3 pb-10 px-6">
            {currentStep < 3 ? (
              <StyledView className="gap-3">
                <Button size="lg" variant="primary" onPress={handleNext}>
                  Continue
                </Button>
                <StyledTouchableOpacity className="items-center" onPress={handleSkip}>
                  <StyledText className="text-body-lg text-on-surface-variant">Skip for now</StyledText>
                </StyledTouchableOpacity>
              </StyledView>
            ) : (
              <StyledView className="gap-3">
                <Button size="lg" variant="primary" onPress={handleComplete} isDisabled={isLoading}>
                  {isLoading ? 'Setting up...' : 'Complete Setup'}
                </Button>
                <StyledTouchableOpacity className="items-center" onPress={handleBack}>
                  <StyledText className="text-body-lg text-primary font-semibold">Back</StyledText>
                </StyledTouchableOpacity>
              </StyledView>
            )}
          </StyledView>
        </ScrollView>
      </StyledKeyboardAvoidingView>
      {currentStep > 1 && (
        <StyledTouchableOpacity
          className="absolute top-12 left-4 w-10 h-10 items-center justify-center rounded-full bg-surface-container z-50"
          onPress={handleBack}
        >
          <MaterialIcons name="arrow-back" size={24} color={colors.onSurface} />
        </StyledTouchableOpacity>
      )}
    </Container>
  );
}
