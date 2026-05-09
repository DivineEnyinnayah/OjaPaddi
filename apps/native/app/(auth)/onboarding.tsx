import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Button } from 'heroui-native';
import { Ionicons } from '@expo/vector-icons';
import { apiRequest } from '../../lib/api';
import { useAuthStore } from '../../stores/authStore';

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
      // In a real app, we would call the business creation API here.
      // For now, we'll just simulate it and then navigate.
      // The user is already logged in after registration.
      
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      router.replace('/(tabs)');
    } catch (error) {
      Alert.alert('Error', 'Failed to set up your business. Please try again.');
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
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <Text style={styles.title}>Business Setup</Text>
            <Text style={styles.subtitle}>Tell us about your business</Text>
          </View>

          <View style={styles.form}>
            {/* Logo Upload */}
            <View style={styles.logoSection}>
              <TouchableOpacity style={styles.logoUpload}>
                <View style={styles.logoPlaceholder}>
                  <Ionicons name="camera-outline" size={32} color={'#A3A3A3'} />
                </View>
              </TouchableOpacity>
              <Text style={styles.logoHint}>Upload your business logo (optional)</Text>
            </View>

            {/* Business Name */}
            <View>
              <Text style={styles.label}>Business Name</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., Tope's Fashion Hub"
                placeholderTextColor={'#A3A3A3'}
                value={formData.businessName}
                onChangeText={(value) => updateField('businessName', value)}
                autoCapitalize="words"
              />
              {errors.businessName && <Text style={styles.errorText}>{errors.businessName}</Text>}
            </View>

            {/* Category */}
            <View>
              <Text style={styles.label}>Business Category</Text>
              <TouchableOpacity
                style={[styles.input, styles.selectInput]}
                onPress={() => setShowCategoryPicker(!showCategoryPicker)}
              >
                <Text style={[
                  styles.selectText,
                  !formData.category && styles.selectPlaceholder,
                ]}>
                  {formData.category || 'Select a category'}
                </Text>
                <Ionicons name={showCategoryPicker ? 'chevron-up' : 'chevron-down'} size={20} color={'#737373'} />
              </TouchableOpacity>
              {showCategoryPicker && (
                <View style={styles.categoryList}>
                  {BUSINESS_CATEGORIES.map((category) => (
                    <TouchableOpacity
                      key={category}
                      style={[
                        styles.categoryItem,
                        formData.category === category && styles.categoryItemSelected,
                      ]}
                      onPress={() => {
                        updateField('category', category);
                        setShowCategoryPicker(false);
                      }}
                    >
                      <Text style={[
                        styles.categoryText,
                        formData.category === category && styles.categoryTextSelected,
                      ]}>
                        {category}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
              {errors.category && <Text style={styles.errorText}>{errors.category}</Text>}
            </View>

            {/* WhatsApp Number */}
            <View>
              <Text style={styles.label}>WhatsApp Number</Text>
              <TextInput
                style={styles.input}
                placeholder="08012345678"
                placeholderTextColor={'#A3A3A3'}
                value={formData.whatsappNumber}
                onChangeText={(value) => updateField('whatsappNumber', value)}
                keyboardType="phone-pad"
              />
              <Text style={styles.fieldHint}>Customers can reach you via WhatsApp</Text>
              {errors.whatsappNumber && <Text style={styles.errorText}>{errors.whatsappNumber}</Text>}
            </View>

            {/* City & State */}
            <View style={styles.row}>
              <View style={styles.halfWidth}>
                <Text style={styles.label}>City</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g., Lagos"
                  placeholderTextColor={'#A3A3A3'}
                  value={formData.city}
                  onChangeText={(value) => updateField('city', value)}
                />
                {errors.city && <Text style={styles.errorText}>{errors.city}</Text>}
              </View>
              <View style={styles.halfWidth}>
                <Text style={styles.label}>State</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g., Lagos"
                  placeholderTextColor={'#A3A3A3'}
                  value={formData.state}
                  onChangeText={(value) => updateField('state', value)}
                />
                {errors.state && <Text style={styles.errorText}>{errors.state}</Text>}
              </View>
            </View>
          </View>

          <View style={styles.actions}>
            <Button
              size="lg"
              style={styles.primaryButton}
              onPress={handleComplete}
              isDisabled={isLoading}
            >
              {isLoading ? 'Setting up...' : 'Complete Setup'}
            </Button>

            <TouchableOpacity 
              style={styles.skipButton}
              onPress={() => router.replace('/(tabs)')}
            >
              <Text style={styles.skipText}>Skip for now</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFBF5',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingVertical: 24,
  },
  header: {
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#737373',
  },
  form: {
    marginBottom: 32,
  },
  logoSection: {
    alignItems: 'center',
    marginBottom: 16,
  },
  logoUpload: {
    width: 100,
    height: 100,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#D4D4D4',
    backgroundColor: '#FAFAFA',
  },
  logoPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#737373',
  },
  logoHint: {
    fontSize: 12,
    marginTop: 8,
    color: '#A3A3A3',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#404040',
    marginBottom: 8,
  },
  input: {
    height: 56,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E5E5',
    color: '#1A1A1A',
  },
  selectInput: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  selectText: {
    fontSize: 16,
    color: '#1A1A1A',
  },
  selectPlaceholder: {
    color: '#A3A3A3',
  },
  categoryList: {
    marginTop: 8,
    borderRadius: 12,
    maxHeight: 200,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  categoryItem: {
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  categoryItemSelected: {
    backgroundColor: '#FEF3C7',
  },
  categoryText: {
    fontSize: 15,
    color: '#404040',
  },
  categoryTextSelected: {
    fontWeight: '600',
  },
  fieldHint: {
    fontSize: 12,
    marginTop: 4,
    marginBottom: 4,
    color: '#A3A3A3',
  },
  errorText: {
    fontSize: 12,
    color: '#EF4444',
    marginTop: 4,
  },
  row: {
    flexDirection: 'row',
  },
  halfWidth: {
    flex: 1,
  },
  actions: {
    marginTop: 'auto',
    gap: 16,
  },
  primaryButton: {
    borderRadius: 16,
    height: 56,
    backgroundColor: '#F59E0B',
    justifyContent: 'center',
    alignItems: 'center',
  },
  skipButton: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  skipText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#737373',
  },
});
