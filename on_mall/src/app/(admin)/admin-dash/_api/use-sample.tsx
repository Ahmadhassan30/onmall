import { client } from '@/lib/hono';
import { useQuery } from '@tanstack/react-query';
import { InferResponseType } from 'hono';

// Infer the response type of GET /sample
type ResponseType = InferResponseType<(typeof client.api.sample)['$get']>;

export const useSampleGet = (errorMessage?: string) => {
  return useQuery<ResponseType, Error>({
    queryKey: ['sample', errorMessage], // unique key for caching
    queryFn: async () => {
      const response = await client.api.sample.$get({
        query: errorMessage ? { errorMessage } : {},
      });

      if (!response.ok) {
        throw new Error('Failed to fetch sample data');
      }

      return response.json();
    },
  });
};
