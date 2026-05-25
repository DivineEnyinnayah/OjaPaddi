import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, Image, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '@/components/ui/button';
import { Container } from '@/components/container';
import { useProducts, type Product } from '../../../hooks/useProducts';
import { withUniwind } from 'uniwind';

const StyledView = withUniwind(View);
const StyledText = withUniwind(Text);
const StyledTouchableOpacity = withUniwind(TouchableOpacity);
const StyledImage = withUniwind(Image);

export default function ProductDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { fetchProductById, adjustStock, deleteProduct, isLoading } = useProducts();
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
          }
        },
      ]
    );
  };

  if (isLoading && !product) {
    return (
      <Container isScrollable={false} className="bg-background pt-12 items-center justify-center">
        <ActivityIndicator size="large" color="#1A6B3C" />
      </Container>
    );
  }

  if (!product) {
    return (
      <Container isScrollable={false} className="bg-background pt-12 items-center justify-center">
        <StyledText className="text-[16px] text-on-surface-variant mb-4">Product not found</StyledText>
        <Button onPress={() => router.back()}>
          Go Back
        </Button>
      </Container>
    );
  }

  const price = parseFloat(product.price);
  const lowStockThreshold = product.lowStockThreshold ?? 5;

  return (
    <Container isScrollable={false} className="bg-background relative">
      <StyledView className="absolute top-12 left-6 z-10 w-12 h-12 bg-surface rounded-full justify-center items-center shadow-sm shadow-black/10 elevation-2">
        <StyledTouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#181D19" />
        </StyledTouchableOpacity>
      </StyledView>

      <ScrollView contentContainerStyle={{ paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
        <StyledView className="w-full h-[300px] bg-surface-variant items-center justify-center">
          {product.imageUrl ? (
            <StyledImage source={{ uri: product.imageUrl }} className="w-full h-full" resizeMode="cover" />
          ) : (
            <Ionicons name="image-outline" size={64} color="#8a9389" />
          )}
        </StyledView>

        <StyledView className="px-6 py-6">
          <StyledView className="flex-row justify-between items-start mb-2">
            <StyledText className="text-[24px] font-bold text-on-surface flex-1">{product.name}</StyledText>
            <StyledText className="text-[24px] font-bold text-primary">₦{price.toLocaleString()}</StyledText>
          </StyledView>
          <StyledText className="text-[16px] text-on-surface-variant mb-1">{product.category || 'General'}</StyledText>
          {product.sku ? <StyledText className="text-body-sm text-outline mb-4">SKU: {product.sku}</StyledText> : null}

          <StyledView className="h-[1px] bg-outline-variant/30 my-6" />

          <StyledText className="text-[18px] font-bold text-on-surface mb-3">Description</StyledText>
          <StyledText className="text-[16px] text-on-surface-variant leading-6 mb-8">{product.description || 'No description provided.'}</StyledText>

          <StyledView className="bg-surface-container rounded-card p-4">
            <StyledText className="text-body-sm text-on-surface font-semibold mb-3">Current Stock</StyledText>
            <StyledView className="flex-row items-center justify-center gap-6">
              <StyledTouchableOpacity className="w-12 h-12 rounded-full bg-surface justify-center items-center border border-outline-variant/50" onPress={handleStockRemove}>
                <Ionicons name="remove" size={24} color="#181D19" />
              </StyledTouchableOpacity>
              <StyledText className="text-[28px] font-extrabold text-on-surface min-w-[50px] text-center">{product.quantity}</StyledText>
              <StyledTouchableOpacity className="w-12 h-12 rounded-full bg-primary justify-center items-center" onPress={handleStockAdd}>
                <Ionicons name="add" size={24} color="#FFF" />
              </StyledTouchableOpacity>
            </StyledView>
            {product.quantity <= lowStockThreshold && (
              <StyledText className="text-error text-center mt-3 font-semibold text-body-sm">Running Low!</StyledText>
            )}
          </StyledView>
        </StyledView>
      </ScrollView>

      <StyledView className="absolute bottom-0 left-0 right-0 flex-row px-5 py-4 bg-background border-t border-outline-variant/20 items-center gap-4">
        <StyledTouchableOpacity className="w-14 h-14 rounded-full justify-center items-center border-2 border-error" onPress={handleDelete}>
          <Ionicons name="trash-outline" size={24} color="#EF4444" />
        </StyledTouchableOpacity>
        <Button
          size="lg"
          className="flex-1"
          onPress={() => {
            const msg = `*${product.name}* 🛍️\nPrice: ₦${price.toLocaleString()}\n\nTap to view & order 👇\nstore.ojapaddi.com/${product.id}`;
            const url = `whatsapp://send?text=${encodeURIComponent(msg)}`;
            alert('WhatsApp share link copied to clipboard (simulation)');
          }}
        >
          Share Product
        </Button>
      </StyledView>
    </Container>
  );
}
