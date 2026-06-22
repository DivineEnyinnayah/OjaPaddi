import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, Image, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { useThemeColor } from '@/hooks/useThemeColor';
import { Button } from '@/components/ui/button';
import { Container } from '@/components/container';
import { Surface } from '@/components/ui/surface';
import { useProducts, type Product } from '../../../hooks/useProducts';
import { buildProductShareMessage, shareViaWhatsApp } from '@/lib/whatsapp';
import { withUniwind } from 'uniwind';

const StyledView = withUniwind(View);
const StyledText = withUniwind(Text);
const StyledTouchableOpacity = withUniwind(TouchableOpacity);
const StyledImage = withUniwind(Image);
const StyledScrollView = withUniwind(ScrollView);

export default function ProductDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { fetchProductById, adjustStock, deleteProduct, isLoading } = useProducts();
  const colors = useThemeColor();
  const [product, setProduct] = useState<Product | null>(null);

  useEffect(() => {
    if (!id) return;
    fetchProductById(id as string).then((fetched) => {
      if (fetched) setProduct(fetched);
    });
  }, [id]);

  const handleStockAdd = async () => {
    try {
      await adjustStock(id as string, 1);
      const updated = await fetchProductById(id as string);
      if (updated) {
        setProduct(updated);
      }
    } catch (err: unknown) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to adjust stock');
    }
  };

  const handleStockRemove = async () => {
    if (!product || product.quantity <= 0) return;
    try {
      await adjustStock(id as string, -1);
      const updated = await fetchProductById(id as string);
      if (updated) {
        setProduct(updated);
      }
    } catch (err: unknown) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to adjust stock');
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Product',
      'Are you sure you want to delete this product?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteProduct(id as string);
              router.back();
            } catch (err: unknown) {
              Alert.alert('Error', err instanceof Error ? err.message : 'Failed to delete product');
            }
          },
        },
      ]
    );
  };

  const handleShare = () => {
    if (!product) return;
    const message = buildProductShareMessage(product);
    shareViaWhatsApp(message);
  };

  if (isLoading && !product) {
    return (
      <Container isScrollable={false} className="bg-background pt-12 items-center justify-center">
        <ActivityIndicator size="large" color={colors.primary} />
      </Container>
    );
  }

  if (!product) {
    return (
      <Container isScrollable={false} className="bg-background pt-12 items-center justify-center">
        <StyledText className="text-base text-on-surface-variant mb-4">Product not found</StyledText>
        <Button onPress={() => router.back()}>
          Go Back
        </Button>
      </Container>
    );
  }

  const price = parseFloat(product.price);
  const lowStockThreshold = product.lowStockThreshold ?? 5;

  return (
    <Container isScrollable={false} withTabBar className="bg-background">
      <StyledView className="relative flex-1">
        <StyledView className="absolute top-12 left-4 z-20 w-11 h-11 bg-surface rounded-full justify-center items-center shadow-md shadow-black/20 elevation-4">
          <StyledTouchableOpacity onPress={() => router.back()}>
            <MaterialIcons name="arrow-back" size={22} color={colors.onSurface} />
          </StyledTouchableOpacity>
        </StyledView>

        <StyledScrollView
          contentContainerStyle={{ paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
        >
          <StyledView className="w-full h-[300px] bg-surface-variant items-center justify-center">
            {product.imageUrl ? (
              <StyledImage source={{ uri: product.imageUrl }} className="w-full h-full" resizeMode="cover" />
            ) : (
              <MaterialIcons name="image" size={64} color={colors.outline} />
            )}
          </StyledView>

          <StyledView className="px-5 pt-6 pb-2">
            <StyledText className="text-[22px] font-bold text-on-surface mb-1">{product.name}</StyledText>

            <StyledText className="text-[20px] font-bold text-primary mb-3">
              \u20A6{price.toLocaleString()}
            </StyledText>

            <StyledView className="flex-row items-center gap-2 mb-1">
              <StyledView className="bg-bg-primary-container px-3 py-1 rounded-full">
                <StyledText className="text-xs font-semibold text-primary">{product.category || 'General'}</StyledText>
              </StyledView>
              {product.sku ? (
                <StyledText className="text-xs text-outline">SKU: {product.sku}</StyledText>
              ) : null}
            </StyledView>

            <StyledView className="h-[1px] bg-outline-variant my-5" />

            <StyledText className="text-base font-bold text-on-surface mb-2">Description</StyledText>
            <StyledText className="text-sm text-on-surface-variant leading-5 mb-6">
              {product.description || 'No description provided.'}
            </StyledText>

            <Surface variant="primary" className="p-4">
              <StyledText className="text-xs font-semibold text-on-surface-variant mb-3">Current Stock</StyledText>
              <StyledView className="flex-row items-center justify-center gap-5">
                <StyledTouchableOpacity
                  className="w-11 h-11 rounded-full justify-center items-center border border-outline/40"
                  onPress={handleStockRemove}
                >
                  <MaterialIcons name="remove" size={22} color={colors.onSurface} />
                </StyledTouchableOpacity>
                <StyledText className="text-[28px] font-extrabold text-on-surface min-w-[48px] text-center">
                  {product.quantity}
                </StyledText>
                <StyledTouchableOpacity
                  className="w-11 h-11 rounded-full bg-primary justify-center items-center"
                  onPress={handleStockAdd}
                >
                  <MaterialIcons name="add" size={22} color={colors.onPrimary} />
                </StyledTouchableOpacity>
              </StyledView>
              {product.quantity <= lowStockThreshold && (
                <StyledView className="flex-row items-center justify-center mt-3 gap-1">
                  <MaterialIcons name="warning" size={16} color={colors.error} />
                  <StyledText className="text-xs font-semibold text-error">Running Low!</StyledText>
                </StyledView>
              )}
            </Surface>
          </StyledView>
        </StyledScrollView>

        <StyledView className="absolute bottom-0 left-0 right-0 flex-row items-center gap-3 px-5 py-4 bg-surface border-t border-outline-variant/20">
          <StyledTouchableOpacity
            className="w-12 h-12 rounded-full justify-center items-center border-2 border-error"
            onPress={handleDelete}
          >
            <MaterialIcons name="delete" size={22} color={colors.error} />
          </StyledTouchableOpacity>
          <Button
            size="lg"
            className="flex-1"
            onPress={handleShare}
          >
            Share Product
          </Button>
        </StyledView>
      </StyledView>
    </Container>
  );
}
