import { useState, useEffect } from 'react';
import { apiRequest } from '../lib/api';
import { useAuthStore } from '../stores/authStore';

export interface SaleItem {
  productId: string;
  productName: string;
  unitPrice: number;
  costPrice?: number;
  quantity: number;
  total: number;
}

export interface Sale {
  id: string;
  reference: string;
  customerId?: string;
  subtotal: string;
  discount: string;
  total: string;
  paymentMethod: 'cash' | 'transfer' | 'pos' | 'other';
  paymentStatus: 'paid' | 'partial' | 'unpaid';
  amountPaid: string;
  notes?: string;
  soldAt: string;
  items: SaleItem[];
}

export interface SalesResponse {
  data: {
    sales: Sale[];
    pagination: {
      total: number;
      page: number;
      limit: number;
    };
  };
}

export function useSales() {
  const { accessToken } = useAuthStore();
  const [sales, setSales] = useState<Sale[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSales = async (query: Record<string, string> = {}) => {
    setIsLoading(true);
    setError(null);
    try {
      const queryString = new URLSearchParams(query).toString();
      const result = await apiRequest<SalesResponse>(
        `/sales${queryString ? `?${queryString}` : ''}`,
        {
          method: 'GET',
        }
      );

      if (result.success && result.data) {
        setSales(result.data.sales);
      } else {
        setError(result.error?.message || 'Failed to fetch sales');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const createSale = async (saleData: {
    customerId?: string;
    items: {
      productId: string;
      quantity: number;
      unitPrice: number;
    }[];
    discount?: number;
    paymentMethod: 'cash' | 'transfer' | 'pos' | 'other';
    paymentStatus: 'paid' | 'partial' | 'unpaid';
    amountPaid: number;
    notes?: string;
  }) => {
    setIsLoading(true);
    try {
      const result = await apiRequest<Sale>('/sales', {
        method: 'POST',
        body: JSON.stringify(saleData),
      });

      if (result.success && result.data) {
        await fetchSales();
        return result.data;
      } else {
        throw new Error(result.error?.message || 'Failed to create sale');
      }
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const getSaleById = async (saleId: string) => {
    setIsLoading(true);
    try {
      const result = await apiRequest<Sale>(`/sales/${saleId}`, {
        method: 'GET',
      });

      if (result.success && result.data) {
        return result.data;
      } else {
        throw new Error(result.error?.message || 'Failed to fetch sale');
      }
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const voidSale = async (saleId: string) => {
    setIsLoading(true);
    try {
      const result = await apiRequest<any>(`/sales/${saleId}`, {
        method: 'DELETE',
      });

      if (result.success) {
        await fetchSales();
        return true;
      } else {
        throw new Error(result.error?.message || 'Failed to void sale');
      }
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    sales,
    isLoading,
    error,
    fetchSales,
    createSale,
    getSaleById,
    voidSale,
  };
}
