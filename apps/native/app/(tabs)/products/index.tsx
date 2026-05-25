import React, { useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { useProducts, type Product } from '../../../hooks/useProducts';
import { Button } from '@/components/ui/button';
import { Container } from '@/components/container';
import { Surface } from '@/components/ui/surface';
import { Ionicons } from '@expo/vector-icons';
import { withUniwind } from 'uniwind';

const StyledView = withUniwind(View);
const StyledText = withUniwind(Text);
const StyledTouchableOpacity = withUniwind(TouchableOpacity);

export default function ProductsScreen() {
  const router = useRouter();
  const { products, isLoading, error, fetchProducts } = useProducts();

  useEffect(() => {
    fetchProducts();
  }, []);

  const renderProduct = ({ item }: { item: Product }) => {
    const price = parseFloat(item.price);
    const lowStockThreshold = item.lowStockThreshold ?? 5;
    const isLowStock = item.quantity <= lowStockThreshold;

    return (
      <StyledTouchableOpacity onPress={() => router.push({ pathname: '/products/[id]', params: { id: item.id } })}>
        <Surface variant="outline" className="flex-row items-center p-4 mb-3">
          <StyledView className="flex-1">
            <StyledText className="text-[18px] font-semibold text-on-surface mb-1">{item.name}</StyledText>
            <StyledText className="text-body-sm text-on-surface-variant mb-2">{item.category || 'General'}</StyledText>
            <StyledView className="flex-row items-center gap-3">
              <StyledText className="text-[16px] font-bold text-primary">₦{price.toLocaleString()}</StyledText>
              <StyledText className={`text-body-sm ${isLowStock ? 'text-error font-semibold' : 'text-on-surface-variant'}`}>
                {item.quantity} in stock
              </StyledText>
            </StyledView>
          </StyledView>
          <Ionicons name="chevron-forward" size={20} color="#8a9389" />
        </Surface>
      </StyledTouchableOpacity>
    );
  };

  if (isLoading && products?.length === 0) {
    return (
      <Container isScrollable={false} className="bg-background pt-12 items-center justify-center">
        <ActivityIndicator size="large" color="#1A6B3C" />
      </Container>
    );
  }

  if (error && products?.length === 0) {
    return (
      <Container isScrollable={false} className="bg-background pt-12 items-center justify-center p-6">
        <StyledText className="text-error text-center mb-4 text-body-lg">{error}</StyledText>
        <Button onPress={() => fetchProducts()}>
          Retry
        </Button>
      </Container>
    );
  }

  return (
    <Container isScrollable={false} className="bg-background pt-12">
      <StyledView className="flex-row justify-between items-center px-6 py-4 mt-2">
        <StyledText className="text-[36px] font-black text-on-surface tracking-tight">Products</StyledText>
        <StyledTouchableOpacity onPress={() => router.push('/products/add')}>
          <Ionicons name="add-circle" size={32} color="#1A6B3C" />
        </StyledTouchableOpacity>
      </StyledView>

      <FlatList
        data={products}
        keyExtractor={(item) => item.id}
        renderItem={renderProduct}
        contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 100 }}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={fetchProducts} tintColor="#1A6B3C" />
        }
        ListEmptyComponent={
          <StyledView className="items-center mt-24">
            <Ionicons name="cube-outline" size={64} color="#D4D4D4" />
            <StyledText className="text-[16px] text-on-surface-variant mt-4 text-center">No products found. Add your first product!</StyledText>
            <Button
              size="lg"
              className="mt-6"
              onPress={() => router.push('/products/add')}
            >
              Add Product
            </Button>
          </StyledView>
        }
      />

      <StyledTouchableOpacity
        className="absolute bottom-8 right-6 w-14 h-14 rounded-full bg-primary justify-center items-center shadow-md shadow-black/30 elevation-5"
        onPress={() => router.push('/products/add')}
      >
        <Ionicons name="add" size={30} color="#FFF" />
      </StyledTouchableOpacity>
    </Container>
  );
}
