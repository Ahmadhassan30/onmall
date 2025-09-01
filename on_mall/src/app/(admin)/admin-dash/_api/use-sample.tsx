import { client } from '@/lib/hono';
import { useQuery } from '@tanstack/react-query';

// Use a loosely-typed client locally
const api = client as any;
type ResponseType = any;

export const useSampleGet = (errorMessage?: string) => {
  return useQuery<ResponseType, Error>({
    queryKey: ['sample', errorMessage], // unique key for caching
    queryFn: async () => {
  const response = await api.sample.$get({
        query: errorMessage ? { errorMessage } : {},
      });

      if (!response.ok) {
        throw new Error('Failed to fetch sample data');
      }

      return response.json();
    },
  });
};
