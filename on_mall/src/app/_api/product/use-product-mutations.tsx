import { client } from '@/lib/hono';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

// Use a loosely-typed client locally to avoid TS issues with generated Hono client types
const api = client as any;

// Loosen request/response types to any to decouple from client typings
type CreateProductResponseType = any;
type CreateProductRequestType = any;

type UpdateProductResponseType = any;
type UpdateProductRequestType = any;

type DeleteProductResponseType = any;
type DeleteProductRequestType = any;

// POST /api/product - Create product
export const useCreateProduct = () => {
  const queryClient = useQueryClient();

  return useMutation<CreateProductResponseType, Error, CreateProductRequestType>({
    mutationFn: async (values) => {
  const response: any = await api.product.$post({
        json: values,
      });

      if (!response.ok) {
        throw new Error('Failed to create product');
      }

      return await response.json();
    },
    onSuccess: (data) => {
      toast.success('Product created successfully!');
      // Invalidate products list and vendor profile
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['vendor-profile'] });
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to create product');
    },
  });
};

// PATCH /api/product - Update product (ID in body)
export const useUpdateProduct = () => {
  const queryClient = useQueryClient();

  return useMutation<UpdateProductResponseType, Error, UpdateProductRequestType>({
    mutationFn: async (values) => {
  const response: any = await api.product.$patch({
        json: values,
      });

      if (!response.ok) {
        throw new Error('Failed to update product');
      }

      return await response.json();
    },
    onSuccess: (data, variables) => {
      toast.success('Product updated successfully!');
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['product', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['vendor-profile'] });
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to update product');
    },
  });
};

// DELETE /api/product - Delete product (ID in body)
export const useDeleteProduct = () => {
  const queryClient = useQueryClient();

  return useMutation<DeleteProductResponseType, Error, DeleteProductRequestType>({
    mutationFn: async (values) => {
  const response: any = await api.product.$delete({
        json: values,
      });

      if (!response.ok) {
        throw new Error('Failed to delete product');
      }

      return await response.json();
    },
    onSuccess: (data, variables) => {
      toast.success('Product deleted successfully!');
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['product', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['vendor-profile'] });
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to delete product');
    },
  });
};

// Convenience hook for updating product images
export const useUpdateProductImages = () => {
  const updateProduct = useUpdateProduct();

  return useMutation<UpdateProductResponseType, Error, { id: string; images: Array<{ url: string; public_id: string }> }>({
    mutationFn: async ({ id, images }) => {
      return updateProduct.mutateAsync({
        id,
        images,
      });
    },
    onSuccess: () => {
      toast.success('Product images updated successfully!');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to update product images');
    },
  });
};

// Convenience hook for updating product video
export const useUpdateProductVideo = () => {
  const updateProduct = useUpdateProduct();

  return useMutation<UpdateProductResponseType, Error, { id: string; video: { url: string; public_id: string } | null }>({
    mutationFn: async ({ id, video }) => {
      return updateProduct.mutateAsync({
        id,
        video,
      });
    },
    onSuccess: () => {
      toast.success('Product video updated successfully!');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to update product video');
    },
  });
};
