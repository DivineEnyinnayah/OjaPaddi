import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ShoppingBag, CameraPlus, CheckCircle, ArrowLeft } from 'phosphor-react-native';
import { useThemeColor } from '@/hooks/useThemeColor';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast';
import { TAB_BAR_OFFSET } from '@/lib/tab-bar';
import { Input } from '@/components/ui/input';
import { useProducts } from '@/hooks/useProducts';
import { useProductForm } from '@/hooks/useProductForm';
import { CategoryPicker } from '@/components/CategoryPicker';
import { ProfitMarginBadge } from '@/components/ProfitMarginBadge';
import { withUniwind } from 'uniwind';
import { copy } from '@/constants/copy';

const StyledView = withUniwind(View);
const StyledText = withUniwind(Text);
const StyledTouchableOpacity = withUniwind(TouchableOpacity);
const StyledImage = withUniwind(Image);

interface FormErrors {
  name?: string;
  category?: string;
  price?: string;
  costPrice?: string;
  quantity?: string;
  image?: string;
  [key: string]: string | undefined;
}

function FormSection({ title, children }: { title?: string; children: React.ReactNode }) {
  return (
    <StyledView className="rounded-xl border border-outline-variant/40 bg-surface">
      {title && (
        <StyledView className="px-4 pt-3 pb-1">
          <StyledText className="text-xs font-semibold text-primary uppercase">{title}</StyledText>
        </StyledView>
      )}
      <StyledView className="px-4 pb-2">
        {children}
      </StyledView>
    </StyledView>
  );
}

type WizardStep = 'welcome' | 'photo' | 'details' | 'pricing' | 'review';

