import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, Easing, Platform, useWindowDimensions } from 'react-native';
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
import {
  StyledView,
  StyledText,
  StyledTouchableOpacity,
  StyledTextInput,
  StyledImage,
  StyledKeyboardAvoidingView,
  StyledScrollView,
} from '@/components/ui/styled';
import { colorTokens } from '@/constants/tokens';

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

/** Chips shown inline on step 1 — a quick pick over the full sheet list. */
const QUICK_CATEGORIES = ['Clothing & Fashion', 'Food & Beverages', 'Beauty & Cosmetics', 'Other'] as const;

const STEPS = [
  { title: 'Business Basics', subtitle: 'Tell us about your business' },
  { title: 'Location & Contact', subtitle: 'How customers reach you' },
  { title: 'Final Touch', subtitle: 'Add a logo and finish' },
] as const;

/** Window over the shared entrance driver each card fades in through. Cards overlap slightly so the motion reads as one gesture. */
const STAGGER_STEP = 0.16;
const STAGGER_SPAN = 0.55;

/**
 * Onboarding wizard — FigCraft `02.5 — First product` (frame 530) drives the
 * visual language: amber eyebrow, display title, 3 step dots + `STEP n OF 3`,
 * 54px field boxes, chip rows, 342×160 photo panel and a brand CTA.
 *
 * The screen's own flow (Business Basics → Location & Contact → Final Touch),
 * validation, store hand-off, slideshow animation, category sheet, logo upload
 * and skip logic are all preserved unchanged.
 */
