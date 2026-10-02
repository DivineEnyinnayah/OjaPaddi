import { useState } from 'react';
import { apiRequest, apiFormDataRequest } from '../lib/api';

export interface Product {
  id: string;
  businessId: string;
  name: string;
  description?: string;
  sku?: string;
  category?: string;
  price: string;
  costPrice?: string;
  quantity: number;
  lowStockThreshold: number;
  imageUrl?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ProductsResponse {
  products: Product[];
  pagination: {
    total: number;
    page: number;
    limit: number;
  };
}

export interface ProductInput {
  name: string;
  description?: string;
  sku?: string;
  category?: string;
  price: number;
  costPrice?: number;
  quantity: number;
  lowStockThreshold?: number;
}

export function useProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [currentProduct, setCurrentProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProducts = async (query: Record<string, string> = {}) => {
    setIsLoading(true);
    setError(null);
    try {
      const queryString = new URLSearchParams(query).toString();
      const result = await apiRequest<ProductsResponse>(
        `/products${queryString ? `?${queryString}` : ''}`,
        {
          method: 'GET',
        }
      );

      if (result.success && result.data) {
        setProducts(result.data.products || []);
      } else {
        setError(result.error?.message || 'Failed to fetch products');
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchProductById = async (productId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await apiRequest<Product>(`/products/${productId}`, {
        method: 'GET',
      });

      if (result.success && result.data) {
        setCurrentProduct(result.data);
        return result.data;
      } else {
        setError(result.error?.message || 'Failed to fetch product');
        return null;
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const addProduct = async (productData: ProductInput) => {
    setIsLoading(true);
    try {
      const result = await apiRequest<Product>('/products', {
        method: 'POST',
        body: JSON.stringify(productData),
      });

      if (result.success && result.data) {
        // Non-critical: refresh the list in the background, don't let it mask success
        fetchProducts().catch(() => {});
        return result.data;
      } else {
        throw new Error(result.error?.message || 'Failed to add product');
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const updateProduct = async (productId: string, productData: Partial<ProductInput>) => {
    setIsLoading(true);
    try {
      const result = await apiRequest<Product>(`/products/${productId}`, {
        method: 'PUT',
        body: JSON.stringify(productData),
      });

      if (result.success && result.data) {
        fetchProducts().catch(() => {});
        return result.data;
      } else {
        throw new Error(result.error?.message || 'Failed to update product');
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const deleteProduct = async (productId: string) => {
    setIsLoading(true);
    try {
      const result = await apiRequest<null>(`/products/${productId}`, {
        method: 'DELETE',
      });

      if (result.success) {
        fetchProducts().catch(() => {});
        return true;
      } else {
        throw new Error(result.error?.message || 'Failed to delete product');
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const uploadProductImage = async (productId: string, imageUri: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const fileName = imageUri.split('/').pop() || 'image.jpg';
      const match = /\.(\\w+)$/.exec(fileName);
      const type = match ? `image/${match[1]}` : 'image/jpeg';

      const formData = new FormData();
      formData.append('image', {
        uri: imageUri,
        name: fileName,
        type,
      } as unknown as Blob);

      const result = await apiFormDataRequest<Product>(
        `/products/${productId}/image`,
        formData
      );

      if (result.success && result.data) {
        fetchProducts().catch(() => {});
        return result.data;
      } else {
        throw new Error(result.error?.message || 'Failed to upload image');
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An error occurred');
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
      });

      if (result.success && result.data) {
        fetchProducts().catch(() => {});
        return result.data;
      } else {
        throw new Error(result.error?.message || 'Failed to adjust stock');
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    products,
    currentProduct,
    isLoading,
    error,
    fetchProducts,
    fetchProductById,
    addProduct,
    updateProduct,
    deleteProduct,
    adjustStock,
    uploadProductImage,
  };
}
