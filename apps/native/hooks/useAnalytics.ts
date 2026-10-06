import { useState, useCallback } from 'react';
import { apiRequest } from '../lib/api';
import { useAuthStore } from '../stores/authStore';

export interface AnalyticsSummary {
  totalRevenue: number;
  totalSalesCount: number;
  totalExpenses: number;
  netProfit: number;
  topProducts: {
    id?: string;
    name: string;
    revenue: number;
    quantitySold: number;
    returnsCount?: number;
  }[];
  lowStockCount: number;
  totalProducts: number;
}

export interface ProductAnalytics {
  product: {
    id: string;
    name: string;
    price: string;
    quantity: number;
    category?: string;
  };
  totalSold: number;
  totalReturned: number;
  grossRevenue: number;
  netRevenue: number;
  orderCount: number;
}

export interface SupermarketAnalytics {
  supermarket: {
    id: string;
    name: string;
    phone?: string;
    address?: string;
    customerType?: string;
    expectedPaymentPeriodDays?: number;
  };
  totalOrders: number;
  totalBilled: number;
  totalPaid: number;
  totalReturnsAmount: number;
  netReceivable: number;
  productsSupplied: {
    productId: string;
    productName: string;
    quantitySupplied: number;
    quantityReturned: number;
    netDelivered: number;
    totalValue: number;
  }[];
}

export interface RevenueChartPoint {
  date: string;
  revenue: number;
  count: number;
}

export function useAnalytics() {
  const { accessToken } = useAuthStore();
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSummary = useCallback(async (query: { from?: string; to?: string } = {}) => {
    setIsLoading(true);
    setError(null);
    try {
      const queryString = new URLSearchParams(query as Record<string, string>).toString();
      const result = await apiRequest<AnalyticsSummary>(
        `/analytics/summary${queryString ? `?${queryString}` : ''}`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (result.success && result.data) {
        setSummary(result.data);
      } else {
        setError(result.error?.message || 'Failed to fetch analytics summary');
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  }, [accessToken]);

  const fetchRevenueChart = useCallback(async (query: { from?: string; to?: string } = {}) => {
    try {
      const queryString = new URLSearchParams(query as Record<string, string>).toString();
      const result = await apiRequest<RevenueChartPoint[]>(
        `/analytics/revenue-chart${queryString ? `?${queryString}` : ''}`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (result.success && result.data) {
        return result.data;
      }
      return null;
    } catch (err: unknown) {
      return null;
    }
  }, [accessToken]);

  const fetchProductAnalytics = useCallback(async (productId: string) => {
    try {
      const result = await apiRequest<ProductAnalytics>(`/analytics/product/${productId}`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      if (result.success && result.data) return result.data;
      return null;
    } catch {
      return null;
    }
  }, [accessToken]);

  const fetchSupermarketAnalytics = useCallback(async (supermarketId: string) => {
    try {
      const result = await apiRequest<SupermarketAnalytics>(`/analytics/supermarket/${supermarketId}`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      if (result.success && result.data) return result.data;
      return null;
    } catch {
      return null;
    }
  }, [accessToken]);

  return {
    summary,
    isLoading,
    error,
    fetchSummary,
    fetchRevenueChart,
    fetchProductAnalytics,
    fetchSupermarketAnalytics,
  };
}
