"use client";
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function TestSignedUrlPage() {
  const [publicId, setPublicId] = useState('kyc_temp/kyc_temp/doc_17');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const testSignedUrl = async () => {
    if (!publicId.trim()) {
      setError('Please enter a public_id');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch('/api/kyc/signed-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ public_id: publicId.trim(), mode: 'preview-image' }),
      });

      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || `HTTP ${res.status}`);
      }

      setResult(data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container max-w-2xl mx-auto py-8">
      <Card>
        <CardHeader>
          <CardTitle>Test Signed URL Generation</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Public ID</label>
            <Input
              value={publicId}
              onChange={(e) => setPublicId(e.target.value)}
              placeholder="Enter a Cloudinary public_id"
            />
          </div>
          
          <Button onClick={testSignedUrl} disabled={loading}>
            {loading ? 'Generating...' : 'Generate Signed URL'}
          </Button>

          <Button 
            variant="secondary" 
            onClick={() => {
              setPublicId('kyc_temp/kyc_temp/doc_17');
              testSignedUrl();
            }}
            disabled={loading}
          >
            Test with sample KYC public_id
          </Button>

          {error && (
            <div className="text-red-600 text-sm">Error: {error}</div>
          )}

          {result && (
            <div className="space-y-2">
              <div className="text-green-600 text-sm">Success!</div>
              <div className="text-xs break-all bg-gray-100 p-2 rounded">
                URL: {result.url}
              </div>
              {result.url && (
                <img src={result.url} alt="Preview" className="max-w-full border rounded" />
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
