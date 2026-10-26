import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, Easing, Platform, ScrollView, useWindowDimensions } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { Button } from '@/components/ui/button';
import { Container } from '@/components/container';
import { BottomSheet } from '@/components/ui/bottom-sheet';
import { useToast } from '@/components/ui/toast';
import {
  Storefront,
  Folder,
  CaretDown,
  Check,
  Phone,
  MapPin,
  MapTrifold,
  CameraPlus,
} from 'phosphor-react-native';
import { useThemeColor } from '@/hooks/useThemeColor';
import { apiRequest, apiFormDataRequest } from '../../lib/api';
import { useAuthStore, type User } from '../../stores/authStore';
import { StyledView, StyledText, StyledTouchableOpacity, StyledTextInput, StyledImage, StyledKeyboardAvoidingView } from '@/components/ui/styled';
import { ILLUSTRATIONS } from '@/constants/illustrations';

interface FormErrors {
  businessName?: string;
  category?: string;
  whatsappNumber?: string;
  city?: string;
  state?: string;
}

const BUSINESS_CATEGORIES = [
  { label: 'Clothing & Fashion', emoji: '👗' },
  { label: 'Food & Beverages', emoji: '🍲' },
  { label: 'Electronics', emoji: '📱' },
  { label: 'Beauty & Cosmetics', emoji: '💄' },
  { label: 'Home & Furniture', emoji: '🛋️' },
  { label: 'Pharmacy / Medical', emoji: '💊' },
  { label: 'Jewelry & Accessories', emoji: '💍' },
  { label: 'Books & Stationery', emoji: '📚' },
  { label: 'Sports & Fitness', emoji: '⚽' },
  { label: 'General Goods', emoji: '🛍️' },
  { label: 'Other', emoji: '✨' },
] as const;

const STEPS = [
  { title: 'Business Basics', subtitle: 'Tell us about your business' },
  { title: 'Location & Contact', subtitle: 'How customers reach you' },
  { title: 'Final Touch', subtitle: 'Add a logo and finish' },
] as const;

/** Window over the shared entrance driver each card fades in through. Cards overlap slightly so the motion reads as one gesture. */
const STAGGER_STEP = 0.16;
const STAGGER_SPAN = 0.55;

