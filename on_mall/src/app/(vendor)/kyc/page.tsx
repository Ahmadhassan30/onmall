"use client";
import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useSignedUrl } from '@/app/_api/kyc/use-kyc-signed-url';

type KycDoc = { id: string; public_id: string; documentType: 'CNIC' | 'PASSPORT' | 'LICENSE' };

export default function MyKycPage() {
  const [kyc, setKyc] = useState<{ status: string; documents: KycDoc[] } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch('/api/kyc/mine');
        if (!res.ok) {
          const j = await res.json().catch(() => ({}));
          throw new Error(j?.error || 'Failed to load KYC');
        }
        const data = await res.json();
        setKyc({ status: data.status, documents: data.documents });
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <div className="container max-w-4xl mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle>My KYC</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading && <div>Loading...</div>}
          {error && <div className="text-red-600">{error}</div>}
          {kyc && (
            <>
              <div>Status: {kyc.status}</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {kyc.documents.map((d) => (
                  <KycPreview key={d.id} doc={d} />
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function KycPreview({ doc }: { doc: KycDoc }) {
  const { data, isLoading, error, refetch } = useSignedUrl(doc.public_id, 'preview-image');
  return (
    <div className="border rounded p-3">
      <div className="mb-2 flex items-center justify-between">
        <div className="font-medium">{doc.documentType}</div>
        <Button size="sm" variant="outline" onClick={() => refetch()} disabled={isLoading}>
          Refresh
        </Button>
      </div>
      {error && <div className="text-red-600 text-sm">{error.message}</div>}
      {isLoading && <div className="text-sm">Loading preview...</div>}
      {data?.url && (
        <img src={data.url} alt={doc.documentType} className="w-full rounded" />
      )}
    </div>
  );
}
