import { useQuery } from '@tanstack/react-query';

type SignedUrlResponse = { url: string };

export async function fetchSignedUrl(public_id: string, mode?: 'preview-image'): Promise<SignedUrlResponse> {
  console.log('Making request to /api/kyc/signed-url with:', { public_id, mode });
  
  const res = await fetch('/api/kyc/signed-url', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ public_id, mode }),
  });
  
  console.log('Response status:', res.status);
  
  if (!res.ok) {
    const j = await res.json().catch(() => ({}));
    console.error('Signed URL error:', j);
    throw new Error(j?.error || 'Failed to get signed URL');
  }
  
  const result = await res.json();
  console.log('Signed URL response:', result);
  return result;
}export function useSignedUrl(public_id?: string, mode?: 'preview-image') {
  return useQuery<SignedUrlResponse, Error>({
    queryKey: ['kyc-signed-url', public_id, mode],
    queryFn: () => {
      console.log('Fetching signed URL for public_id:', public_id, 'mode:', mode);
      return fetchSignedUrl(public_id as string, mode);
    },
    enabled: !!public_id,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}