import { useState } from 'react';
import { apiRequest, apiFormDataRequest } from '../lib/api';

export interface Business {
  id: string;
  userId: string;
  name: string;
  slug?: string;
  description?: string;
  category?: string;
  logoUrl?: string;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  state?: string;
  country: string;
  currency: string;
  whatsappNumber?: string;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateBusinessPayload {
  name?: string;
  category?: string;
  whatsappNumber?: string;
  city?: string;
  state?: string;
  logoUrl?: string;
}

export function useBusiness() {
  const [business, setBusiness] = useState<Business | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchBusiness = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await apiRequest<Business>('/business', {
        method: 'GET',
      });

      if (result.success && result.data) {
        setBusiness(result.data);
      } else {
        setError(result.error?.message || 'Failed to fetch business profile');
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const updateBusiness = async (data: UpdateBusinessPayload) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await apiRequest<Business>('/business', {
        method: 'PUT',
        body: JSON.stringify(data),
      });

      if (result.success && result.data) {
        setBusiness(result.data);
        return result.data;
      } else {
        throw new Error(result.error?.message || 'Failed to update business profile');
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const uploadLogo = async (imageUri: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const fileName = imageUri.split('/').pop() || 'logo.jpg';
      const match = /\.(\\w+)$/.exec(fileName);
      const type = match ? `image/${match[1]}` : 'image/jpeg';

      const formData = new FormData();
      formData.append('logo', {
        uri: imageUri,
        name: fileName,
        type,
      } as unknown as Blob);

      const result = await apiFormDataRequest<{ logoUrl: string }>(
        '/business/logo',
        formData
      );

      if (result.success && result.data) {
        setBusiness((prev) =>
          prev ? { ...prev, logoUrl: result.data!.logoUrl } : prev
        );
        return result.data.logoUrl;
      } else {
        throw new Error(result.error?.message || 'Failed to upload logo');
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    business,
    isLoading,
    error,
    fetchBusiness,
    updateBusiness,
    uploadLogo,
  };
}
