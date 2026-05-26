import React, { useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { useCustomers, type Customer } from '../../../hooks/useCustomers';
import { useThemeColor } from '@/hooks/useThemeColor';
import { Button } from '@/components/ui/button';
import { Container } from '@/components/container';
import { Surface } from '@/components/ui/surface';
import { Ionicons } from '@expo/vector-icons';
import { withUniwind } from 'uniwind';

const StyledView = withUniwind(View);
const StyledText = withUniwind(Text);
const StyledTouchableOpacity = withUniwind(TouchableOpacity);

export default function CustomersScreen() {
  const router = useRouter();
  const { customers, isLoading, error, fetchCustomers } = useCustomers();
  const colors = useThemeColor();

  useEffect(() => {
    fetchCustomers();
  }, []);

  const getInitials = (name: string) => {
    return name.substring(0, 2).toUpperCase();
  };

  const renderCustomer = ({ item }: { item: Customer }) => {
    return (
      <StyledTouchableOpacity onPress={() => {/* router.push({ pathname: '/customers/[id]', params: { id: item.id } }) */}}>
        <Surface variant="outline" className="flex-row items-center p-4 mb-3">
          <StyledView className="w-12 h-12 rounded-full bg-secondary-container justify-center items-center mr-4">
            <StyledText className="text-on-secondary-container font-bold text-body-lg">{getInitials(item.name)}</StyledText>
          </StyledView>
          <StyledView className="flex-1">
            <StyledText className="text-base font-semibold text-on-surface mb-1">{item.name}</StyledText>
            {item.phone && <StyledText className="text-body-sm text-on-surface-variant mb-1">{item.phone}</StyledText>}
            {item.email && <StyledText className="text-body-sm text-outline">{item.email}</StyledText>}
          </StyledView>
          <Ionicons name="chevron-forward" size={20} color={colors.outline} />
        </Surface>
      </StyledTouchableOpacity>
    );
  };

  if (isLoading && customers?.length === 0) {
    return (
      <Container isScrollable={false} className="bg-background pt-12 items-center justify-center">
        <ActivityIndicator size="large" color={colors.primary} />
      </Container>
    );
  }

  if (error && customers?.length === 0) {
    return (
      <Container isScrollable={false} className="bg-background pt-12 items-center justify-center p-6">
        <StyledText className="text-error text-center mb-4 text-body-lg">{error}</StyledText>
        <Button onPress={() => fetchCustomers()}>
          Retry
        </Button>
      </Container>
    );
  }

  return (
    <Container isScrollable={false} className="bg-background pt-12">
      <StyledView className="flex-row justify-between items-center px-6 py-4 mt-2">
        <StyledText className="text-4xl font-black text-on-surface tracking-tight">Customers</StyledText>
      </StyledView>

      <FlatList
        data={customers}
        keyExtractor={(item) => item.id}
        renderItem={renderCustomer}
        contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 100 }}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={fetchCustomers} tintColor={colors.primary} colors={[colors.primary]} />
        }
        ListEmptyComponent={
          <StyledView className="items-center mt-24">
            <Ionicons name="people-outline" size={64} color={colors.emptyStateIcon} />
            <StyledText className="text-base text-on-surface-variant mt-4 text-center">No customers yet. Add your first customer!</StyledText>
            <Button
              size="lg"
              className="mt-6"
              onPress={() => {/* router.push('/customers/add') */}}
            >
              Add Customer
            </Button>
          </StyledView>
        }
      />

      <StyledTouchableOpacity
        className="absolute bottom-8 right-6 w-14 h-14 rounded-full bg-primary justify-center items-center shadow-md shadow-black/30 elevation-5"
        onPress={() => {/* router.push('/customers/add') */}}
      >
        <Ionicons name="add" size={30} color={colors.onPrimary} />
      </StyledTouchableOpacity>
    </Container>
  );
}
