import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, TextInput, ScrollView, Image, KeyboardAvoidingView, Platform } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { ArrowLeft, Camera, CaretUp, CaretDown, CheckCircle } from "phosphor-react-native";
import { withUniwind } from "uniwind";
import { Container } from "@/components/container";
import { Surface } from "@/components/ui/surface";
import { useToast } from "@/components/ui/toast";
import { useThemeColor } from "@/hooks/useThemeColor";
import { useBusiness, type UpdateBusinessPayload } from "@/hooks/useBusiness";
import { imageUri, prepareImageForUpload } from "@/lib/image";
import { copy } from "@/constants/copy";
import { typeScale } from "@/constants/tokens";

const StyledView = withUniwind(View);
const StyledText = withUniwind(Text);
const StyledTouchableOpacity = withUniwind(TouchableOpacity);
const StyledTextInput = withUniwind(TextInput);
const StyledImage = withUniwind(Image);

const BUSINESS_CATEGORIES = [
  "Clothing & Fashion",
  "Food & Beverages",
  "Electronics",
  "Beauty & Cosmetics",
  "Home & Furniture",
  "Pharmacy/Medical",
  "Jewelry & Accessories",
  "Books & Stationery",
  "Sports & Fitness",
  "General Goods",
  "Other",
];

/**
 * FigCraft `06.2 — Store profile` (frame 1587), 390×844.
 *
 * Header, store preview card and sectioned fields follow the frame. Every form
 * behaviour is preserved: `useBusiness` fetch/update, logo picking + upload,
 * dirty tracking and the save-success transient.
 */
