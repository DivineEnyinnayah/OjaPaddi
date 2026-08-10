import { useState, useEffect } from 'react';
import * as ImagePicker from 'expo-image-picker';
import { useProducts, type Product } from './useProducts';
import { useToast } from '@/components/ui/toast';

export interface FormErrors {
  name?: string;
  category?: string;
  price?: string;
  costPrice?: string;
  quantity?: string;
  lowStockThreshold?: string;
  image?: string;
  sku?: string;
  [key: string]: string | undefined;
}

export function useProductForm(editId?: string) {
  const isEditMode = !!editId;
  const { fetchProductById, addProduct, updateProduct, uploadProductImage } = useProducts();
  const toast = useToast();
  
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingProduct, setIsLoadingProduct] = useState(false);
  
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
  const [existingImageUrl, setExistingImageUrl] = useState<string | null>(null);
  const [errors, setErrors] = useState<FormErrors>({});

  useEffect(() => {
    if (!editId) return;
    setIsLoadingProduct(true);
    fetchProductById(editId)
      .then((product) => {
        if (product) {
          setFormData({
            name: product.name,
            description: product.description || '',
            category: product.category || '',
            price: String(product.price),
            costPrice: product.costPrice ? String(product.costPrice) : '',
            quantity: String(product.quantity),
            lowStockThreshold: String(product.lowStockThreshold ?? 5),
            sku: product.sku || '',
          });
          if (product.imageUrl) {
            setExistingImageUrl(product.imageUrl);
          }
        }
      })
      .finally(() => setIsLoadingProduct(false));
  }, [editId]);

  const updateField = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const validateForm = () => {
    const newErrors: FormErrors = {};
    if (!formData.name.trim()) {
      newErrors.name = 'Product name is required';
    }
    if (!formData.price || isNaN(Number(formData.price)) || Number(formData.price) < 0) {
      newErrors.price = 'Valid price is required';
    }
    if (formData.costPrice && (isNaN(Number(formData.costPrice)) || Number(formData.costPrice) < 0)) {
      newErrors.costPrice = 'Cost price must be a valid number';
    }
    if (!formData.quantity || isNaN(Number(formData.quantity)) || Number(formData.quantity) < 0 || !Number.isInteger(Number(formData.quantity))) {
      newErrors.quantity = 'Valid quantity is required';
    }
    if (formData.lowStockThreshold && (isNaN(Number(formData.lowStockThreshold)) || Number(formData.lowStockThreshold) < 0)) {
      newErrors.lowStockThreshold = 'Must be a valid number';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep = (step: string) => {
    const newErrors: FormErrors = {};
    if (step === 'details') {
      if (!formData.name.trim()) {
        newErrors.name = 'Product name is required';
      }
    } else if (step === 'pricing') {
      if (!formData.price || isNaN(Number(formData.price)) || Number(formData.price) < 0) {
        newErrors.price = 'Valid price is required';
      }
      if (formData.costPrice && (isNaN(Number(formData.costPrice)) || Number(formData.costPrice) < 0)) {
        newErrors.costPrice = 'Cost price must be a valid number';
      }
      if (!formData.quantity || isNaN(Number(formData.quantity)) || Number(formData.quantity) < 0 || !Number.isInteger(Number(formData.quantity))) {
        newErrors.quantity = 'Valid quantity is required';
      }
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleImagePickerResult = async (result: ImagePicker.ImagePickerResult) => {
    if (!result.canceled && result.assets.length > 0) {
      const asset = result.assets[0];
      if (asset.fileSize && asset.fileSize > 2 * 1024 * 1024) {
        toast.error("Please select an image under 2 MB.", "Image Too Large");
        return;
      }
      setImageUri(asset.uri);
      if (errors.image) {
        setErrors(prev => ({ ...prev, image: undefined }));
      }
    }
  };

  const pickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      toast.error('Please grant camera roll permissions to add a product photo.', 'Permission needed');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    await handleImagePickerResult(result);
  };

  const takePhoto = async () => {
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
    if (!permissionResult.granted) {
      toast.error('Please grant camera permissions to take a product photo.', 'Permission needed');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    await handleImagePickerResult(result);
  };

  const handleImagePress = () => {
    toast.action({
      title: 'Add Photo',
      message: 'Choose an option',
      options: [
        { label: 'Camera', onPress: takePhoto },
        { label: 'Gallery', onPress: pickImage },
        { label: 'Cancel', onPress: () => {} },
      ],
    });
  };

  const handleSave = async (onSuccess: (product: Product) => void) => {
    if (!validateForm()) return;
    setIsSaving(true);
    try {
      const payload = {
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        category: formData.category.trim() || undefined,
        price: Number(formData.price),
        costPrice: formData.costPrice ? Number(formData.costPrice) : undefined,
        quantity: Number(formData.quantity),
        lowStockThreshold: Number(formData.lowStockThreshold),
        sku: formData.sku.trim() || undefined,
      };

      let product;
      if (isEditMode && editId) {
        product = await updateProduct(editId, payload);
      } else {
        product = await addProduct(payload);
      }

      if (imageUri && product) {
        await uploadProductImage(product.id, imageUri);
      }
      
      onSuccess(product);
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'Failed to save product', 'Error');
    } finally {
      setIsSaving(false);
    }
  };

  const resetForm = () => {
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
  };

  return {
    formData,
    imageUri,
    existingImageUrl,
    errors,
    isSaving,
    isLoadingProduct,
    isEditMode,
    updateField,
    pickImage,
    takePhoto,
    handleImagePress,
    handleSave,
    validateStep,
    resetForm,
  };
}
