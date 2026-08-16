import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, Image, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, ImageIcon, Minus, Plus, Warning, Trash } from 'phosphor-react-native';
import { useThemeColor } from '@/hooks/useThemeColor';
import { Button } from '@/components/ui/button';
import { Container } from '@/components/container';
import { Surface } from '@/components/ui/surface';
import { useToast } from '@/components/ui/toast';
import { useProducts, type Product } from '../../../hooks/useProducts';
import { buildProductShareMessage, shareViaWhatsApp } from '@/lib/whatsapp';
import { withUniwind } from 'uniwind';
import { Skeleton } from '@/components/ui/skeleton';
import { formatCurrency } from '@/lib/currency';

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
  const toast = useToast();
  const [product, setProduct] = useState<Product | null>(null);
  const [imageError, setImageError] = useState(false);

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
      toast.error(err instanceof Error ? err.message : 'Failed to adjust stock');
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
      toast.error(err instanceof Error ? err.message : 'Failed to adjust stock');
    }
  };

  const handleDelete = () => {
    toast.confirm({
      title: 'Delete Product',
      message: 'Are you sure you want to delete this product?',
      confirmLabel: 'Delete',
      destructive: true,
      onConfirm: async () => {
        try {
          await deleteProduct(id as string);
          toast.success('Product has been removed.', 'Deleted');
          router.back();
        } catch (err: unknown) {
          toast.error(err instanceof Error ? err.message : 'Failed to delete product');
        }
      },
    });
  };

  const handleShare = () => {
    if (!product) return;
    const message = buildProductShareMessage(product);
    shareViaWhatsApp(message);
  };

  if (isLoading && !product) {
    return (
      <Container isScrollable={false} className="bg-background px-margin">
        <StyledView className="flex-col gap-2 mb-4">
          <Skeleton className="h-10 w-3/4 mb-2" />
          <Skeleton className="h-12 w-full rounded-lg" />
        </StyledView>
        <StyledView className="flex-row gap-2 mb-4 pl-6">
          <Skeleton className="h-8 w-16 rounded-full" />
          <Skeleton className="h-8 w-20 rounded-full" />
          <Skeleton className="h-8 w-24 rounded-full" />
        </StyledView>
        <StyledView className="flex-col gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Surface key={i} variant="outline" className="p-4 mb-3">
              <StyledView className="flex-row justify-between items-start mb-2">
                <StyledView className="flex-1 mr-3">
                  <Skeleton className="h-4 w-20 mb-1" />
                  <Skeleton className="h-6 w-32 mb-1" />
                  <Skeleton className="h-3 w-20" />
                </StyledView>
                <Skeleton className="h-6 w-16" />
              </StyledView>
              <StyledView className="flex-row justify-between items-center mt-2 pt-2 border-t border-outline-variant/50">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-6 w-16 rounded-full" />
              </StyledView>
            </Surface>
          ))}
        </StyledView>
      </Container>
    );
  }

  if (!product) {
    return (
      <Container isScrollable={false} className="bg-background items-center justify-center">
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
        <StyledView className="absolute top-4 left-4 z-20 w-11 h-11 bg-surface rounded-full justify-center items-center shadow-md shadow-black/20 elevation-4">
          <StyledTouchableOpacity onPress={() => router.back()}>
            <ArrowLeft size={22} color={colors.onSurface} />
          </StyledTouchableOpacity>
        </StyledView>

        <StyledScrollView
          contentContainerStyle={{ paddingBottom: 110 }}
          showsVerticalScrollIndicator={false}
        >
          <StyledView className="w-full h-[280px] bg-surface-container-high items-center justify-center relative overflow-hidden">
            {product.imageUrl && !imageError ? (
              <StyledImage
                source={{ uri: product.imageUrl }}
                className="w-full h-full"
                resizeMode="cover"
                onError={() => setImageError(true)}
              />
            ) : (
              <StyledView className="w-full h-full items-center justify-center bg-primary-container/20 p-6">
                <StyledView className="w-20 h-20 rounded-full bg-primary/10 items-center justify-center mb-3">
                  <StyledText className="text-3xl font-extrabold text-primary">
                    {product.name.charAt(0).toUpperCase()}
                  </StyledText>
                </StyledView>
                <ImageIcon size={32} color={colors.primary} />
              </StyledView>
            )}
          </StyledView>

          <StyledView className="px-5 pt-6 pb-2">
            <StyledText className="text-[22px] font-bold text-on-surface mb-1">{product.name}</StyledText>

            <StyledText className="text-[22px] font-extrabold text-primary mb-3">
              {formatCurrency(price)}
            </StyledText>

            <StyledView className="flex-row items-center gap-2 mb-1">
              <StyledView className="bg-primary-container/30 px-3 py-1 rounded-full">
                <StyledText className="text-xs font-semibold text-primary">{product.category || 'General'}</StyledText>
              </StyledView>
              {product.sku ? (
                <StyledText className="text-xs text-on-surface-variant font-medium">SKU: {product.sku}</StyledText>
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
                  <Minus size={22} color={colors.onSurface} />
                </StyledTouchableOpacity>
                <StyledText className="text-[28px] font-extrabold text-on-surface min-w-[48px] text-center">
                  {product.quantity}
                </StyledText>
                <StyledTouchableOpacity
                  className="w-11 h-11 rounded-full bg-primary justify-center items-center"
                  onPress={handleStockAdd}
                >
                  <Plus size={22} color={colors.onPrimary} />
                </StyledTouchableOpacity>
              </StyledView>
              {product.quantity <= lowStockThreshold && (
                <StyledView className="flex-row items-center justify-center mt-3 gap-1">
                  <Warning size={16} color={colors.error} />
                  <StyledText className="text-xs font-semibold text-error">Running Low!</StyledText>
                </StyledView>
              )}
            </Surface>

            {/* Actions section directly below stock info floating comfortably above navbar when scrolled */}
            <StyledView className="mt-6 pt-5 border-t border-outline-variant/30 flex-row items-center gap-3">
              <StyledTouchableOpacity
                className="w-12 h-12 rounded-full justify-center items-center border-2 border-error bg-error/10"
                onPress={handleDelete}
                disabled={isLoading}
                accessibilityLabel="Delete Product"
              >
                <Trash size={22} color={colors.error} />
              </StyledTouchableOpacity>
              <Button
                size="lg"
                variant="secondary"
                className="flex-1"
                onPress={() =>
                  router.push({
                    pathname: '/products/add',
                    params: { editId: id as string },
                  })
                }
              >
                Edit
              </Button>
              <Button
                size="lg"
                className="flex-1"
                onPress={handleShare}
              >
                Share
              </Button>
            </StyledView>
          </StyledView>
        </StyledScrollView>
      </StyledView>
    </Container>
  );
}