export default function BusinessProfileScreen() {
  const router = useRouter();
  const colors = useThemeColor();
  const toast = useToast();
  const { business, fetchBusiness, updateBusiness, uploadLogo } = useBusiness();

  const [form, setForm] = useState({
    name: "",
    category: "",
    description: "",
    phone: "",
    email: "",
    address: "",
    city: "",
    state: "",
    whatsappNumber: "",
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
        name: business.name || "",
        category: business.category || "",
        description: business.description || "",
        phone: business.phone || "",
        email: business.email || "",
        address: business.address || "",
        city: business.city || "",
        state: business.state || "",
        whatsappNumber: business.whatsappNumber || "",
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
      toast.error("Please grant gallery permissions to upload a business logo.", "Permission needed");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets.length > 0) {
      const asset = result.assets[0];
      if (asset.fileSize && asset.fileSize > 5 * 1024 * 1024) {
        toast.error("Please select an image under 5 MB.", "Image Too Large");
        return;
      }
      const prepared = await prepareImageForUpload(asset);
      setLogoUri(prepared.uri);
      setIsDirty(true);
    }
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      toast.error("Business name is required.", "Required");
      return;
    }

    setIsSaving(true);
    setSaveSuccess(false);

    try {
      // Upload logo if it's a local file
      if (logoUri && logoUri.startsWith("file://")) {
        await uploadLogo(logoUri);
      }

      const payload: UpdateBusinessPayload = {
        name: form.name.trim(),
        category: form.category || undefined,
        description: form.description.trim() || undefined,
        phone: form.phone.trim() || undefined,
        email: form.email.trim() || undefined,
        whatsappNumber: form.whatsappNumber.trim() || undefined,
        address: form.address.trim() || undefined,
        city: form.city.trim() || undefined,
        state: form.state.trim() || undefined,
      };

      await updateBusiness(payload);
      setIsDirty(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    } catch {
      toast.error(copy.businessProfile.error, "Error");
    } finally {
      setIsSaving(false);
    }
  };

  const renderInputField = (
    label: string,
    value: string,
    placeholder: string,
    field: string,
    options?: { keyboardType?: "default" | "email-address" | "phone-pad"; multiline?: boolean; error?: string },
  ) => (
    <StyledView className="mb-4">
      <StyledText className="mb-2 font-label text-micro uppercase tracking-[1px] text-muted">
        {label}
      </StyledText>
      <StyledView className="justify-center rounded-input border border-border bg-background">
        <StyledTextInput
          className="flex-1 px-4 py-3.5 font-body text-body text-ink"
          value={value}
          onChangeText={(text: string) => updateField(field, text)}
          placeholder={placeholder}
          placeholderTextColor={colors.muted}
          keyboardType={options?.keyboardType || "default"}
          multiline={options?.multiline}
          numberOfLines={options?.multiline ? 3 : 1}
          accessibilityLabel={label}
          style={options?.multiline ? { textAlignVertical: "top" } : undefined}
        />
      </StyledView>
      {options?.error ? (
        <StyledText accessibilityRole="alert" className="mt-1 font-body text-body-sm text-danger">
          {options.error}
        </StyledText>
      ) : null}
    </StyledView>
  );

  return (
    <Container isScrollable={false} className="bg-background">
      {/* Header — frame y22 */}
      <StyledView className="flex-row items-center gap-4 px-6 pt-4 pb-4">
        <StyledTouchableOpacity
          onPress={() => router.back()}
          className="h-9 w-9 items-center justify-center rounded-pill border border-border bg-card"
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <ArrowLeft size={18} color={colors.ink} />
        </StyledTouchableOpacity>
        <StyledText
          className="font-title text-ink"
          style={{ fontSize: typeScale.section.fontSize, lineHeight: typeScale.section.lineHeight }}
        >
          Store profile
        </StyledText>
      </StyledView>

      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} className="flex-1">
        <ScrollView
          contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Store preview — frame y76 */}
          <Surface variant="primary" className="rounded-[20px] p-5">
            <StyledTouchableOpacity
              onPress={pickLogo}
              className="flex-row items-center gap-4"
              accessibilityRole="button"
              accessibilityLabel={logoUri ? "Change business logo" : "Add business logo"}
            >
              {logoUri ? (
                <StyledImage
                  source={{ uri: imageUri(logoUri) }}
                  className="h-16 w-16 rounded-pill"
                  style={{ backgroundColor: colors.brandSoft }}
                />
              ) : (
                <StyledView className="h-16 w-16 items-center justify-center rounded-pill bg-brand-soft">
                  <Camera size={26} color={colors.brand} />
                </StyledView>
              )}
              <StyledView className="flex-1">
                <StyledText
                  className="font-display text-ink"
                  style={{ fontSize: typeScale.title.fontSize, lineHeight: typeScale.title.lineHeight }}
                  numberOfLines={1}
                >
                  {form.name || "Your store"}
                </StyledText>
                <StyledText className="mt-1 font-body text-micro text-muted" numberOfLines={2}>
                  {form.description || copy.businessProfile.subtitle}
                </StyledText>
              </StyledView>
            </StyledTouchableOpacity>

            <StyledView className="mt-4 self-start rounded-pill bg-brand-soft px-3 py-1.5">
              <StyledText className="font-label text-[8px] uppercase tracking-[0.5px] text-brand">
                {form.category || "Set a category"}
              </StyledText>
            </StyledView>
          </Surface>

          {/* Basic information — frame y368 equivalent */}
          <StyledText className="mt-6 mb-2 font-label text-micro uppercase tracking-[1px] text-muted">
            Basic information
          </StyledText>
          <Surface variant="primary" className="rounded-card p-5">
            {renderInputField(copy.businessProfile.nameLabel, form.name, copy.businessProfile.namePlaceholder, "name")}
            {renderInputField(
              copy.businessProfile.descriptionLabel,
              form.description,
              copy.businessProfile.descriptionPlaceholder,
              "description",
              { multiline: true },
            )}
          </Surface>

          {/* Category */}
          <StyledText className="mt-6 mb-2 font-label text-micro uppercase tracking-[1px] text-muted">
            Category
          </StyledText>
          <Surface variant="primary" className="rounded-card p-5">
            <StyledTouchableOpacity
              className="flex-row items-center justify-between rounded-input border border-border bg-background px-4 py-3.5"
              onPress={() => setShowCategoryPicker(!showCategoryPicker)}
              accessibilityRole="button"
              accessibilityState={{ expanded: showCategoryPicker }}
              accessibilityLabel={copy.businessProfile.categoryLabel}
            >
              <StyledText className={`font-body text-body ${form.category ? "text-ink" : "text-muted"}`}>
                {form.category || copy.businessProfile.categoryPlaceholder}
              </StyledText>
              {showCategoryPicker ? (
                <CaretUp size={20} color={colors.muted} />
              ) : (
                <CaretDown size={20} color={colors.muted} />
              )}
            </StyledTouchableOpacity>
            {showCategoryPicker && (
              <StyledView className="mt-2 overflow-hidden rounded-input border border-border bg-background">
                {BUSINESS_CATEGORIES.map((cat) => (
                  <StyledTouchableOpacity
                    key={cat}
                    className={`min-h-12 justify-center border-b border-border px-4 ${
                      form.category === cat ? "bg-brand-soft" : ""
                    }`}
                    onPress={() => {
                      updateField("category", cat);
                      setShowCategoryPicker(false);
                    }}
                    accessibilityRole="button"
                    accessibilityState={{ selected: form.category === cat }}
                    accessibilityLabel={cat}
                  >
                    <StyledText
                      className={`font-body text-body ${form.category === cat ? "font-label text-brand" : "text-ink"}`}
                    >
                      {cat}
                    </StyledText>
                  </StyledTouchableOpacity>
                ))}
              </StyledView>
            )}
          </Surface>

          {/* Contact information */}
          <StyledText className="mt-6 mb-2 font-label text-micro uppercase tracking-[1px] text-muted">
            Contact information
          </StyledText>
          <Surface variant="primary" className="rounded-card p-5">
            {renderInputField(copy.businessProfile.phoneLabel, form.phone, copy.businessProfile.phonePlaceholder, "phone", {
              keyboardType: "phone-pad",
            })}
            {renderInputField(copy.businessProfile.emailLabel, form.email, copy.businessProfile.emailPlaceholder, "email", {
              keyboardType: "email-address",
            })}
            {renderInputField(
              copy.businessProfile.whatsappLabel,
              form.whatsappNumber,
              copy.businessProfile.whatsappPlaceholder,
              "whatsappNumber",
              { keyboardType: "phone-pad" },
            )}
          </Surface>

          {/* Location */}
          <StyledText className="mt-6 mb-2 font-label text-micro uppercase tracking-[1px] text-muted">
            Location
          </StyledText>
          <Surface variant="primary" className="mb-8 rounded-card p-5">
            {renderInputField(copy.businessProfile.addressLabel, form.address, copy.businessProfile.addressPlaceholder, "address")}
            {renderInputField(copy.businessProfile.cityLabel, form.city, copy.businessProfile.cityPlaceholder, "city")}
            {renderInputField(copy.businessProfile.stateLabel, form.state, copy.businessProfile.statePlaceholder, "state")}
          </Surface>

          {/* Save — frame y650 */}
          <StyledTouchableOpacity
            className={`min-h-14 flex-row items-center justify-center rounded-button ${
              isSaving || !isDirty ? "bg-border" : "bg-accent"
            }`}
            onPress={handleSave}
            disabled={isSaving || !isDirty}
            accessibilityRole="button"
            accessibilityState={{ disabled: isSaving || !isDirty, busy: isSaving }}
            accessibilityLabel={copy.businessProfile.saveButton}
          >
            {isSaving ? (
              <StyledView className="h-5 w-5 rounded-pill bg-ink opacity-30" />
            ) : saveSuccess ? (
              <StyledView className="flex-row items-center">
                <CheckCircle size={20} color={colors.ink} />
                <StyledText className="ml-2 font-label text-body text-ink">
                  {copy.businessProfile.saved}
                </StyledText>
              </StyledView>
            ) : (
              <StyledText className="font-label text-body text-ink">
                {copy.businessProfile.saveButton}
              </StyledText>
            )}
          </StyledTouchableOpacity>

          <StyledText className="mt-4 text-center font-body text-micro text-muted">
            Customer page updates instantly — no deploy required.
          </StyledText>
        </ScrollView>
      </KeyboardAvoidingView>
    </Container>
  );
}
