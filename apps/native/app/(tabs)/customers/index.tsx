import React, { useEffect, useState, useMemo } from 'react';
import { View, Text, Image, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { useCustomers, type Customer } from '../../../hooks/useCustomers';
import { useThemeColor } from '@/hooks/useThemeColor';
import { Button } from '@/components/ui/button';
import { Container } from '@/components/container';
import { Surface } from '@/components/ui/surface';
import { MaterialIcons } from '@expo/vector-icons';
import { withUniwind } from 'uniwind';
import { ILLUSTRATIONS } from '@/constants/illustrations';

const StyledView = withUniwind(View);
const StyledText = withUniwind(Text);
const StyledTouchableOpacity = withUniwind(TouchableOpacity);
const StyledTextInput = withUniwind(TextInput);

export default function CustomersScreen() {
  const router = useRouter();
  const { customers, isLoading, error, fetchCustomers } = useCustomers();
  const colors = useThemeColor();
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchCustomers();
  }, []);

  const getInitials = (name: string) => {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const filteredCustomers = useMemo(() => {
    if (!search.trim()) return customers;
    const q = search.toLowerCase();
    return customers.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        (c.phone && c.phone.includes(q)) ||
        (c.email && c.email.toLowerCase().includes(q))
    );
  }, [customers, search]);

  const renderCustomer = ({ item }: { item: Customer }) => {
    return (
      <StyledTouchableOpacity onPress={() => {}}>
        <Surface variant="outline" className="flex-row items-center p-4 mb-3">
          <StyledView className="w-12 h-12 rounded-full bg-primary-container justify-center items-center mr-4">
            <StyledText className="text-white font-bold text-body-lg">{getInitials(item.name)}</StyledText>
          </StyledView>
          <StyledView className="flex-1">
            <StyledText className="text-base font-semibold text-on-surface mb-0.5">{item.name}</StyledText>
            {item.phone && <StyledText className="text-body-sm text-on-surface-variant">{item.phone}</StyledText>}
          </StyledView>
          <StyledView className="items-end">
            {item.totalSpent && (
              <StyledText className="text-sm font-semibold text-primary">
                ₦{parseFloat(item.totalSpent).toLocaleString()}
              </StyledText>
            )}
            <MaterialIcons name="chevron-right" size={20} color={colors.outline} />
          </StyledView>
        </Surface>
      </StyledTouchableOpacity>
    );
  };

  if (isLoading && customers?.length === 0) {
    return (
      <Container isScrollable={false} withTabBar className="bg-background pt-12 items-center justify-center">
        <ActivityIndicator size="large" color={colors.primary} />
      </Container>
    );
  }

  if (error && customers?.length === 0) {
    return (
      <Container isScrollable={false} withTabBar className="bg-background pt-12 items-center justify-center p-6">
        <StyledText className="text-error text-center mb-4 text-body-lg">{error}</StyledText>
        <Button onPress={() => fetchCustomers()}>Retry</Button>
      </Container>
    );
  }

  return (
    <Container isScrollable={false} withTabBar className="bg-background pt-12">
      <StyledView className="px-6 py-4 mt-2">
        <StyledText className="text-4xl font-black text-on-surface tracking-tight">Customers</StyledText>
      </StyledView>

      <StyledView className="mx-6 mb-4 flex-row items-center bg-surface-container-lowest border border-outline-variant rounded-input px-4 h-12">
        <MaterialIcons name="search" size={20} color={colors.outline} style={{ marginRight: 8 }} />
        <StyledTextInput
          className="flex-1 text-body-lg text-on-surface"
          placeholderTextColor={colors.outline}
          placeholder="Search customers..."
          value={search}
          onChangeText={setSearch}
          autoCapitalize="none"
          autoCorrect={false}
        />
      </StyledView>

      <FlatList
        data={filteredCustomers}
        keyExtractor={(item) => item.id}
        renderItem={renderCustomer}
        contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 16 }}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={fetchCustomers} tintColor={colors.primary} colors={[colors.primary]} />
        }
        ListEmptyComponent={
          <StyledView className="items-center mt-24">
            <Image
              source={{ uri: ILLUSTRATIONS.emptyCustomers }}
              style={{ width: 80, height: 80 }}
              resizeMode="contain"
            />
            <StyledText className="text-base text-on-surface-variant mt-4 text-center">
              {search.trim() ? 'No customers match your search.' : 'No customers yet. Add your first customer!'}
            </StyledText>
            {!search.trim() && (
              <Button size="lg" className="mt-6" onPress={() => {}}>
                Add Customer
              </Button>
            )}
          </StyledView>
        }
      />

      <StyledTouchableOpacity
        className="absolute bottom-8 right-6 w-14 h-14 rounded-full bg-primary justify-center items-center shadow-md shadow-black/30 elevation-5"
        onPress={() => {}}
      >
        <MaterialIcons name="add" size={28} color={colors.onPrimary} />
      </StyledTouchableOpacity>
    </Container>
  );
}
