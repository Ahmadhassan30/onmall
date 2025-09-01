import { client } from '@/lib/hono';
import { useQuery } from '@tanstack/react-query';

// Use a loosely-typed client locally to avoid TS issues with generated Hono client types
const api = client as any;

// Loosen response types to any to decouple from client typings
type ProductListResponseType = any;
type ProductDetailResponseType = any;

// GET /api/product - List products with pagination
export const useProductList = (
  page?: number,
  limit?: number,
  search?: string,
  categoryId?: string,
  vendorId?: string,
  sort?: 'new' | 'price_asc' | 'price_desc'
) => {
  return useQuery<ProductListResponseType, Error>({
    queryKey: ['products', page, limit, search, categoryId, vendorId, sort],
    queryFn: async () => {
  const response = await api.product.$get({
        query: {
          ...(page && { page: page.toString() }),
          ...(limit && { limit: limit.toString() }),
          ...(search && { search }),
          ...(categoryId && { categoryId }),
          ...(vendorId && { vendorId }),
          ...(sort && { sort }),
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch products');
      }

      return response.json();
    },
  });
};

// GET /api/product/:id - Get product details by ID
export const useProductDetail = (id: string) => {
  return useQuery<ProductDetailResponseType, Error>({
    queryKey: ['product', id],
    queryFn: async () => {
  const response = await api.product[':id'].$get({
        param: { id },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch product details');
      }

      return response.json();
    },
    enabled: !!id, // Only run query if id is provided
  });
};

// Hook for products by vendor (convenience hook)
export const useVendorProducts = (vendorId: string, page?: number, limit?: number) => {
  return useProductList(page, limit, undefined, undefined, vendorId);
};

// Hook for products by category (convenience hook)
export const useCategoryProducts = (categoryId: string, page?: number, limit?: number) => {
  return useProductList(page, limit, undefined, categoryId);
};

// Hook for product search (convenience hook)
export const useProductSearch = (search: string, page?: number, limit?: number) => {
  return useProductList(page, limit, search);
};
