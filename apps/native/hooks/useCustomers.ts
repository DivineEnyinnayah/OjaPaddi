import { useState } from 'react';
import { apiRequest } from '../lib/api';

export interface Customer {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  notes?: string;
  customerType?: 'individual' | 'supermarket';
  expectedPaymentPeriodDays?: number;
  suppliedProductIds?: string[];
  businessId: string;
  createdAt: string;
  updatedAt: string;
  totalSpent?: string;
  orderCount?: number;
}

export interface CustomersResponse {
  customers: Customer[];
  pagination: {
    total: number;
    page: number;
    limit: number;
  };
}

export function useCustomers() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCustomers = async (query: Record<string, string> = {}) => {
    setIsLoading(true);
    setError(null);
    try {
      const queryString = new URLSearchParams(query).toString();
      const result = await apiRequest<CustomersResponse>(
        `/customers${queryString ? `?${queryString}` : ''}`,
        {
          method: 'GET',
        }
      );

      if (result.success && result.data) {
        setCustomers(result.data.customers);
      } else {
        setError(result.error?.message || 'Failed to fetch customers');
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const createCustomer = async (customerData: {
    name: string;
    phone?: string;
    email?: string;
    address?: string;
    notes?: string;
    customerType?: 'individual' | 'supermarket';
    expectedPaymentPeriodDays?: number;
    suppliedProductIds?: string[];
  }) => {
    setIsLoading(true);
    try {
      const result = await apiRequest<Customer>('/customers', {
        method: 'POST',
        body: JSON.stringify(customerData),
      });

      if (result.success && result.data) {
        await fetchCustomers();
        return result.data;
      } else {
        throw new Error(result.error?.message || 'Failed to create customer');
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const getCustomerById = async (customerId: string) => {
    setIsLoading(true);
    try {
      const result = await apiRequest<Customer>(`/customers/${customerId}`, {
        method: 'GET',
      });

      if (result.success && result.data) {
        return result.data;
      } else {
        throw new Error(result.error?.message || 'Failed to fetch customer');
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const updateCustomer = async (customerId: string, customerData: Partial<Customer>) => {
    setIsLoading(true);
    try {
      const result = await apiRequest<Customer>(`/customers/${customerId}`, {
        method: 'PUT',
        body: JSON.stringify(customerData),
      });

      if (result.success && result.data) {
        await fetchCustomers();
        return result.data;
      } else {
        throw new Error(result.error?.message || 'Failed to update customer');
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const deleteCustomer = async (customerId: string) => {
    setIsLoading(true);
    try {
      const result = await apiRequest<null>(`/customers/${customerId}`, {
        method: 'DELETE',
      });

      if (result.success) {
        await fetchCustomers();
        return true;
      } else {
        throw new Error(result.error?.message || 'Failed to delete customer');
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    customers,
    isLoading,
    error,
    fetchCustomers,
    createCustomer,
    getCustomerById,
    updateCustomer,
    deleteCustomer,
  };
}
