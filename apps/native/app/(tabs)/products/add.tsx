import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useThemeColor } from '@/hooks/useThemeColor';
import { Button } from '@/components/ui/button';
import { TAB_BAR_OFFSET } from '@/lib/tab-bar';
import { Input } from '@/components/ui/input';
import { useProducts } from '@/hooks/useProducts';
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
}

function FormSection({ title, children }: { title?: string; children: React.ReactNode }) {
  return (
    <StyledView className="rounded-xl border border-outline-variant/40 bg-surface">
      {title && (
        <StyledView className="px-4 pt-3 pb-1">
          <StyledText className="text-xs font-semibold text-primary tracking-wider uppercase">{title}</StyledText>
        </StyledView>
      )}
      <StyledView className="px-4 pb-2">
        {children}
      </StyledView>
    </StyledView>
  );
}

// Wizard steps
type WizardStep = 'welcome' | 'photo' | 'details' | 'pricing' | 'review';

export default function AddProductScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colors = useThemeColor();
  const { products, fetchProducts, addProduct, uploadProductImage } = useProducts();
  const [isSaving, setIsSaving] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  
  // Wizard state
  const [currentStep, setCurrentStep] = useState<WizardStep>('welcome');
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    price: '',
    costPrice: '',
    quantity: '',
    lowStockThreshold: '5',
    sku: '',
  });
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [errors, setErrors] = useState<FormErrors>({});

  // Fetch product count on mount
  useEffect(() => {
    const loadProducts = async () => {
      try {
        await fetchProducts();
      } catch (error) {
        console.error('Error fetching products:', error);
      } finally {
        setIsInitialLoad(false);
      }
    };
    
    loadProducts();
  }, []);

  // Determine if we should show wizard (first 3 products) or simple form
  const shouldShowWizard = products.length < 3;
  
  // If not showing wizard and initial load is complete, show simple form
  if (!shouldShowWizard && !isInitialLoad) {
    return <SimpleAddProductForm />;
  }

  const validateStep = (step: WizardStep) => {
    const newErrors: FormErrors = {};
    
    switch (step) {
      case 'details':
        if (!formData.name.trim()) {
          newErrors.name = 'Product name is required';
        }
        break;
      case 'pricing':
        if (!formData.price || isNaN(Number(formData.price))) {
          newErrors.price = 'Valid price is required';
        }
        if (!formData.quantity || isNaN(Number(formData.quantity))) {
          newErrors.quantity = 'Valid quantity is required';
        }
        break;
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const updateField = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const pickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      Alert.alert('Permission needed', 'Please grant camera roll permissions to add a product photo.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets.length > 0) {
      setImageUri(result.assets[0].uri);
      if (errors.image) {
        setErrors(prev => ({ ...prev, image: undefined }));
      }
    }
  };

  const takePhoto = async () => {
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
    if (!permissionResult.granted) {
      Alert.alert('Permission needed', 'Please grant camera permissions to take a product photo.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets.length > 0) {
      setImageUri(result.assets[0].uri);
      if (errors.image) {
        setErrors(prev => ({ ...prev, image: undefined }));
      }
    }
  };

  const handleImagePress = () => {
    Alert.alert('Add Photo', 'Choose an option', [
      { text: 'Camera', onPress: takePhoto },
      { text: 'Gallery', onPress: pickImage },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

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
        handleSave();
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

  const handleSave = async () => {
    if (!validateStep('pricing')) return;
    setIsSaving(true);
    try {
      const payload = {
        name: formData.name,
        description: formData.description,
        category: formData.category,
        price: Number(formData.price),
        costPrice: formData.costPrice ? Number(formData.costPrice) : undefined,
        quantity: Number(formData.quantity),
        lowStockThreshold: Number(formData.lowStockThreshold),
        sku: formData.sku,
      };
      const product = await addProduct(payload);
      if (imageUri && product) {
        await uploadProductImage(product.id, imageUri);
      }
      
      // Show success and let user choose next action
      Alert.alert(
        copy.productOnboarding.review.successTitle,
        copy.productOnboarding.review.successSubtitle,
        [
          {
            text: copy.productOnboarding.review.addAnother,
            onPress: () => {
              // Reset form but stay on screen
              setFormData({
                name: '',
                description: '',
                category: '',
                price: '',
                costPrice: '',
                quantity: '',
                lowStockThreshold: '5',
                sku: '',
              });
              setImageUri(null);
              setErrors({});
              setCurrentStep('welcome');
            }
          },
          {
            text: copy.productOnboarding.review.viewProducts,
            onPress: () => router.replace('/products')
          }
        ]
      );
    } catch (error: unknown) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to add product');
    } finally {
      setIsSaving(false);
    }
  };

  const isLoading = isSaving || isInitialLoad;

  // Show loading spinner while fetching products
  if (isInitialLoad) {
    return (
      <StyledView className="flex-1 bg-background items-center justify-center">
        <MaterialIcons name="shopping-bag" size={48} color={colors.primary} />
        <StyledText className="text-on-surface mt-4">Setting up your product form...</StyledText>
      </StyledView>
    );
  }

  const renderStepIndicator = () => {
    if (currentStep === 'welcome' || currentStep === 'review') return null;
    
    const steps: WizardStep[] = ['photo', 'details', 'pricing'];
    const currentIndex = steps.indexOf(currentStep) + 1;
    const totalSteps = steps.length;
    
    return (
      <StyledView className="flex-row items-center justify-center mb-6">
        <StyledText className="text-on-surface-variant font-medium">
          {copy.productOnboarding.stepIndicator.replace('{current}', currentIndex.toString()).replace('{total}', totalSteps.toString())}
        </StyledText>
      </StyledView>
    );
  };

  const renderWelcomeStep = () => (
    <StyledView className="flex-1 items-center justify-center px-8">
      <MaterialIcons name="shopping-bag" size={80} color={colors.primary} />
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
    <ScrollView 
      contentContainerStyle={{ flexGrow: 1 }}
      className="flex-1 px-6"
    >
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
          {imageUri ? (
            <StyledImage
              source={{ uri: imageUri }}
              className="w-full h-full"
              resizeMode="cover"
            />
          ) : (
            <StyledView className="items-center">
              <StyledView className="w-16 h-16 rounded-full bg-surface-container items-center justify-center mb-4">
                <MaterialIcons name="add-a-photo" size={32} color={colors.primary} />
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
    <ScrollView 
      contentContainerStyle={{ padding: 24 }}
      showsVerticalScrollIndicator={false}
    >
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
          <Input
            label="Category"
            placeholder={copy.productOnboarding.details.categoryPlaceholder}
            value={formData.category}
            onChangeText={(value) => updateField('category', value)}
            containerClassName="mb-4"
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
    <ScrollView 
      contentContainerStyle={{ padding: 24 }}
      showsVerticalScrollIndicator={false}
    >
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
    <ScrollView 
      contentContainerStyle={{ padding: 24, flexGrow: 1 }}
      className="flex-1"
    >
      <StyledView className="flex-1 items-center justify-center">
        <MaterialIcons name="check-circle" size={80} color={colors.primary} />
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
      return isLoading ? copy.productOnboarding.review.adding : copy.productOnboarding.review.button;
    }
    return 'Continue';
  };

  const canSkipPhoto = currentStep === 'photo';

  return (
    <StyledView className="flex-1 bg-background">
      <StyledView
        className="flex-row items-center px-4 pb-2"
        style={{ paddingTop: insets.top + 12 }}
      >
        {currentStep === 'welcome' ? (
          <StyledTouchableOpacity
            onPress={() => router.back()}
            className="w-10 h-10 items-center justify-center rounded-full bg-surface-container active:scale-95"
          >
            <MaterialIcons name="arrow-back" size={22} color={colors.onSurface} />
          </StyledTouchableOpacity>
        ) : (
          <StyledTouchableOpacity
            onPress={handleBack}
            className="w-10 h-10 items-center justify-center rounded-full bg-surface-container active:scale-95"
          >
            <MaterialIcons name="arrow-back" size={22} color={colors.onSurface} />
          </StyledTouchableOpacity>
        )}
        <StyledText className="flex-1 text-xl font-bold text-on-surface tracking-tight ml-2" numberOfLines={1}>
          {currentStep !== 'welcome' && currentStep !== 'review' ? getStepTitle() : ''}
        </StyledText>
        {canSkipPhoto && (
          <StyledTouchableOpacity
            onPress={() => setCurrentStep('details')}
            className="px-3 py-2"
          >
            <StyledText className="text-primary font-medium">
              {copy.productOnboarding.photo.skip}
            </StyledText>
          </StyledTouchableOpacity>
        )}
      </StyledView>

      {renderStepIndicator()}

      {currentStep === 'welcome' && renderWelcomeStep()}
      {currentStep === 'photo' && renderPhotoStep()}
      {currentStep === 'details' && renderDetailsStep()}
      {currentStep === 'pricing' && renderPricingStep()}
      {currentStep === 'review' && renderReviewStep()}

      {currentStep !== 'welcome' && (
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
            onPress={handleNext}
            isDisabled={isLoading}
          >
            {getButtonText()}
          </Button>
        </StyledView>
      )}
    </StyledView>
  );
}

// Simple form for products 4 and beyond
function SimpleAddProductForm() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colors = useThemeColor();
  const { addProduct, uploadProductImage } = useProducts();
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    price: '',
    costPrice: '',
    quantity: '',
    lowStockThreshold: '5',
    sku: '',
  });
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [errors, setErrors] = useState<FormErrors>({});

  const validateForm = () => {
    const newErrors: FormErrors = {};
    if (!formData.name.trim()) {
      newErrors.name = 'Product name is required';
    }
    if (!formData.price || isNaN(Number(formData.price))) {
      newErrors.price = 'Valid price is required';
    }
    if (!formData.quantity || isNaN(Number(formData.quantity))) {
      newErrors.quantity = 'Valid quantity is required';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const updateField = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const pickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      Alert.alert('Permission needed', 'Please grant camera roll permissions to add a product photo.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets.length > 0) {
      setImageUri(result.assets[0].uri);
      if (errors.image) {
        setErrors(prev => ({ ...prev, image: undefined }));
      }
    }
  };

  const takePhoto = async () => {
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
    if (!permissionResult.granted) {
      Alert.alert('Permission needed', 'Please grant camera permissions to take a product photo.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets.length > 0) {
      setImageUri(result.assets[0].uri);
      if (errors.image) {
        setErrors(prev => ({ ...prev, image: undefined }));
      }
    }
  };

  const handleImagePress = () => {
    Alert.alert('Add Photo', 'Choose an option', [
      { text: 'Camera', onPress: takePhoto },
      { text: 'Gallery', onPress: pickImage },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const handleSave = async () => {
    if (!validateForm()) return;
    setIsSaving(true);
    try {
      const payload = {
        name: formData.name,
        description: formData.description,
        category: formData.category,
        price: Number(formData.price),
        costPrice: formData.costPrice ? Number(formData.costPrice) : undefined,
        quantity: Number(formData.quantity),
        lowStockThreshold: Number(formData.lowStockThreshold),
        sku: formData.sku,
      };
      const product = await addProduct(payload);
      if (imageUri && product) {
        await uploadProductImage(product.id, imageUri);
      }
      router.back();
    } catch (error: unknown) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to add product');
    } finally {
      setIsSaving(false);
    }
  };

  const isLoading = isSaving;

  return (
    <StyledView className="flex-1 bg-background">
      <StyledView
        className="flex-row items-center px-4 pb-2"
        style={{ paddingTop: insets.top + 12 }}
      >
        <StyledTouchableOpacity
          onPress={() => router.back()}
          className="w-10 h-10 items-center justify-center rounded-full bg-surface-container active:scale-95"
        >
          <MaterialIcons name="arrow-back" size={22} color={colors.onSurface} />
        </StyledTouchableOpacity>
        <StyledText className="flex-1 text-xl font-bold text-on-surface tracking-tight ml-2">
          {copy.addProduct.title}
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
            {imageUri ? (
              <StyledImage
                source={{ uri: imageUri }}
                className="w-full h-full"
                resizeMode="cover"
              />
            ) : (
              <StyledView className="items-center gap-2">
                <StyledView className="w-16 h-16 rounded-full bg-surface-container items-center justify-center">
                  <MaterialIcons name="add-a-photo" size={28} color={colors.primary} />
                </StyledView>
                <StyledText className="text-sm text-on-surface-variant font-medium">
                  {copy.addProduct.imagePlaceholder}
                </StyledText>
                <StyledText className="text-xs text-on-surface-variant">
                  JPG, PNG up to 2MB
                </StyledText>
              </StyledView>
            )}
          </StyledTouchableOpacity>
          {errors.image && (
            <StyledText className="text-sm text-error ml-1 -mt-2">{errors.image}</StyledText>
          )}

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
              containerClassName="mb-1.5"
            />
            <Input
              label="Category"
              placeholder="e.g., Clothing"
              value={formData.category}
              onChangeText={(value) => updateField('category', value)}
              containerClassName="mb-1.5"
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
                  containerClassName="mb-1.5"
                />
              </StyledView>
              <StyledView className="flex-1">
                <Input
                  label="Cost Price (₦)"
                  placeholder="0.00"
                  value={formData.costPrice}
                  onChangeText={(value) => updateField('costPrice', value)}
                  keyboardType="decimal-pad"
                  containerClassName="mb-1.5"
                />
              </StyledView>
            </StyledView>
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
                  containerClassName="mb-1.5"
                />
              </StyledView>
              <StyledView className="flex-1">
                <Input
                  label="Low Stock Alert"
                  placeholder="5"
                  value={formData.lowStockThreshold}
                  onChangeText={(value) => updateField('lowStockThreshold', value)}
                  keyboardType="numeric"
                  containerClassName="mb-1.5"
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
              containerClassName="mb-1.5"
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
          onPress={handleSave}
          isDisabled={isLoading}
        >
          {isLoading ? copy.addProduct.saving : copy.addProduct.save}
        </Button>
      </StyledView>
    </StyledView>
  );
}