import { useState, useCallback } from 'react';
import { apiRequest } from '../lib/api';
import { useAuthStore } from '../stores/authStore';

export interface MBARule {
  antecedent: string[];
  consequent: string[];
  antecedentNames: string[];
  consequentNames: string[];
  support: number;
  confidence: number;
  lift: number;
}

export function useMba() {
  const { accessToken } = useAuthStore();
  const [rules, setRules] = useState<MBARule[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRules = useCallback(async (minSupport: number = 0.1, minConfidence: number = 0.5) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await apiRequest<MBARule[]>(
        `/analytics/mba?minSupport=${minSupport}&minConfidence=${minConfidence}`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (result.success && result.data) {
        setRules(result.data);
      } else {
        setError(result.error?.message || 'Failed to fetch association rules');
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  }, [accessToken]);

  return {
    rules,
    isLoading,
    error,
    fetchRules,
  };
}
