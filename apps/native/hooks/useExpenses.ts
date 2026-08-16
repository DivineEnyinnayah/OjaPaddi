import { useState, useCallback } from 'react';
import { apiRequest } from '../lib/api';

export interface Expense {
  id: string;
  description: string;
  amount: string;
  category?: string;
  isRecurring?: boolean;
  recurringFrequency?: 'weekly' | 'monthly' | 'yearly';
  dueDate?: string | null;
  isPaid?: boolean;
  reminderDaysBefore?: number;
  incurredAt: string;
  businessId: string;
  createdAt: string;
  updatedAt?: string;
}

export function useExpenses() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchExpenses = useCallback(async (query: Record<string, string> = {}) => {
    setIsLoading(true);
    setError(null);
    try {
      const queryString = new URLSearchParams(query).toString();
      const result = await apiRequest<Expense[]>(
        `/expenses${queryString ? `?${queryString}` : ''}`,
        {
          method: 'GET',
        }
      );

      if (result.success && result.data) {
        setExpenses(result.data);
      } else {
        setError(result.error?.message || 'Failed to fetch expenses');
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createExpense = useCallback(async (expenseData: {
    description: string;
    amount: number;
    category?: string;
    isRecurring?: boolean;
    recurringFrequency?: 'weekly' | 'monthly' | 'yearly';
    dueDate?: string;
    isPaid?: boolean;
    reminderDaysBefore?: number;
    incurredAt?: string;
  }) => {
    setIsLoading(true);
    try {
      const result = await apiRequest<Expense>('/expenses', {
        method: 'POST',
        body: JSON.stringify(expenseData),
      });

      if (result.success && result.data) {
        await fetchExpenses();
        return result.data;
      } else {
        throw new Error(result.error?.message || 'Failed to create expense');
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [fetchExpenses]);

  const getExpenseById = useCallback(async (expenseId: string) => {
    setIsLoading(true);
    try {
      const result = await apiRequest<Expense>(`/expenses/${expenseId}`, {
        method: 'GET',
      });

      if (result.success && result.data) {
        return result.data;
      } else {
        throw new Error(result.error?.message || 'Failed to fetch expense');
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateExpense = useCallback(async (expenseId: string, expenseData: Partial<Expense>) => {
    setIsLoading(true);
    try {
      const result = await apiRequest<Expense>(`/expenses/${expenseId}`, {
        method: 'PUT',
        body: JSON.stringify(expenseData),
      });

      if (result.success && result.data) {
        await fetchExpenses();
        return result.data;
      } else {
        throw new Error(result.error?.message || 'Failed to update expense');
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [fetchExpenses]);

  const deleteExpense = useCallback(async (expenseId: string) => {
    setIsLoading(true);
    try {
      const result = await apiRequest<null>(`/expenses/${expenseId}`, {
        method: 'DELETE',
      });

      if (result.success) {
        await fetchExpenses();
        return true;
      } else {
        throw new Error(result.error?.message || 'Failed to delete expense');
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [fetchExpenses]);

  return {
    expenses,
    isLoading,
    error,
    fetchExpenses,
    createExpense,
    getExpenseById,
    updateExpense,
    deleteExpense,
  };
}
