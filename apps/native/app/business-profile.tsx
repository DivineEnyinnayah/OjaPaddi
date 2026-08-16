import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, TextInput, ScrollView, Image } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { ArrowLeft, Camera, CaretUp, CaretDown, CheckCircle } from 'phosphor-react-native';
import { withUniwind } from 'uniwind';
import { Container } from '@/components/container';
import { Surface } from '@/components/ui/surface';
import { useToast } from '@/components/ui/toast';
import { useThemeColor } from '@/hooks/useThemeColor';
import { useBusiness, type UpdateBusinessPayload } from '@/hooks/useBusiness';
import { copy } from '@/constants/copy';

const StyledView = withUniwind(View);
const StyledText = withUniwind(Text);
const StyledTouchableOpacity = withUniwind(TouchableOpacity);
const StyledTextInput = withUniwind(TextInput);
const StyledImage = withUniwind(Image);

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

export default function BusinessProfileScreen() {
  const router = useRouter();
  const colors = useThemeColor();
  const toast = useToast();
  const { business, isLoading, fetchBusiness, updateBusiness, uploadLogo } = useBusiness();

  const [form, setForm] = useState({
    name: '',
    category: '',
    description: '',
    phone: '',
    email: '',
    address: '',
    city: '',
    state: '',
    whatsappNumber: '',
  });
  const [logoUri, setLogoUri] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    fetchBusiness();
  }, []);

  useEffect(() => {
    if (business) {
      setForm({
        name: business.name || '',
        category: business.category || '',
        description: business.description || '',
        phone: business.phone || '',
        email: business.email || '',
        address: business.address || '',
        city: business.city || '',
        state: business.state || '',
        whatsappNumber: business.whatsappNumber || '',
      });
      if (business.logoUrl) {
        setLogoUri(business.logoUrl);
      }
    }
  }, [business]);

  const updateField = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setIsDirty(true);
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
      setLogoUri(asset.uri);
      setIsDirty(true);
    }
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      toast.error('Business name is required.', 'Required');
      return;
    }

    setIsSaving(true);
    setSaveSuccess(false);

    try {
      // Upload logo if it's a local file
      if (logoUri && logoUri.startsWith('file://')) {
        await uploadLogo(logoUri);
      }

      const payload: UpdateBusinessPayload = {
        name: form.name.trim(),
        category: form.category || undefined,
        whatsappNumber: form.whatsappNumber.trim() || undefined,
        city: form.city.trim() || undefined,
        state: form.state.trim() || undefined,
      };

      await updateBusiness(payload);
      setIsDirty(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    } catch {
      toast.error(copy.businessProfile.error, 'Error');
    } finally {
      setIsSaving(false);
    }
  };

  const renderInputField = (
    label: string,
    value: string,
    placeholder: string,
    field: string,
    options?: { keyboardType?: 'default' | 'email-address' | 'phone-pad'; multiline?: boolean }
  ) => (
    <StyledView className="mb-4">
      <StyledText className="font-label-bold text-on-surface-variant mb-1.5">
        {label}
      </StyledText>
      <StyledTextInput
        className="bg-surface-container-highest text-on-surface rounded-xl px-4 py-3.5 text-body-lg"
        value={value}
        onChangeText={(text: string) => updateField(field, text)}
        placeholder={placeholder}
        placeholderTextColor={colors.outline}
        keyboardType={options?.keyboardType || 'default'}
        multiline={options?.multiline}
        numberOfLines={options?.multiline ? 3 : 1}
        style={options?.multiline ? { textAlignVertical: 'top' } : undefined}
      />
    </StyledView>
  );

  return (
    <Container isScrollable={false} className="bg-background">
      <StyledView className="flex-row items-center px-6 py-4 mb-2">
        <StyledTouchableOpacity
          onPress={() => router.back()}
          className="w-10 h-10 rounded-full bg-primary-container/20 justify-center items-center mr-4"
        >
          <ArrowLeft size={20} color={colors.primary} />
        </StyledTouchableOpacity>
        <StyledText className="font-h2 font-black text-on-surface text-balance">
          {copy.businessProfile.title}
        </StyledText>
      </StyledView>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        <StyledText className="text-body-sm text-on-surface-variant mb-6 px-1">
          {copy.businessProfile.subtitle}
        </StyledText>

        {/* Logo Section */}
        <Surface variant="primary" className="p-6 mb-6 rounded-2xl items-center">
          <StyledTouchableOpacity onPress={pickLogo} className="items-center">
            {logoUri ? (
              <StyledImage
                source={{ uri: logoUri }}
                className="w-24 h-24 rounded-full mb-3"
                style={{ backgroundColor: colors.surfaceContainerHighest }}
              />
            ) : (
              <StyledView className="w-24 h-24 rounded-full bg-primary-container/15 justify-center items-center mb-3">
                <Camera size={32} color={colors.primary} />
              </StyledView>
            )}
            <StyledText className="font-label-bold text-primary">
              {copy.businessProfile.logoHint}
            </StyledText>
          </StyledTouchableOpacity>
        </Surface>

        {/* Basic Info */}
        <StyledText className="font-h3 text-on-surface mb-3">Basic Information</StyledText>
        <Surface variant="primary" className="p-5 mb-6 rounded-2xl">
          {renderInputField(copy.businessProfile.nameLabel, form.name, copy.businessProfile.namePlaceholder, 'name')}
          {renderInputField(copy.businessProfile.descriptionLabel, form.description, copy.businessProfile.descriptionPlaceholder, 'description', { multiline: true })}
        </Surface>

        {/* Category */}
        <StyledText className="font-h3 text-on-surface mb-3">Category</StyledText>
        <Surface variant="primary" className="p-5 mb-6 rounded-2xl">
          <StyledTouchableOpacity
            className="flex-row items-center justify-between bg-surface-container-highest rounded-xl px-4 py-3.5"
            onPress={() => setShowCategoryPicker(!showCategoryPicker)}
          >
            <StyledText className={`text-body-lg ${form.category ? 'text-on-surface' : 'text-outline'}`}>
              {form.category || copy.businessProfile.categoryPlaceholder}
            </StyledText>
            {showCategoryPicker ? (
              <CaretUp size={24} color={colors.outline} />
            ) : (
              <CaretDown size={24} color={colors.outline} />
            )}
          </StyledTouchableOpacity>
          {showCategoryPicker && (
            <StyledView className="mt-2 bg-surface-container-highest rounded-xl overflow-hidden">
              {BUSINESS_CATEGORIES.map((cat) => (
                <StyledTouchableOpacity
                  key={cat}
                  className={`px-4 py-3 border-b border-outline-variant/30 ${form.category === cat ? 'bg-primary/10' : ''}`}
                  onPress={() => {
                    updateField('category', cat);
                    setShowCategoryPicker(false);
                  }}
                >
                  <StyledText className={`text-body-lg ${form.category === cat ? 'text-primary font-semibold' : 'text-on-surface'}`}>
                    {cat}
                  </StyledText>
                </StyledTouchableOpacity>
              ))}
            </StyledView>
          )}
        </Surface>

        {/* Contact Info */}
        <StyledText className="font-h3 text-on-surface mb-3">Contact Information</StyledText>
        <Surface variant="primary" className="p-5 mb-6 rounded-2xl">
          {renderInputField(copy.businessProfile.phoneLabel, form.phone, copy.businessProfile.phonePlaceholder, 'phone', { keyboardType: 'phone-pad' })}
          {renderInputField(copy.businessProfile.emailLabel, form.email, copy.businessProfile.emailPlaceholder, 'email', { keyboardType: 'email-address' })}
          {renderInputField(copy.businessProfile.whatsappLabel, form.whatsappNumber, copy.businessProfile.whatsappPlaceholder, 'whatsappNumber', { keyboardType: 'phone-pad' })}
        </Surface>

        {/* Location */}
        <StyledText className="font-h3 text-on-surface mb-3">Location</StyledText>
        <Surface variant="primary" className="p-5 mb-8 rounded-2xl">
          {renderInputField(copy.businessProfile.addressLabel, form.address, copy.businessProfile.addressPlaceholder, 'address')}
          {renderInputField(copy.businessProfile.cityLabel, form.city, copy.businessProfile.cityPlaceholder, 'city')}
          {renderInputField(copy.businessProfile.stateLabel, form.state, copy.businessProfile.statePlaceholder, 'state')}
        </Surface>

        {/* Save Button */}
        <StyledTouchableOpacity
          className={`py-4 rounded-2xl items-center justify-center ${isSaving || !isDirty ? 'bg-outline-variant/30' : 'bg-primary'}`}
          onPress={handleSave}
          disabled={isSaving || !isDirty}
        >
          {isSaving ? (
            <StyledView className="w-5 h-5 rounded-full bg-on-primary/30 animate-pulse" />
          ) : saveSuccess ? (
            <StyledView className="flex-row items-center">
              <CheckCircle size={20} color={colors.onPrimary} />
              <StyledText className="text-on-primary font-bold text-lg ml-2">
                {copy.businessProfile.saved}
              </StyledText>
            </StyledView>
          ) : (
            <StyledText className="text-on-primary font-bold text-lg">
              {copy.businessProfile.saveButton}
            </StyledText>
          )}
        </StyledTouchableOpacity>
      </ScrollView>
    </Container>
  );
}
