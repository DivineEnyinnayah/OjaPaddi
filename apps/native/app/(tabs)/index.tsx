import React, { useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, ActivityIndicator, SafeAreaView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../stores/authStore';
import { useAnalytics } from '../../hooks/useAnalytics';

export default function HomeScreen() {
  const { user } = useAuthStore();
  const { summary, isLoading, fetchSummary, error } = useAnalytics();
  const router = useRouter();

  const loadData = useCallback(() => {
    fetchSummary();
  }, [fetchSummary]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const formatCurrency = (amount: number) => {
    return `₦${amount.toLocaleString('en-NG', { minimumFractionDigits: 2 })}`;
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Hello, {user?.fullName?.split(' ')[0] || 'Seller'} 👋</Text>
          <Text style={styles.subtitle}>Here's how your business is doing</Text>
        </View>
        <TouchableOpacity style={styles.profileBtn} onPress={() => router.push('/more')}>
          <View style={styles.profileAvatar}>
            <Text style={styles.profileInitials}>{user?.fullName?.charAt(0).toUpperCase() || 'O'}</Text>
          </View>
        </TouchableOpacity>
      </View>

      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isLoading && !!summary} onRefresh={loadData} colors={['#1A6B3C']} />}
      >
        {isLoading && !summary ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#1A6B3C" />
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryBtn} onPress={loadData}>
              <Text style={styles.retryText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : summary ? (
          <>
            <View style={styles.cardsGrid}>
              <View style={[styles.card, styles.cardPrimary]}>
                <Text style={styles.cardLabelWhite}>Total Revenue</Text>
                <Text style={styles.cardValueWhite}>{formatCurrency(summary.totalRevenue)}</Text>
              </View>

              <View style={[styles.card, styles.cardSecondary]}>
                <Text style={styles.cardLabelDark}>Net Profit</Text>
                <Text style={styles.cardValueDark}>{formatCurrency(summary.netProfit)}</Text>
              </View>

              <View style={[styles.card, styles.cardOutline]}>
                <Text style={styles.cardLabelDark}>Total Sales</Text>
                <Text style={styles.cardValueDark}>{summary.totalSalesCount}</Text>
              </View>

              <View style={[styles.card, summary.lowStockCount > 0 ? styles.cardWarning : styles.cardOutline]}>
                <Text style={summary.lowStockCount > 0 ? styles.cardLabelWarning : styles.cardLabelDark}>Low Stock Items</Text>
                <Text style={summary.lowStockCount > 0 ? styles.cardValueWarning : styles.cardValueDark}>{summary.lowStockCount}</Text>
              </View>
            </View>

            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Top Products</Text>
              </View>

              {summary.topProducts?.length === 0 ? (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyStateText}>No sales recorded yet.</Text>
                </View>
              ) : (
                <View style={styles.listContainer}>
                  {summary.topProducts?.map((product, index) => (
                    <View key={index} style={styles.listItem}>
                      <View style={styles.listItemLeft}>
                        <View style={styles.listItemRank}>
                          <Text style={styles.listItemRankText}>{index + 1}</Text>
                        </View>
                        <View>
                          <Text style={styles.listItemTitle}>{product.name}</Text>
                          <Text style={styles.listItemSubtitle}>{product.quantitySold} sold</Text>
                        </View>
                      </View>
                      <Text style={styles.listItemAmount}>{formatCurrency(product.revenue)}</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          </>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginHorizontal: 12,
    marginTop: 48,
    backgroundColor: '#F7FAF3', // Market Core Background
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    paddingTop: 20,
  },
  greeting: {
    fontSize: 24,
    fontWeight: '700',
    color: '#181D19', // on-surface
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    color: '#404940', // on-surface-variant
    marginTop: 4,
  },
  profileBtn: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  profileAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#1A6B3C',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileInitials: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 40,
    paddingTop: 10,
  },
  loadingContainer: {
    marginTop: 100,
    alignItems: 'center',
  },
  errorContainer: {
    marginTop: 100,
    alignItems: 'center',
    padding: 24,
  },
  errorText: {
    color: '#BA1A1A',
    textAlign: 'center',
    marginBottom: 16,
    fontSize: 16,
  },
  retryBtn: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#1A6B3C',
    borderRadius: 12,
  },
  retryText: {
    color: '#FFF',
    fontWeight: '600',
  },
  cardsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 32,
  },
  card: {
    width: '48%',
    padding: 16,
    borderRadius: 16, // Market Core shape
    justifyContent: 'space-between',
    minHeight: 110,
  },
  cardPrimary: {
    backgroundColor: '#1A6B3C', // Primary Green
  },
  cardSecondary: {
    backgroundColor: '#E8F5E9', // Light Green Variant
  },
  cardOutline: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  cardWarning: {
    backgroundColor: '#FFF8E1',
    borderWidth: 1,
    borderColor: '#FFE082',
  },
  cardLabelWhite: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '600',
    marginBottom: 12,
  },
  cardValueWhite: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  cardLabelDark: {
    fontSize: 13,
    color: '#404940',
    fontWeight: '600',
    marginBottom: 12,
  },
  cardValueDark: {
    fontSize: 22,
    fontWeight: '800',
    color: '#181D19',
  },
  cardLabelWarning: {
    fontSize: 13,
    color: '#B28C09',
    fontWeight: '600',
    marginBottom: 12,
  },
  cardValueWarning: {
    fontSize: 22,
    fontWeight: '800',
    color: '#B28C09',
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#181D19',
  },
  emptyState: {
    padding: 32,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
  },
  emptyStateText: {
    color: '#6B7280',
    fontSize: 14,
  },
  listContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  listItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  listItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  listItemRank: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  listItemRankText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#4B5563',
  },
  listItemTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#181D19',
    marginBottom: 2,
  },
  listItemSubtitle: {
    fontSize: 13,
    color: '#6B7280',
  },
  listItemAmount: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1A6B3C',
  },
});
