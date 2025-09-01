import { client } from '@/lib/hono';
import { useQuery } from '@tanstack/react-query';

// Use a loosely-typed client locally to avoid TS issues with generated Hono client types
const api = client as any;

// Loosen response types to avoid coupling to client typings
type VendorProfileResponseType = any;
type VendorListResponseType = any;
type VendorAllResponseType = any;
type VendorDetailResponseType = any;

// GET /api/vendor/profile - current vendor profile
export const useVendorProfile = () => {
  return useQuery<VendorProfileResponseType, Error>({
    queryKey: ['vendor-profile'],
    queryFn: async () => {
  const response = await api.vendor.profile.$get();

      if (!response.ok) {
        throw new Error('Failed to fetch vendor profile');
      }

      return response.json();
    },
  });
};

// GET /api/vendor - Admin only: list all vendors with KYC
export const useVendorList = (search?: string) => {
  return useQuery<VendorListResponseType, Error>({
    queryKey: ['vendors-admin', search],
    queryFn: async () => {
  const response = await api.vendor.$get({
        query: search ? { search } : undefined,
      });

      if (!response.ok) {
        throw new Error('Failed to fetch vendors');
      }

      return response.json();
    },
  });
};

// GET /api/vendor/all - Public vendors list (pagination support)
export const useVendorAll = (page?: number, limit?: number, search?: string) => {
  return useQuery<VendorAllResponseType, Error>({
    queryKey: ['vendors-public', page, limit, search],
    queryFn: async () => {
  const response = await api.vendor.all.$get({
        query: {
          ...(page && { page: page.toString() }),
          ...(limit && { limit: limit.toString() }),
          ...(search && { search }),
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch public vendors');
      }

      return response.json();
    },
  });
};

// GET /api/vendor/:id - Get vendor details by ID
export const useVendorDetail = (id: string) => {
  return useQuery<VendorDetailResponseType, Error>({
    queryKey: ['vendor', id],
    queryFn: async () => {
  const response = await api.vendor[':id'].$get({
        param: { id },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch vendor details');
      }

      return response.json();
    },
    enabled: !!id, // Only run query if id is provided
  });
};
