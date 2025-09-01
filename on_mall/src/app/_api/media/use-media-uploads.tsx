import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';

// Types for media upload responses
interface CloudinaryResponse {
  result: {
    public_id: string;
    secure_url: string;
    url: string;
    [key: string]: any;
  };
}

// Image upload hook
export const useImageUpload = () => {
  return useMutation<CloudinaryResponse, Error, File>({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/image-upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to upload image');
      }

      return await response.json();
    },
    onSuccess: () => {
      toast.success('Image uploaded successfully!');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to upload image');
    },
  });
};

// Video upload hook
export const useVideoUpload = () => {
  return useMutation<CloudinaryResponse, Error, File>({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/video-upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to upload video');
      }

      return await response.json();
    },
    onSuccess: () => {
      toast.success('Video uploaded successfully!');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to upload video');
    },
  });
};

// Multiple images upload hook
export const useMultipleImageUpload = () => {
  return useMutation<CloudinaryResponse[], Error, File[]>({
    mutationFn: async (files: File[]) => {
      const uploadPromises = files.map(async (file) => {
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch('/api/image-upload', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          throw new Error(`Failed to upload image: ${file.name}`);
        }

        return await response.json();
      });

      return await Promise.all(uploadPromises);
    },
    onSuccess: (data) => {
      toast.success(`${data.length} images uploaded successfully!`);
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to upload images');
    },
  });
};
