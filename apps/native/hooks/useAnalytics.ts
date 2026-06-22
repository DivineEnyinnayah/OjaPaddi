import { useState, useCallback } from 'react';
import { apiRequest } from '../lib/api';
import { useAuthStore } from '../stores/authStore';

export interface AnalyticsSummary {
  totalRevenue: number;
  totalSalesCount: number;
  totalExpenses: number;
  netProfit: number;
  topProducts: {
    name: string;
    revenue: number;
    quantitySold: number;
  }[];
  lowStockCount: number;
  totalProducts: number;
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

  return {
    summary,
    isLoading,
    error,
    fetchSummary,
  };
}
