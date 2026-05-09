import { useState, useEffect } from 'react';
import { apiRequest } from '../lib/api';
import { useAuthStore } from '../stores/authStore';

export interface Product {
  id: string;
  name: string;
  description?: string;
  sku?: string;
  category?: string;
  price: number;
  costPrice?: number;
  quantity: number;
  lowStockThreshold?: number;
  imageUrl?: string;
  isActive: boolean;
}

export interface ProductsResponse {
  data: {
    products: Product[];
    pagination: {
      total: number;
      page: number;
      limit: number;
    };
  };
}

export function useProducts() {
  const { accessToken } = useAuthStore();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProducts = async (query: Record<string, string> = {}) => {
    setIsLoading(true);
    setError(null);
    try {
      const queryString = new URLSearchParams(query).toString();
      const result = await apiRequest<{ products: Product[], pagination: any }>(
        `/products${queryString ? `?${queryString}` : ''}`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (result.success && result.data) {
        setProducts(result.data.products);
      } else {
        setError(result.error?.message || 'Failed to fetch products');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const addProduct = async (productData: Partial<Product>) => {
    setIsLoading(true);
    try {
      const result = await apiRequest<Product>('/products', {
        method: 'POST',
        body: JSON.stringify(productData),
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (result.success && result.data) {
        await fetchProducts();
        return result.data;
      } else {
        throw new Error(result.error?.message || 'Failed to add product');
      }
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const updateProduct = async (productId: string, productData: Partial<Product>) => {
    setIsLoading(true);
    try {
      const result = await apiRequest<Product>(`/products/${productId}`, {
        method: 'PUT',
        body: JSON.stringify(productData),
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (result.success && result.data) {
        await fetchProducts();
        return result.data;
      } else {
        throw new Error(result.error?.message || 'Failed to update product');
      }
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const deleteProduct = async (productId: string) => {
    setIsLoading(true);
    try {
      const result = await apiRequest<any>(`/products/${productId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (result.success) {
        await fetchProducts();
        return true;
      } else {
        throw new Error(result.error?.message || 'Failed to delete product');
      }
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const adjustStock = async (productId: string, quantity: number) => {
    setIsLoading(true);
    try {
      const result = await apiRequest<Product>(`/products/${productId}/stock`, {
        method: 'PATCH',
        body: JSON.stringify({ quantity }),
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (result.success && result.data) {
        await fetchProducts();
        return result.data;
      } else {
        throw new Error(result.error?.message || 'Failed to adjust stock');
      }
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    products,
    isLoading,
    error,
    fetchProducts,
    addProduct,
    updateProduct,
    deleteProduct,
    adjustStock,
  };
}