export default function OnboardingScreen() {
  const router = useRouter();
  const setUser = useAuthStore(state => state.setUser);
  const setPendingOnboarding = useAuthStore(state => state.setPendingOnboarding);
  const clearPendingData = useAuthStore(state => state.clearPendingData);
  const pendingRegistration = useAuthStore(state => state.pendingRegistration);
  const colors = useThemeColor();
  const toast = useToast();
  const { width: screenWidth } = useWindowDimensions();

  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    businessName: '',
    category: '',
    whatsappNumber: '',
    city: '',
    state: '',
    logoUri: '',
  });
  const [logoAsset, setLogoAsset] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);

  const slideAnim = useRef(new Animated.Value(1)).current;
  const entrance = useRef(new Animated.Value(0)).current;

  /** Cards of the active step fade + lift in sequence. */
  const playEntrance = useCallback(() => {
    entrance.setValue(0);
    Animated.timing(entrance, {
      toValue: 1,
      duration: 520,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [entrance]);

  // Play once on mount so the first step also arrives with motion.
  useEffect(() => {
    playEntrance();
  }, [playEntrance]);

  const goToStep = useCallback(
    (step: number) => {
      setShowCategoryPicker(false);
      setCurrentStep(step);
      // The pager slides while the incoming step's cards stagger in behind it.
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: step,
          duration: 320,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(entrance, {
          toValue: 1,
          duration: 520,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start();
    },
    [slideAnim, entrance],
  );

  /** Fade + lift for the nth card of the active step. */
  const stagger = useCallback(
    (index: number) => {
      const start = index * STAGGER_STEP;
      const end = Math.min(start + STAGGER_SPAN, 1);
      return {
        opacity: entrance.interpolate({
          inputRange: [start, end],
          outputRange: [0, 1],
          extrapolate: 'clamp',
        }),
        transform: [
          {
            translateY: entrance.interpolate({
              inputRange: [start, end],
              outputRange: [18, 0],
              extrapolate: 'clamp',
            }),
          },
        ],
      };
    },
    [entrance],
  );

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
        // Upload logo if one was selected
        if (logoAsset && result.data.user) {
          try {
            const fileName = logoAsset.uri.split('/').pop() || 'logo.jpg';
            const match = /\.(\w+)$/.exec(fileName);
            const type = match ? `image/${match[1]}` : 'image/jpeg';

            const logoFormData = new FormData();
            logoFormData.append('logo', {
              uri: logoAsset.uri,
              name: fileName,
              type,
            } as unknown as Blob);

            await apiFormDataRequest('/business/logo', logoFormData, 'POST');
          } catch (logoError) {
            // Logo upload failure is non-critical - user can upload later
            console.warn('Logo upload failed during onboarding:', logoError);
          }
        }

        await setUser(result.data.user, result.data.access_token, result.data.refresh_token);
        clearPendingData();
        router.replace('/');
      } else {
        toast.error(result.error?.message || 'Failed to complete business setup.', 'Setup Failed');
      }
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'Failed to set up your business. Please try again.');
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
        toast.error(result.error?.message || 'Failed to complete setup.', 'Setup Failed');
      }
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'An error occurred.');
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

  const pickLogo = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      toast.error('Please grant gallery permissions to upload a business logo.', 'Permission needed');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets.length > 0) {
      const asset = result.assets[0];
      if (asset.fileSize && asset.fileSize > 5 * 1024 * 1024) {
        toast.error('Please select an image under 5 MB.', 'Image Too Large');
        return;
      }
      setFormData(prev => ({ ...prev, logoUri: asset.uri }));
      setLogoAsset(asset);
    }
  };

  const renderStepper = () => (
    <StyledView className="mb-5">
      <StyledView className="flex-row items-center justify-between mb-3">
        <StyledText className="text-label-caps text-primary">
          Step {currentStep} of {STEPS.length}
        </StyledText>
        <StyledText className="text-label-bold text-on-surface-variant">
          {STEPS[currentStep - 1].title}
        </StyledText>
      </StyledView>

      <StyledView className="flex-row items-center">
        {STEPS.map((step, i) => {
          const n = i + 1;
          const isDone = n < currentStep;
          const isActive = n === currentStep;

          return (
            <React.Fragment key={step.title}>
              {i > 0 ? (
                <StyledView
                  className="flex-1 h-[2px] mx-2 rounded-full"
                  style={{ backgroundColor: n <= currentStep ? colors.primary : colors.outlineVariant }}
                />
              ) : null}

              <StyledView
                className={`rounded-full items-center justify-center ${
                  isActive
                    ? 'w-8 h-8 bg-primary'
                    : isDone
                      ? 'w-7 h-7 bg-primary-container'
                      : 'w-7 h-7 bg-surface-container border border-outline-variant'
                }`}
                accessible
                accessibilityLabel={`Step ${n}: ${step.title}${isDone ? ', completed' : isActive ? ', current step' : ', not started'}`}
              >
                {isDone ? (
                  <Check size={14} color={colors.primary} weight="bold" />
                ) : (
                  <StyledText className={`text-label-bold ${isActive ? 'text-on-primary' : 'text-on-surface-variant'}`}>
                    {n}
                  </StyledText>
                )}
              </StyledView>
            </React.Fragment>
          );
        })}
      </StyledView>
    </StyledView>
  );

  const StepHero = ({ illustration, caption }: { illustration: string; caption: string }) => (
    <StyledView className="items-center mb-5">
      <StyledView className="w-20 h-20 rounded-3xl bg-primary-container items-center justify-center mb-3">
        <StyledImage
          source={{ uri: illustration }}
          style={{ width: 56, height: 56 }}
          resizeMode="contain"
        />
      </StyledView>
      <StyledText className="text-body-lg text-on-surface-variant text-center text-pretty">{caption}</StyledText>
    </StyledView>
  );

  const Field = ({
    label,
    error,
    children,
  }: {
    label: string;
    error?: string;
    children: React.ReactNode;
  }) => (
    <StyledView>
      <StyledText className="text-label-bold text-on-surface font-semibold mb-2 ml-1">{label}</StyledText>
      {children}
      {error ? (
        <StyledText className="text-label-bold text-error mt-1.5 ml-1">{error}</StyledText>
      ) : null}
    </StyledView>
  );

  const renderStep1 = () => (
    <StyledView>
      <Animated.View style={stagger(0)}>
        <StepHero
          illustration={ILLUSTRATIONS.onboardingStore}
          caption="Let's set up your store in just a few steps!"
        />
      </Animated.View>

      <Animated.View style={stagger(1)}>
        <Field label="Business Name" error={errors.businessName}>
          <StyledView className="flex-row items-center rounded-input border border-outline-variant bg-surface-container-lowest px-4 h-12">
            <Storefront size={20} color={colors.outline} style={{ marginRight: 10 }} />
            <StyledTextInput
              className="flex-1 text-body-lg text-on-surface"
              placeholder="e.g., Tope's Fashion Hub"
              placeholderTextColor={colors.outline}
              value={formData.businessName}
              onChangeText={(value) => updateField('businessName', value)}
              autoCapitalize="words"
            />
          </StyledView>
        </Field>
      </Animated.View>

      <Animated.View style={[stagger(2), { marginTop: 16 }]}>
        <Field label="Business Category" error={errors.category}>
          <StyledTouchableOpacity
            className={`flex-row items-center rounded-input border px-4 h-12 ${
              formData.category ? 'border-primary bg-primary-container/40' : 'border-outline-variant bg-surface-container-lowest'
            }`}
            onPress={() => setShowCategoryPicker(true)}
            accessibilityRole="button"
            accessibilityLabel="Business category"
            accessibilityValue={{ text: formData.category || 'Not selected' }}
          >
            <Folder size={20} color={formData.category ? colors.primary : colors.outline} style={{ marginRight: 10 }} />
            <StyledText
              className={`flex-1 text-body-lg ${formData.category ? 'text-on-surface font-medium' : 'text-on-surface-variant'}`}
            >
              {formData.category || 'Select a category'}
            </StyledText>
            <CaretDown size={20} color={colors.outline} />
          </StyledTouchableOpacity>
        </Field>
      </Animated.View>
    </StyledView>
  );

  const renderStep2 = () => (
    <StyledView>
      <Animated.View style={stagger(0)}>
        <StepHero
          illustration={ILLUSTRATIONS.onboardingContact}
          caption="Customers reach you through WhatsApp. Let's set that up!"
        />
      </Animated.View>

      <Animated.View style={stagger(1)}>
        <Field label="WhatsApp Number" error={errors.whatsappNumber}>
          <StyledView className="flex-row items-center rounded-input border border-outline-variant bg-surface-container-lowest px-4 h-12">
            <Phone size={20} color={colors.outline} style={{ marginRight: 8 }} />
            <StyledText className="text-body-lg text-on-surface font-medium">+234</StyledText>
            <StyledView className="w-px h-6 bg-outline-variant ml-3 mr-3" />
            <StyledTextInput
              className="flex-1 text-body-lg text-on-surface"
              placeholder="801 234 5678"
              placeholderTextColor={colors.outline}
              value={formData.whatsappNumber}
              onChangeText={(value) => updateField('whatsappNumber', value)}
              keyboardType="phone-pad"
            />
          </StyledView>
        </Field>
      </Animated.View>

      <Animated.View style={[stagger(2), { marginTop: 16 }]}>
        <Field label="City" error={errors.city}>
          <StyledView className="flex-row items-center rounded-input border border-outline-variant bg-surface-container-lowest px-4 h-12">
            <MapPin size={20} color={colors.outline} style={{ marginRight: 10 }} />
            <StyledTextInput
              className="flex-1 text-body-lg text-on-surface"
              placeholder="e.g., Lagos"
              placeholderTextColor={colors.outline}
              value={formData.city}
              onChangeText={(value) => updateField('city', value)}
            />
          </StyledView>
        </Field>
      </Animated.View>

      <Animated.View style={[stagger(3), { marginTop: 16 }]}>
        <Field label="State" error={errors.state}>
          <StyledView className="flex-row items-center rounded-input border border-outline-variant bg-surface-container-lowest px-4 h-12">
            <MapTrifold size={20} color={colors.outline} style={{ marginRight: 10 }} />
            <StyledTextInput
              className="flex-1 text-body-lg text-on-surface"
              placeholder="e.g., Lagos"
              placeholderTextColor={colors.outline}
              value={formData.state}
              onChangeText={(value) => updateField('state', value)}
            />
          </StyledView>
        </Field>
      </Animated.View>
    </StyledView>
  );

  const renderStep3 = () => (
    <StyledView>
      <Animated.View style={stagger(0)}>
        <StepHero
          illustration={ILLUSTRATIONS.onboardingDone}
          caption="You're almost ready! Review and finish setup."
        />
      </Animated.View>

      <Animated.View style={[stagger(1), { alignItems: 'center', marginBottom: 20 }]}>
        <StyledTouchableOpacity
          className="w-24 h-24 rounded-3xl items-center justify-center border-2 border-dashed border-outline-variant bg-surface-container-lowest"
          onPress={pickLogo}
          accessibilityRole="button"
          accessibilityLabel="Add business logo"
        >
          {formData.logoUri ? (
            <StyledImage source={{ uri: formData.logoUri }} className="w-full h-full rounded-2xl" />
          ) : (
            <StyledView className="items-center">
              <CameraPlus size={28} color={colors.outline} />
              <StyledText className="text-label-bold mt-1 text-outline">Logo</StyledText>
            </StyledView>
          )}
        </StyledTouchableOpacity>
        <StyledTouchableOpacity onPress={pickLogo} hitSlop={8}>
          <StyledText className="text-body-sm text-primary font-semibold mt-3">
            {formData.logoUri ? 'Change Logo' : 'Add Logo'}
          </StyledText>
        </StyledTouchableOpacity>
      </Animated.View>

      <Animated.View style={stagger(2)}>
        <StyledView className="bg-surface-container-lowest rounded-card border border-outline-variant p-4">
          <StyledView className="flex-row items-center mb-3 pb-3 border-b border-outline-variant/30">
            <Storefront size={18} color={colors.primary} />
            <StyledText className="flex-1 text-body-lg text-on-surface font-semibold ml-3" numberOfLines={1}>
              {formData.businessName || 'Your Business'}
            </StyledText>
          </StyledView>
          <StyledView className="flex-row items-center mb-2">
            <Folder size={16} color={colors.outline} />
            <StyledText className="text-body-sm text-on-surface-variant ml-3">{formData.category || 'Not set'}</StyledText>
          </StyledView>
          <StyledView className="flex-row items-center mb-2">
            <Phone size={16} color={colors.outline} />
            <StyledText className="text-body-sm text-on-surface-variant ml-3">
              +234 {formData.whatsappNumber || 'Not set'}
            </StyledText>
          </StyledView>
          <StyledView className="flex-row items-center">
            <MapPin size={16} color={colors.outline} />
            <StyledText className="text-body-sm text-on-surface-variant ml-3">
              {formData.city || 'Not set'}
              {formData.state ? `, ${formData.state}` : ''}
            </StyledText>
          </StyledView>
        </StyledView>
      </Animated.View>
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
        keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
      >
        <StyledView className="px-6">
          {renderStepper()}

          <StyledView className="mb-6">
            <StyledText className="text-h1 font-bold text-on-surface mb-1 text-balance">
              {STEPS[currentStep - 1].title}
            </StyledText>
            <StyledText className="text-body-lg text-on-surface-variant text-pretty">
              {STEPS[currentStep - 1].subtitle}
            </StyledText>
          </StyledView>
        </StyledView>

        <Animated.View
          style={{
            transform: [
              {
                translateX: slideAnim.interpolate({
                  inputRange: [1, 2, 3],
                  outputRange: [0, -screenWidth, -screenWidth * 2],
                  extrapolate: 'clamp',
                }),
              },
            ],
            width: screenWidth * STEPS.length,
            flexDirection: 'row',
          }}
        >
          <StyledView className="px-6" style={{ width: screenWidth }}>{renderStep1()}</StyledView>
          <StyledView className="px-6" style={{ width: screenWidth }}>{renderStep2()}</StyledView>
          <StyledView className="px-6" style={{ width: screenWidth }}>{renderStep3()}</StyledView>
        </Animated.View>

        <StyledView className="mt-auto gap-3 pb-6 px-6">
          {currentStep < 3 ? (
            <StyledView className="gap-3">
              <Button size="lg" variant="primary" onPress={handleNext}>
                Continue
              </Button>
              <StyledTouchableOpacity className="items-center" onPress={handleSkip}>
                <StyledText className="text-body-lg text-on-surface-variant">Complete Later</StyledText>
              </StyledTouchableOpacity>
            </StyledView>
          ) : (
            <StyledView className="gap-3">
              <Button size="lg" variant="primary" onPress={handleComplete} isDisabled={isLoading}>
                {isLoading ? 'Setting up...' : 'Complete Setup'}
              </Button>
              <StyledTouchableOpacity className="items-center" onPress={handleBack}>
                <StyledText className="text-body-lg text-primary font-semibold">← Go Back</StyledText>
              </StyledTouchableOpacity>
            </StyledView>
          )}
        </StyledView>
      </ScrollView>
      </StyledKeyboardAvoidingView>

      <BottomSheet
        visible={showCategoryPicker}
        onClose={() => setShowCategoryPicker(false)}
        title="Business Category"
        subtitle="Pick the closest match — you can change this later."
        icon={<Folder size={20} color={colors.onPrimaryContainer} />}
        maxHeightRatio={0.72}
      >
        <StyledView className="pb-4 gap-1.5">
          {BUSINESS_CATEGORIES.map((category) => {
            const isSelected = formData.category === category.label;

            return (
              <StyledTouchableOpacity
                key={category.label}
                className={`flex-row items-center px-4 py-3 rounded-input border ${
                  isSelected
                    ? 'border-primary bg-primary-container'
                    : 'border-outline-variant bg-surface-container-lowest'
                }`}
                onPress={() => {
                  updateField('category', category.label);
                  setShowCategoryPicker(false);
                }}
                accessibilityRole="button"
                accessibilityState={{ selected: isSelected }}
              >
                <StyledText className="text-xl mr-3">{category.emoji}</StyledText>
                <StyledText
                  className={`flex-1 text-body-lg ${isSelected ? 'font-semibold text-on-primary-container' : 'text-on-surface'}`}
                >
                  {category.label}
                </StyledText>
                {isSelected ? <Check size={18} color={colors.primary} weight="bold" /> : null}
              </StyledTouchableOpacity>
            );
          })}
        </StyledView>
      </BottomSheet>
    </Container>
  );
}