import { client } from '@/lib/hono';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

// Use a loosely-typed client locally to avoid TS issues with generated Hono client types
const api = client as any;

// Loosen request/response types to any to decouple from client typings
type CreateVendorResponseType = any;
type CreateVendorRequestType = any;

type UpdateVendorResponseType = any;
type UpdateVendorRequestType = any;

type ApproveVendorResponseType = any;
type ApproveVendorRequestType = any;

type UpdateKycStatusResponseType = any;
type UpdateKycStatusRequestType = any;

// POST /api/vendor - Create vendor
export const useCreateVendor = () => {
  const queryClient = useQueryClient();

  return useMutation<CreateVendorResponseType, Error, CreateVendorRequestType>({
    mutationFn: async (values) => {
      // Use direct fetch to avoid any client/base URL mismatches
      const res = await fetch('/api/vendor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });

      if (!res.ok) {
        // Surface server error detail if available
        const j = await res.json().catch(() => ({}));
        const msg = j?.error || `Failed to create vendor (status ${res.status})`;
        throw new Error(msg);
      }

      return res.json();
    },
    onSuccess: (data) => {
      toast.success('Vendor profile created successfully!');
      // Invalidate vendor profile and vendor lists
      queryClient.invalidateQueries({ queryKey: ['vendor-profile'] });
      queryClient.invalidateQueries({ queryKey: ['vendors-admin'] });
      queryClient.invalidateQueries({ queryKey: ['vendors-public'] });
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to create vendor');
    },
  });
};

// PUT /api/vendor - Update vendor profile
export const useUpdateVendor = () => {
  const queryClient = useQueryClient();

  return useMutation<UpdateVendorResponseType, Error, UpdateVendorRequestType>({
    mutationFn: async (values) => {
  const response = await api.vendor.$put({
        json: values,
      });

      if (!response.ok) {
        throw new Error('Failed to update vendor');
      }

      return await response.json();
    },
    onSuccess: (data) => {
      toast.success('Vendor profile updated successfully!');
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['vendor-profile'] });
      queryClient.invalidateQueries({ queryKey: ['vendors-admin'] });
      queryClient.invalidateQueries({ queryKey: ['vendors-public'] });
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to update vendor');
    },
  });
};

// PUT /api/vendor/:id/approve - Admin: Approve/reject vendor
export const useApproveVendor = () => {
  const queryClient = useQueryClient();

  return useMutation<ApproveVendorResponseType, Error, ApproveVendorRequestType & { id: string }>({
    mutationFn: async ({ id, ...values }) => {
  const response = await api.vendor[':id']['approve'].$put({
        param: { id },
        json: values,
      });

      if (!response.ok) {
        throw new Error('Failed to update vendor approval');
      }

      return await response.json();
    },
    onSuccess: (data, variables) => {
      toast.success(`Vendor ${variables.approved ? 'approved' : 'rejected'} successfully!`);
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['vendors-admin'] });
      queryClient.invalidateQueries({ queryKey: ['vendors-public'] });
      queryClient.invalidateQueries({ queryKey: ['vendor', variables.id] });
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to update vendor approval');
    },
  });
};

// PUT /api/vendor/:id/kyc-status - Admin: Update KYC status
export const useUpdateKycStatus = () => {
  const queryClient = useQueryClient();

  return useMutation<UpdateKycStatusResponseType, Error, UpdateKycStatusRequestType & { id: string }>({
    mutationFn: async ({ id, ...values }) => {
  const response = await api.vendor[':id']['kyc-status'].$put({
        param: { id },
        json: values,
      });

      if (!response.ok) {
        throw new Error('Failed to update KYC status');
      }

      return await response.json();
    },
    onSuccess: (data, variables) => {
      toast.success(`KYC status updated to ${variables.status} successfully!`);
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['vendors-admin'] });
      queryClient.invalidateQueries({ queryKey: ['vendor', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['vendor-profile'] });
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to update KYC status');
    },
  });
};
