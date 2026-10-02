import React, { useEffect, useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  Image,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  TextInput,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useProducts, type Product } from '../../../hooks/useProducts';
import { useThemeColor } from '@/hooks/useThemeColor';
import { Button } from '@/components/ui/button';
import { Container } from '@/components/container';
import { Surface } from '@/components/ui/surface';
import { MagnifyingGlass, Plus } from 'phosphor-react-native';
import { withUniwind } from 'uniwind';
import { TAB_BAR_OFFSET } from '@/lib/tab-bar';
import { ILLUSTRATIONS } from '@/constants/illustrations';
import { Skeleton } from '@/components/ui/skeleton';

const StyledView = withUniwind(View);
const StyledText = withUniwind(Text);
const StyledTouchableOpacity = withUniwind(TouchableOpacity);
const StyledTextInput = withUniwind(TextInput);
const StyledScrollView = withUniwind(ScrollView);
const StyledImage = withUniwind(Image);


function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export default function ProductsScreen() {
  const router = useRouter();
  const { products, isLoading, error, fetchProducts } = useProducts();
  const colors = useThemeColor();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  useEffect(() => {
    fetchProducts();
  }, []);

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesSearch = product.name
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
      const matchesCategory =
        selectedCategory === 'All' || product.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [products, searchQuery, selectedCategory]);

  const totalValue = useMemo(() => {
    return products.reduce((sum, product) => {
      return sum + parseFloat(product.price) * product.quantity;
    }, 0);
  }, [products]);

  const renderProductCard = useCallback(
    ({ item }: { item: Product }) => {
      const price = parseFloat(item.price);
      const lowStockThreshold = item.lowStockThreshold ?? 5;
      const isLowStock = item.quantity <= lowStockThreshold;

      return (
        <StyledTouchableOpacity
          className="flex-1 m-1.5"
          activeOpacity={0.7}
          onPress={() =>
            router.push({
              pathname: '/products/[id]',
              params: { id: item.id },
            })
          }
        >
          <Surface variant="primary" className="p-0 overflow-hidden rounded-xl border border-outline-variant/20 shadow-sm">
            <StyledView className="h-28 bg-surface-container items-center justify-center">
              {item.imageUrl ? (
                <StyledImage source={{ uri: item.imageUrl }} className="w-full h-full" resizeMode="cover" />
              ) : (
                <StyledText className="text-2xl font-bold text-outline">
                  {getInitials(item.name)}
                </StyledText>
              )}
            </StyledView>
            <StyledView className="p-3 gap-1">
              <StyledText
                className="text-base font-semibold text-on-surface leading-tight text-balance"
                numberOfLines={1}
              >
                {item.name}
              </StyledText>
              <StyledView className="bg-surface-container self-start rounded-full px-2 py-0.5">
                <StyledText className="text-xs text-on-surface-variant">
                  {item.category || 'General'}
                </StyledText>
              </StyledView>
              <StyledText className="text-base font-bold text-primary mt-1 tabular-nums">
                ₦{price.toLocaleString()}
              </StyledText>
              <StyledView className="flex-row items-center gap-1">
                <StyledText
                  className={`text-xs ${isLowStock ? 'text-error font-semibold' : 'text-on-surface-variant'} tabular-nums`}
                >
                  {item.quantity} in stock
                </StyledText>
                {isLowStock && (
                  <StyledView className="bg-error/10 rounded-full px-1.5 py-0.5">
                    <StyledText className="text-xs text-error font-semibold">
                      Low
                    </StyledText>
                  </StyledView>
                )}
              </StyledView>
            </StyledView>
          </Surface>
        </StyledTouchableOpacity>
      );
    },
    [router, colors],
  );

  const categories = useMemo(() => {
    const cats = new Set<string>();
    products.forEach((p) => {
      if (p.category) cats.add(p.category);
    });
    return ['All', ...Array.from(cats).sort()];
  }, [products]);

  if (isLoading && products.length === 0) {
    return (
      <Container isScrollable={false} withTabBar className="px-margin">
        <StyledView className="flex-col gap-2 mb-4">
          <Skeleton className="h-10 w-3/4 mb-2" />
          <Skeleton className="h-11 w-full rounded-input" />
        </StyledView>
        <StyledView className="flex-row gap-2 mb-4">
          <Skeleton className="h-8 w-16 rounded-md" />
          <Skeleton className="h-8 w-20 rounded-md" />
          <Skeleton className="h-8 w-24 rounded-md" />
        </StyledView>
        <Surface variant="primary" className="flex-row justify-between items-center mb-4">
          <StyledView className="flex-1 items-center">
            <Skeleton className="h-4 w-20 mb-1" />
            <Skeleton className="h-6 w-8" />
          </StyledView>
          <StyledView className="w-px h-10 bg-outline-variant/50" />
          <StyledView className="flex-1 items-center">
            <Skeleton className="h-4 w-20 mb-1" />
            <Skeleton className="h-6 w-16" />
          </StyledView>
        </Surface>
        <StyledView className="flex-row gap-1.5">
          {Array.from({ length: 4 }).map((_, i) => (
            <StyledView key={i} className="flex-1 m-1">
              <Skeleton className="h-28 rounded-xl mb-2" />
              <Skeleton className="h-4 w-3/4 mb-1" />
              <Skeleton className="h-3 w-1/2 mb-1" />
              <Skeleton className="h-5 w-1/3" />
            </StyledView>
          ))}
        </StyledView>
      </Container>
    );
  }

  if (error && products.length === 0) {
    return (
      <Container isScrollable={false} withTabBar className="items-center justify-center p-6">
        <StyledText className="text-error text-center mb-4 text-body-lg">
          {error}
        </StyledText>
        <Button onPress={() => fetchProducts()}>Retry</Button>
      </Container>
    );
  }

  return (
    <Container isScrollable={false} withTabBar>
      <StyledView className="flex-row justify-between items-center px-margin pt-4 pb-2">
        <StyledText className="text-h2 font-bold text-on-surface text-balance">
          Products
        </StyledText>
      </StyledView>

      <StyledView className="px-margin pb-2">
        <StyledView className="flex-row items-center bg-surface-container-low rounded-xl border border-outline-variant px-4 h-11">
          <MagnifyingGlass size={20} color={colors.outline} />
          <StyledTextInput
            className="flex-1 text-body-md text-on-surface ml-2"
            placeholder="Search products..."
            placeholderTextColor={colors.outline}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </StyledView>
      </StyledView>

      <StyledScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        className="px-margin mb-2"
        contentContainerStyle={{ gap: 6 }}
      >
        {categories.map((category) => {
          const isSelected = selectedCategory === category;
          return (
            <StyledTouchableOpacity
              key={category}
              className={`items-center justify-center rounded-full px-4 h-8 ${isSelected ? 'bg-primary' : 'border border-outline-variant'}`}
              onPress={() => setSelectedCategory(category)}
              accessibilityLabel={`Select category: ${category}`}
              accessibilityRole="button"
            >
              <StyledText
                className={`justify-center items-center flex text-sm font-medium ${isSelected ? 'text-on-primary' : 'text-on-surface-variant'}`}
              >
                {category}
              </StyledText>
            </StyledTouchableOpacity>
          );
        })}
      </StyledScrollView>

      <StyledView className="px-margin pb-3">
        <Surface variant="primary" className="flex-row justify-between items-center rounded-xl border border-outline-variant/30 p-md">
          <StyledView className="flex-1 items-center">
            <StyledText className="text-xs text-on-surface-variant">
              Total Products
            </StyledText>
            <StyledText className="text-xl font-bold text-on-surface tabular-nums">
              {products.length}
            </StyledText>
          </StyledView>
          <StyledView className="w-px h-10 bg-outline-variant/50" />
          <StyledView className="flex-1 items-center">
            <StyledText className="text-xs text-on-surface-variant">
              Total Value
            </StyledText>
            <StyledText className="text-xl font-bold text-primary tabular-nums">
              ₦{totalValue.toLocaleString()}
            </StyledText>
          </StyledView>
        </Surface>
      </StyledView>

      <FlatList
        data={filteredProducts}
        keyExtractor={(item) => item.id}
        renderItem={renderProductCard}
        numColumns={2}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 16 }}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={fetchProducts}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
        ListEmptyComponent={
          <StyledView className="items-center mt-16 px-6">
            <Image
              source={{ uri: ILLUSTRATIONS.emptyProducts }}
              style={{ width: 80, height: 80 }}
              resizeMode="contain"
            />
            <StyledText className="text-base text-on-surface-variant mt-4 text-center text-pretty">
              No products yet
            </StyledText>
            <Button
              size="lg"
              className="mt-6"
              onPress={() => router.push('/products/add')}
            >
              Add your first product
            </Button>
          </StyledView>
        }
      />

      <StyledTouchableOpacity
        className="absolute right-4 size-14 rounded-full bg-primary justify-center items-center shadow-lg z-[var(--z-fab)] active:scale-95"
        style={{ bottom: TAB_BAR_OFFSET + 12 }}
        onPress={() => router.push('/products/add')}
        accessibilityLabel="Add new product"
        accessibilityRole="button"
      >
        <Plus size={28} color={colors.onPrimary} />
      </StyledTouchableOpacity>
    </Container>
  );
}
