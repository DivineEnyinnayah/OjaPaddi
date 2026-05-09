import { useState } from 'react';
import { apiRequest } from '../lib/api';

export interface Expense {
  id: string;
  description: string;
  amount: string;
  category?: string;
  incurredAt: string;
  businessId: string;
  createdAt: string;
  updatedAt: string;
}

export interface ExpensesResponse {
  data: Expense[];
}

export function useExpenses() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchExpenses = async (query: Record<string, string> = {}) => {
    setIsLoading(true);
    setError(null);
    try {
      const queryString = new URLSearchParams(query).toString();
      const result = await apiRequest<ExpensesResponse>(
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
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const createExpense = async (expenseData: {
    description: string;
    amount: number;
    category?: string;
    incurredAt: string;
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
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const getExpenseById = async (expenseId: string) => {
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
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const updateExpense = async (expenseId: string, expenseData: Partial<Expense>) => {
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
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const deleteExpense = async (expenseId: string) => {
    setIsLoading(true);
    try {
      const result = await apiRequest<any>(`/expenses/${expenseId}`, {
        method: 'DELETE',
      });

      if (result.success) {
        await fetchExpenses();
        return true;
      } else {
        throw new Error(result.error?.message || 'Failed to delete expense');
      }
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

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
