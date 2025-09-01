import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

// Types for KYC operations
interface KycUploadResponse {
  success: boolean;
  public_id: string;
  asset_id: string;
}

interface KycSignedUrlResponse {
  signedUrl: string;
}

interface KycDeleteResponse {
  success: boolean;
}

// KYC document upload hook
export const useKycUpload = () => {
  const queryClient = useQueryClient();

  return useMutation<KycUploadResponse, Error, { file: File; documentType: 'CNIC' | 'PASSPORT' | 'LICENSE' }>({
    mutationFn: async ({ file, documentType }) => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('documentType', documentType);

      const response = await fetch('/api/kyc/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to upload KYC document');
      }

      return await response.json();
    },
    onSuccess: () => {
      toast.success('KYC document uploaded successfully!');
      // Invalidate vendor profile to refresh KYC status
      queryClient.invalidateQueries({ queryKey: ['vendor-profile'] });
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to upload KYC document');
    },
  });
};

// KYC signed URL hook (for secure viewing)
export const useKycSignedUrl = () => {
  return useMutation<KycSignedUrlResponse, Error, { public_id: string }>({
    mutationFn: async ({ public_id }) => {
      const response = await fetch('/api/kyc/signed-url', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ public_id }),
      });

      if (!response.ok) {
        throw new Error('Failed to get signed URL');
      }

      return await response.json();
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to get signed URL');
    },
  });
};

// KYC document delete hook
export const useKycDelete = () => {
  const queryClient = useQueryClient();

  return useMutation<KycDeleteResponse, Error, { public_id: string }>({
    mutationFn: async ({ public_id }) => {
      const response = await fetch('/api/kyc/delete', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ public_id }),
      });

      if (!response.ok) {
        throw new Error('Failed to delete KYC document');
      }

      return await response.json();
    },
    onSuccess: () => {
      toast.success('KYC document deleted successfully!');
      // Invalidate vendor profile to refresh KYC status
      queryClient.invalidateQueries({ queryKey: ['vendor-profile'] });
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to delete KYC document');
    },
  });
};