export default function OnboardingScreen() {
  const router = useRouter();
  const setUser = useAuthStore((state) => state.setUser);
  const setPendingOnboarding = useAuthStore((state) => state.setPendingOnboarding);
  const clearPendingData = useAuthStore((state) => state.clearPendingData);
  const pendingRegistration = useAuthStore((state) => state.pendingRegistration);
  const colors = useThemeColor();
  const C = colorTokens;
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

      const result = await apiRequest<{ user: User; access_token: string; refresh_token: string }>(
        '/auth/complete-registration',
        {
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
        },
      );

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
      const result = await apiRequest<{ user: User; access_token: string; refresh_token: string }>(
        '/auth/complete-registration',
        {
          method: 'POST',
          body: JSON.stringify({
            registration: pendingRegistration,
          }),
        },
      );

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
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
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
      setFormData((prev) => ({ ...prev, logoUri: asset.uri }));
      setLogoAsset(asset);
    }
  };

  /** FigCraft 530 progress: three dots, the active one brand coloured. */
  const renderStepper = () => (
    <StyledView className="mb-6">
      <StyledView className="flex-row items-center gap-1.5">
        {STEPS.map((step, i) => {
          const n = i + 1;
          const isReached = n <= currentStep;
          return (
            <StyledView
              key={step.title}
              className="h-2.5 w-2.5 rounded-pill"
              style={{ backgroundColor: isReached ? C.brand.light : C.border.light }}
              accessible
              accessibilityLabel={`Step ${n}: ${step.title}${isReached ? ', current or completed' : ', not started'}`}
            />
          );
        })}
      </StyledView>

      <StyledText
        className="mt-2 font-label uppercase tracking-[1.5px]"
        style={{ fontSize: 9, color: colors.muted }}
      >
        STEP {currentStep} OF {STEPS.length}
      </StyledText>
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
      <StyledText className="font-label uppercase tracking-[1.5px]" style={{ fontSize: 9, color: colors.muted }}>
        {label}
      </StyledText>
      <StyledView className="mt-2">{children}</StyledView>
      {error ? (
        <StyledText className="mt-1.5 ml-1 font-body text-micro text-danger" accessibilityRole="alert">
          {error}
        </StyledText>
      ) : null}
    </StyledView>
  );

  const inputBox = (focused: boolean) =>
    `h-[54px] flex-row items-center rounded-input border bg-card px-4 ${focused ? 'border-brand' : 'border-border'}`;

  const renderStep1 = () => (
    <StyledView>
      <Animated.View style={stagger(0)}>
        <Field label="BUSINESS NAME" error={errors.businessName}>
          <StyledView className="h-[54px] flex-row items-center rounded-input border border-border bg-card px-4">
            <Storefront size={20} color={colors.muted} style={{ marginRight: 10 }} />
            <StyledTextInput
              className="flex-1 px-0 font-body text-body text-ink"
              placeholder="e.g., Tope's Fashion Hub"
              placeholderTextColor={colors.muted}
              value={formData.businessName}
              onChangeText={(value) => updateField('businessName', value)}
              autoCapitalize="words"
              accessibilityLabel="Business name"
            />
          </StyledView>
        </Field>
      </Animated.View>

      <Animated.View style={[stagger(1), { marginTop: 16 }]}>
        <Field label="CATEGORY" error={errors.category}>
          <StyledView className="flex-row flex-wrap gap-2">
            {QUICK_CATEGORIES.map((cat) => {
              const isActive = formData.category === cat;
              return (
                <StyledTouchableOpacity
                  key={cat}
                  onPress={() => updateField('category', cat)}
                  className={`h-9 justify-center rounded-pill border px-4 ${
                    isActive ? 'border-brand bg-brand' : 'border-border bg-card'
                  }`}
                  accessibilityRole="button"
                  accessibilityState={{ selected: isActive }}
                  accessibilityLabel={cat}
                >
                  <StyledText
                    className="font-label"
                    style={{ fontSize: 12, color: isActive ? colors.card : colors.ink }}
                  >
                    {cat}
                  </StyledText>
                </StyledTouchableOpacity>
              );
            })}
          </StyledView>

          {/* Full list picker — carries the same value as the chips. */}
          <StyledTouchableOpacity
            className={`mt-3 h-[54px] flex-row items-center rounded-input border px-4 ${
              formData.category ? 'border-brand bg-card' : 'border-border bg-card'
            }`}
            onPress={() => setShowCategoryPicker(true)}
            accessibilityRole="button"
            accessibilityLabel="Choose another category"
            accessibilityValue={{ text: formData.category || 'Not selected' }}
          >
            <Folder size={20} color={formData.category ? colors.brand : colors.muted} style={{ marginRight: 10 }} />
            <StyledText className="flex-1 font-body text-body text-ink" numberOfLines={1}>
              {formData.category || 'Choose another category'}
            </StyledText>
            <CaretDown size={20} color={colors.muted} />
          </StyledTouchableOpacity>
        </Field>
      </Animated.View>
    </StyledView>
  );

  const renderStep2 = () => (
    <StyledView>
      <Animated.View style={stagger(0)}>
        <Field label="WHATSAPP NUMBER" error={errors.whatsappNumber}>
          <StyledView className="h-[54px] flex-row items-center overflow-hidden rounded-input border border-border bg-card">
            <StyledView className="h-full justify-center border-r border-border px-4">
              <StyledText className="font-label" style={{ fontSize: 15, color: colors.ink }}>
                +234
              </StyledText>
            </StyledView>
            <StyledTextInput
              className="flex-1 px-4 py-0 font-body text-body text-ink"
              placeholder="801 234 5678"
              placeholderTextColor={colors.muted}
              value={formData.whatsappNumber}
              onChangeText={(value) => updateField('whatsappNumber', value)}
              keyboardType="phone-pad"
              accessibilityLabel="WhatsApp number"
            />
          </StyledView>
        </Field>
      </Animated.View>

      <Animated.View style={[stagger(1), { marginTop: 16 }]}>
        <Field label="CITY" error={errors.city}>
          <StyledView className={inputBox(false)}>
            <MapPin size={20} color={colors.muted} style={{ marginRight: 10 }} />
            <StyledTextInput
              className="flex-1 px-0 font-body text-body text-ink"
              placeholder="e.g., Lagos"
              placeholderTextColor={colors.muted}
              value={formData.city}
              onChangeText={(value) => updateField('city', value)}
              accessibilityLabel="City"
            />
          </StyledView>
        </Field>
      </Animated.View>

      <Animated.View style={[stagger(2), { marginTop: 16 }]}>
        <Field label="STATE" error={errors.state}>
          <StyledView className={inputBox(false)}>
            <MapTrifold size={20} color={colors.muted} style={{ marginRight: 10 }} />
            <StyledTextInput
              className="flex-1 px-0 font-body text-body text-ink"
              placeholder="e.g., Lagos"
              placeholderTextColor={colors.muted}
              value={formData.state}
              onChangeText={(value) => updateField('state', value)}
              accessibilityLabel="State"
            />
          </StyledView>
        </Field>
      </Animated.View>
    </StyledView>
  );

  const renderStep3 = () => (
    <StyledView>
      <Animated.View style={stagger(0)}>
        <Field label="PHOTO">
          {/* FigCraft 530 photo placeholder — 342×160 panel. */}
          <StyledTouchableOpacity
            className="h-[160px] w-full items-center justify-center overflow-hidden rounded-card border border-border bg-card"
            onPress={pickLogo}
            accessibilityRole="button"
            accessibilityLabel="Add business logo"
          >
            {formData.logoUri ? (
              <StyledImage source={{ uri: formData.logoUri }} className="h-full w-full" resizeMode="cover" />
            ) : (
              <StyledView className="items-center">
                <StyledView className="h-[60px] w-[60px] items-center justify-center rounded-input border border-brand">
                  <CameraPlus size={28} color={colors.brand} />
                </StyledView>
                <StyledText className="mt-3 font-body" style={{ fontSize: 11, color: colors.muted }}>
                  Add Logo
                </StyledText>
              </StyledView>
            )}
          </StyledTouchableOpacity>
          <StyledText className="mt-2 font-label" style={{ fontSize: 11, color: colors.brand }}>
            Take a photo — helps customers recognise you fast.
          </StyledText>
        </Field>
      </Animated.View>

      <Animated.View style={[stagger(1), { marginTop: 16 }]}>
        <StyledView className="rounded-card border border-border bg-card p-4">
          <StyledView className="mb-3 flex-row items-center border-b border-border pb-3">
            <Storefront size={18} color={colors.brand} />
            <StyledText className="ml-3 flex-1 font-label text-card-title text-ink" numberOfLines={1}>
              {formData.businessName || 'Your Business'}
            </StyledText>
          </StyledView>
          <StyledView className="mb-2 flex-row items-center">
            <Folder size={16} color={colors.muted} />
            <StyledText className="ml-3 font-body text-body-sm text-muted">{formData.category || 'Not set'}</StyledText>
          </StyledView>
          <StyledView className="mb-2 flex-row items-center">
            <Phone size={16} color={colors.muted} />
            <StyledText className="ml-3 font-body text-body-sm text-muted">
              +234 {formData.whatsappNumber || 'Not set'}
            </StyledText>
          </StyledView>
          <StyledView className="flex-row items-center">
            <MapPin size={16} color={colors.muted} />
            <StyledText className="ml-3 font-body text-body-sm text-muted">
              {formData.city || 'Not set'}
              {formData.state ? `, ${formData.state}` : ''}
            </StyledText>
          </StyledView>
        </StyledView>
      </Animated.View>
    </StyledView>
  );

  const stepCtaLabel =
    currentStep === 1 ? 'Next: Location →' : currentStep === 2 ? 'Next: Final touch →' : null;

  return (
    <Container isScrollable={false} withSafeAreaTop className="bg-background">
      <StyledKeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1">
        <StyledScrollView
          contentContainerStyle={{ flexGrow: 1, paddingVertical: 28 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
        >
          <StyledView className="px-gutter">
            {/* Eyebrow */}
            <StyledText className="font-label uppercase tracking-[2px]" style={{ fontSize: 9, color: colors.accent }}>
              BUSINESS SETUP
            </StyledText>

            {/* Title */}
            <StyledText
              className="mt-3 font-display"
              style={{ fontSize: 31, lineHeight: 34, letterSpacing: -0.31, color: colors.ink }}
            >
              {STEPS[currentStep - 1].title}
            </StyledText>

            {/* Sub */}
            <StyledText className="mt-3 font-body" style={{ fontSize: 13, lineHeight: 18, color: colors.muted }}>
              {STEPS[currentStep - 1].subtitle}
            </StyledText>

            <StyledView className="mt-7">{renderStepper()}</StyledView>
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
            <StyledView className="px-gutter" style={{ width: screenWidth }}>
              {renderStep1()}
            </StyledView>
            <StyledView className="px-gutter" style={{ width: screenWidth }}>
              {renderStep2()}
            </StyledView>
            <StyledView className="px-gutter" style={{ width: screenWidth }}>
              {renderStep3()}
            </StyledView>
          </Animated.View>

          <StyledView className="mt-auto gap-3 px-gutter pb-6 pt-6">
            {currentStep < 3 ? (
              <StyledView className="gap-3">
                <Button size="lg" variant="primary" onPress={handleNext}>
                  {stepCtaLabel ?? 'Continue'}
                </Button>
                <StyledTouchableOpacity
                  className="min-h-12 items-center justify-center"
                  onPress={handleSkip}
                  accessibilityRole="button"
                  accessibilityLabel="Complete setup later"
                >
                  <StyledText className="font-body text-body-sm text-muted">Complete later</StyledText>
                </StyledTouchableOpacity>
              </StyledView>
            ) : (
              <StyledView className="gap-3">
                <Button size="lg" variant="primary" onPress={handleComplete} isDisabled={isLoading}>
                  {isLoading ? 'Setting up...' : 'Finish setup'}
                </Button>
                <StyledTouchableOpacity
                  className="min-h-12 items-center justify-center"
                  onPress={handleBack}
                  accessibilityRole="button"
                  accessibilityLabel="Go back a step"
                >
                  <StyledText className="font-label text-body-sm text-brand">← Go back</StyledText>
                </StyledTouchableOpacity>
              </StyledView>
            )}
          </StyledView>
        </StyledScrollView>
      </StyledKeyboardAvoidingView>

      <BottomSheet
        visible={showCategoryPicker}
        onClose={() => setShowCategoryPicker(false)}
        title="Business Category"
        subtitle="Pick the closest match — you can change this later."
        icon={<Folder size={20} color={colors.brand} />}
        maxHeightRatio={0.72}
      >
        <StyledView className="gap-1.5 pb-4">
          {BUSINESS_CATEGORIES.map((category) => {
            const isSelected = formData.category === category.label;

            return (
              <StyledTouchableOpacity
                key={category.label}
                className={`flex-row items-center rounded-input border px-4 py-3 ${
                  isSelected ? 'border-brand bg-brand-soft' : 'border-border bg-card'
                }`}
                onPress={() => {
                  updateField('category', category.label);
                  setShowCategoryPicker(false);
                }}
                accessibilityRole="button"
                accessibilityState={{ selected: isSelected }}
              >
                <StyledText className="mr-3" style={{ fontSize: 20 }}>
                  {category.emoji}
                </StyledText>
                <StyledText
                  className="flex-1 font-body text-body"
                  style={{ color: isSelected ? colors.brandStrong : colors.ink }}
                >
                  {category.label}
                </StyledText>
                {isSelected ? <Check size={18} color={colors.brand} weight="bold" /> : null}
              </StyledTouchableOpacity>
            );
          })}
        </StyledView>
      </BottomSheet>
    </Container>
  );
}
