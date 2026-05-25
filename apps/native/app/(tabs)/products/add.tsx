import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, Alert, View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Container } from '@/components/container';
import { useProducts } from '../../../hooks/useProducts';
import { Ionicons } from '@expo/vector-icons';
import { withUniwind } from 'uniwind';

const StyledView = withUniwind(View);
const StyledText = withUniwind(Text);
const StyledKeyboardAvoidingView = withUniwind(KeyboardAvoidingView);
const StyledTouchableOpacity = withUniwind(TouchableOpacity);

interface FormErrors {
  name?: string;
  category?: string;
  price?: string;
  costPrice?: string;
  quantity?: string;
}

export default function AddProductScreen() {
  const router = useRouter();
  const { addProduct, isLoading: isAddingProduct } = useProducts();
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

      await addProduct(payload);
      router.back();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to add product');
    } finally {
      setIsSaving(false);
    }
  };

  const updateField = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  return (
    <Container isScrollable={false} className="bg-background pt-12">
      <StyledKeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <StyledView className="flex-row justify-between items-center px-6 py-4">
          <StyledTouchableOpacity onPress={() => router.back()}>
            <Ionicons name="close" size={28} color="#181D19" />
          </StyledTouchableOpacity>
          <StyledText className="text-[20px] font-bold text-on-surface tracking-tight">Add Product</StyledText>
          <StyledView className="w-7" /> 
        </StyledView>

        <ScrollView 
          contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 24, paddingVertical: 24 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <StyledView className="gap-2">
            <Input
              label="Product Name"
              placeholder="e.g., Ankara Top"
              value={formData.name}
              onChangeText={(value) => updateField('name', value)}
              error={errors.name}
            />

            <Input
              label="Description"
              placeholder="Describe your product..."
              value={formData.description}
              onChangeText={(value) => updateField('description', value)}
              multiline
              numberOfLines={3}
              className="min-h-[100px] py-4 text-left align-top"
            />

            <StyledView className="flex-row gap-4">
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

            <StyledView className="flex-row gap-4">
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

            <Input
              label="SKU (Optional)"
              placeholder="e.g., ANK-001"
              value={formData.sku}
              onChangeText={(value) => updateField('sku', value)}
            />

            <Input
              label="Category"
              placeholder="e.g., Clothing"
              value={formData.category}
              onChangeText={(value) => updateField('category', value)}
            />
          </StyledView>

          <StyledView className="mt-8 mb-10 pb-10">
            <Button
              size="lg"
              variant="primary"
              onPress={handleSave}
              isDisabled={isAddingProduct || isSaving}
            >
              {isSaving ? 'Saving...' : 'Save Product'}
            </Button>
          </StyledView>
        </ScrollView>
      </StyledKeyboardAvoidingView>
    </Container>
  );
}