export default function AddProductScreen() {
  const router = useRouter();
  const { editId } = useLocalSearchParams<{ editId?: string }>();
  const isEditMode = !!editId;
  const insets = useSafeAreaInsets();
  const colors = useThemeColor();
  const toast = useToast();
  
  const { products, fetchProducts } = useProducts();
  const [currentStep, setCurrentStep] = useState<WizardStep>('welcome');
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  const {
    formData,
    imageUri,
    existingImageUrl,
    errors,
    isSaving,
    isLoadingProduct,
    updateField,
    handleImagePress,
    handleSave,
    validateStep,
    resetForm,
  } = useProductForm(editId);

  useEffect(() => {
    fetchProducts().then((prods) => {
      setIsInitialLoad(false);
      const hasProducts = prods ? prods.length > 0 : false;
      if (!isEditMode && !hasProducts) {
        setCurrentStep('welcome');
      } else if (!isEditMode && currentStep === 'welcome') {
        setCurrentStep('photo');
      }
    });
  }, [isEditMode]);

  const shouldShowWizard = !isEditMode && products.length === 0;

  if (isEditMode && isLoadingProduct) {
    return (
      <StyledView className="flex-1 bg-background items-center justify-center gap-3">
        <StyledView className="w-16 h-16 rounded-full bg-primary/10 items-center justify-center">
          <StyledView className="w-10 h-10 rounded-full bg-primary/20 animate-pulse" />
        </StyledView>
        <StyledText className="text-sm text-on-surface-variant font-medium">Loading product...</StyledText>
      </StyledView>
    );
  }

  const handleNext = () => {
    if (!validateStep(currentStep)) return;
    
    switch (currentStep) {
      case 'welcome':
        setCurrentStep('photo');
        break;
      case 'photo':
        setCurrentStep('details');
        break;
      case 'details':
        setCurrentStep('pricing');
        break;
      case 'pricing':
        setCurrentStep('review');
        break;
      case 'review':
        onSaveProduct();
        break;
    }
  };

  const handleBack = () => {
    switch (currentStep) {
      case 'photo':
        setCurrentStep('welcome');
        break;
      case 'details':
        setCurrentStep('photo');
        break;
      case 'pricing':
        setCurrentStep('details');
        break;
      case 'review':
        setCurrentStep('pricing');
        break;
      default:
        router.back();
        break;
    }
  };

  const onSaveProduct = () => {
    handleSave(() => {
      if (isEditMode) {
        toast.action({
          title: 'Saved',
          message: 'Product updated successfully.',
          options: [{ label: 'OK', onPress: () => router.back() }],
        });
      } else {
        toast.action({
          title: copy.productOnboarding.review.successTitle,
          message: copy.productOnboarding.review.successSubtitle,
          options: [
            {
              label: copy.productOnboarding.review.addAnother,
              onPress: () => {
                resetForm();
                setCurrentStep('welcome');
              }
            },
            {
              label: copy.productOnboarding.review.viewProducts,
              onPress: () => router.replace('/products')
            }
          ]
        });
      }
    });
  };

  const renderWelcomeStep = () => (
    <StyledView className="flex-1 items-center justify-center px-8">
      <ShoppingBag size={80} color={colors.primary} />
      <StyledText className="text-2xl font-bold text-on-surface mt-6 text-center">
        {copy.productOnboarding.welcome.title}
      </StyledText>
      <StyledText className="text-on-surface-variant text-center mt-3 text-body-lg">
        {copy.productOnboarding.welcome.subtitle}
      </StyledText>
      <Button
        size="lg"
        variant="primary"
        className="mt-12 w-full max-w-xs"
        onPress={() => setCurrentStep('photo')}
      >
        {copy.productOnboarding.welcome.button}
      </Button>
    </StyledView>
  );

  const renderPhotoStep = () => (
    <ScrollView contentContainerStyle={{ flexGrow: 1 }} className="flex-1 px-6">
      <StyledView className="flex-1 items-center justify-center">
        <StyledText className="text-xl font-bold text-on-surface mb-2">
          {copy.productOnboarding.photo.title}
        </StyledText>
        <StyledText className="text-on-surface-variant text-center mb-8">
          {copy.productOnboarding.photo.subtitle}
        </StyledText>
        
        <StyledTouchableOpacity
          onPress={handleImagePress}
          className="w-48 h-48 rounded-2xl border-2 border-dashed items-center justify-center overflow-hidden active:opacity-80 mb-8"
          style={{ borderColor: colors.outlineVariant }}
        >
          {(imageUri || existingImageUrl) ? (
            <StyledImage
              source={{ uri: imageUri || existingImageUrl! }}
              className="w-full h-full"
              resizeMode="cover"
            />
          ) : (
            <StyledView className="items-center">
              <StyledView className="w-16 h-16 rounded-full bg-surface-container items-center justify-center mb-4">
                <CameraPlus size={32} color={colors.primary} />
              </StyledView>
              <StyledText className="text-on-surface font-medium">
                {copy.productOnboarding.photo.addPhoto}
              </StyledText>
            </StyledView>
          )}
        </StyledTouchableOpacity>
      </StyledView>
    </ScrollView>
  );

  const renderDetailsStep = () => (
    <ScrollView contentContainerStyle={{ padding: 24 }} showsVerticalScrollIndicator={false}>
      <StyledView>
        <StyledText className="text-xl font-bold text-on-surface mb-2">
          {copy.productOnboarding.details.title}
        </StyledText>
        <StyledText className="text-on-surface-variant mb-6">
          {copy.productOnboarding.details.subtitle}
        </StyledText>
        
        <FormSection>
          <Input
            label="Product Name"
            placeholder={copy.productOnboarding.details.namePlaceholder}
            value={formData.name}
            onChangeText={(value) => updateField('name', value)}
            error={errors.name}
            containerClassName="mb-4 mt-2"
          />
          <CategoryPicker
            value={formData.category}
            onChange={(val) => updateField('category', val)}
          />
          <Input
            label="Description"
            placeholder={copy.productOnboarding.details.descriptionPlaceholder}
            value={formData.description}
            onChangeText={(value) => updateField('description', value)}
            multiline
            numberOfLines={3}
            inputClassName="min-h-[80px] py-2 text-left align-top"
          />
        </FormSection>
      </StyledView>
    </ScrollView>
  );

  const renderPricingStep = () => (
    <ScrollView contentContainerStyle={{ padding: 24 }} showsVerticalScrollIndicator={false}>
      <StyledView>
        <StyledText className="text-xl font-bold text-on-surface mb-2">
          {copy.productOnboarding.pricing.title}
        </StyledText>
        <StyledText className="text-on-surface-variant mb-6">
          {copy.productOnboarding.pricing.subtitle}
        </StyledText>
        
        <FormSection>
          <Input
            label={copy.productOnboarding.pricing.priceLabel}
            placeholder={copy.productOnboarding.pricing.pricePlaceholder}
            value={formData.price}
            onChangeText={(value) => updateField('price', value)}
            keyboardType="decimal-pad"
            error={errors.price}
            containerClassName="mb-4 mt-2"
          />
          <Input
            label="Cost Price (₦)"
            placeholder="0.00"
            value={formData.costPrice}
            onChangeText={(value) => updateField('costPrice', value)}
            keyboardType="decimal-pad"
            containerClassName="mb-4"
          />
          <ProfitMarginBadge sellingPrice={formData.price} costPrice={formData.costPrice} />
          <Input
            label="Quantity"
            placeholder="0"
            value={formData.quantity}
            onChangeText={(value) => updateField('quantity', value)}
            keyboardType="numeric"
            error={errors.quantity}
            containerClassName="mb-2"
          />
        </FormSection>
      </StyledView>
    </ScrollView>
  );

  const renderReviewStep = () => (
    <ScrollView contentContainerStyle={{ padding: 24, flexGrow: 1 }} className="flex-1">
      <StyledView className="flex-1 items-center justify-center">
        <CheckCircle size={80} color={colors.primary} />
        <StyledText className="text-2xl font-bold text-on-surface mt-6 text-center">
          {copy.productOnboarding.review.title}
        </StyledText>
        <StyledText className="text-on-surface-variant text-center mt-3 text-body-lg">
          {copy.productOnboarding.review.subtitle}
        </StyledText>
        
        <StyledView className="w-full mt-8 bg-surface-container rounded-xl p-4">
          <StyledView className="flex-row justify-between py-2 border-b border-outline-variant/30">
            <StyledText className="text-on-surface-variant">Name</StyledText>
            <StyledText className="text-on-surface font-medium">{formData.name || 'Not set'}</StyledText>
          </StyledView>
          <StyledView className="flex-row justify-between py-2 border-b border-outline-variant/30">
            <StyledText className="text-on-surface-variant">Price</StyledText>
            <StyledText className="text-on-surface font-medium">₦{formData.price || '0.00'}</StyledText>
          </StyledView>
          <StyledView className="flex-row justify-between py-2">
            <StyledText className="text-on-surface-variant">Quantity</StyledText>
            <StyledText className="text-on-surface font-medium">{formData.quantity || '0'}</StyledText>
          </StyledView>
        </StyledView>
      </StyledView>
    </ScrollView>
  );

  const getStepTitle = () => {
    switch (currentStep) {
      case 'photo': return copy.productOnboarding.photo.title;
      case 'details': return copy.productOnboarding.details.title;
      case 'pricing': return copy.productOnboarding.pricing.title;
      case 'review': return copy.productOnboarding.review.title;
      default: return '';
    }
  };

  const getButtonText = () => {
    if (currentStep === 'review') {
      return isSaving ? copy.productOnboarding.review.adding : copy.productOnboarding.review.button;
    }
    return 'Continue';
  };

  if (!shouldShowWizard && !isInitialLoad) {
    return (
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <StyledView className="flex-1 bg-background">
          <StyledView
            className="flex-row items-center px-4 pb-2"
            style={{ paddingTop: insets.top + 12 }}
          >
            <StyledTouchableOpacity
              onPress={() => router.back()}
              className="w-10 h-10 items-center justify-center rounded-full bg-surface-container active:scale-95"
            >
              <ArrowLeft size={22} color={colors.onSurface} />
            </StyledTouchableOpacity>
            <StyledText className="flex-1 text-h2 font-bold text-on-surface ml-2">
              {isEditMode ? 'Edit Product' : copy.addProduct.title}
            </StyledText>
          </StyledView>

          <ScrollView
            contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 140 }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <StyledView className="gap-3">
              <StyledTouchableOpacity
                onPress={handleImagePress}
                className="w-full h-48 rounded-xl border-2 border-dashed items-center justify-center overflow-hidden active:opacity-80"
                style={{
                  borderColor: errors.image ? colors.error : colors.outlineVariant,
                }}
              >
                {(imageUri || existingImageUrl) ? (
                  <StyledImage
                    source={{ uri: imageUri || existingImageUrl! }}
                    className="w-full h-full"
                    resizeMode="cover"
                  />
                ) : (
                  <StyledView className="items-center gap-2">
                    <CameraPlus size={28} color={colors.primary} />
                    <StyledText className="text-sm text-on-surface-variant font-medium">
                      {copy.addProduct.imagePlaceholder}
                    </StyledText>
                  </StyledView>
                )}
              </StyledTouchableOpacity>

              <FormSection title="Basic Info">
                <Input
                  label="Product Name"
                  placeholder="e.g., Ankara Top"
                  value={formData.name}
                  onChangeText={(value) => updateField('name', value)}
                  error={errors.name}
                  containerClassName="mb-1.5 mt-1"
                />
                <Input
                  label="Description"
                  placeholder="Describe your product..."
                  value={formData.description}
                  onChangeText={(value) => updateField('description', value)}
                  multiline
                  numberOfLines={2}
                  inputClassName="min-h-[60px] py-2 text-left align-top"
                />
                <CategoryPicker
                  value={formData.category}
                  onChange={(val) => updateField('category', val)}
                />
              </FormSection>

              <FormSection title="Pricing">
                <StyledView className="flex-row gap-2">
                  <StyledView className="flex-1">
                    <Input
                      label="Selling Price (₦)"
                      placeholder="0.00"
                      value={formData.price}
                      onChangeText={(value) => updateField('price', value)}
                      keyboardType="decimal-pad"
                      error={errors.price}
                    />
                  </StyledView>
                  <StyledView className="flex-1">
                    <Input
                      label="Cost Price (₦)"
                      placeholder="0.00"
                      value={formData.costPrice}
                      onChangeText={(value) => updateField('costPrice', value)}
                      keyboardType="decimal-pad"
                    />
                  </StyledView>
                </StyledView>
                <ProfitMarginBadge sellingPrice={formData.price} costPrice={formData.costPrice} />
              </FormSection>

              <FormSection title="Stock">
                <StyledView className="flex-row gap-2">
                  <StyledView className="flex-1">
                    <Input
                      label="Quantity"
                      placeholder="0"
                      value={formData.quantity}
                      onChangeText={(value) => updateField('quantity', value)}
                      keyboardType="numeric"
                      error={errors.quantity}
                    />
                  </StyledView>
                  <StyledView className="flex-1">
                    <Input
                      label="Low Stock Alert"
                      placeholder="5"
                      value={formData.lowStockThreshold}
                      onChangeText={(value) => updateField('lowStockThreshold', value)}
                      keyboardType="numeric"
                    />
                  </StyledView>
                </StyledView>
              </FormSection>

              <FormSection title="Identifier">
                <Input
                  label="SKU (Optional)"
                  placeholder="e.g., ANK-001"
                  value={formData.sku}
                  onChangeText={(value) => updateField('sku', value)}
                />
              </FormSection>
            </StyledView>
          </ScrollView>

          <StyledView
            className="px-4 pt-3"
            style={{
              position: 'absolute',
              bottom: insets.bottom + TAB_BAR_OFFSET,
              left: 0,
              right: 0,
              paddingBottom: 8,
              backgroundColor: colors.surface,
              borderTopWidth: 1,
              borderTopColor: colors.outlineVariant + '30',
            }}
          >
            <Button
              size="lg"
              variant="primary"
              onPress={onSaveProduct}
              isDisabled={isSaving}
            >
              {isSaving ? 'Saving...' : 'Save Product'}
            </Button>
          </StyledView>
        </StyledView>
      </KeyboardAvoidingView>
    );
  }

  return (
    <StyledView className="flex-1 bg-background">
      <StyledView
        className="flex-row items-center px-4 pb-2"
        style={{ paddingTop: insets.top + 12 }}
      >
        <StyledTouchableOpacity
          onPress={handleBack}
          className="w-10 h-10 items-center justify-center rounded-full bg-surface-container active:scale-95"
        >
          <ArrowLeft size={22} color={colors.onSurface} />
        </StyledTouchableOpacity>
        <StyledText className="flex-1 text-h2 font-bold text-on-surface ml-2">
          {currentStep !== 'welcome' && currentStep !== 'review' ? getStepTitle() : ''}
        </StyledText>
      </StyledView>

      {currentStep === 'welcome' && renderWelcomeStep()}
      {currentStep === 'photo' && renderPhotoStep()}
      {currentStep === 'details' && renderDetailsStep()}
      {currentStep === 'pricing' && renderPricingStep()}
      {currentStep === 'review' && renderReviewStep()}

      {currentStep !== 'welcome' && (
        <StyledView
          className="px-4 py-3 shadow-lg z-10"
          style={{
            position: 'absolute',
            bottom: TAB_BAR_OFFSET,
            left: 0,
            right: 0,
            backgroundColor: colors.surface,
            borderTopWidth: 1,
            borderTopColor: colors.outlineVariant + '30',
          }}
        >
          <Button
            size="lg"
            variant="primary"
            onPress={handleNext}
            isDisabled={isSaving}
          >
            {getButtonText()}
          </Button>
        </StyledView>
      )}
    </StyledView>
  );
}
