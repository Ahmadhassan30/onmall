"use client";
import { useState } from 'react';
import { useCreateVendor } from '@/app/_api/vendor';
import { useKycUpload } from '@/app/_api/kyc/use-kyc-mutations';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';

export default function VendorRegisterPage() {
  const [shopName, setShopName] = useState('');
  const [description, setDescription] = useState('');
  const [docType, setDocType] = useState<'CNIC' | 'PASSPORT' | 'LICENSE' | ''>('');
  const [file, setFile] = useState<File | null>(null);

  const createVendor = useCreateVendor();
  const kycUpload = useKycUpload();

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shopName) return toast.error('Shop name is required');
    if (!docType) return toast.error('Select KYC document type');
    if (!file) return toast.error('Upload KYC document image');

    try {
      // 1) Upload KYC document via secure KYC endpoint; only returns public_id
      const uploadRes = await kycUpload.mutateAsync({ file, documentType: docType });
      const { public_id } = uploadRes;

      // 2) Create Vendor with KYC Pending (approved=false by default)
      await createVendor.mutateAsync({
        shopName,
        description,
        kyc: { documentType: docType, public_id },
      } as any);      toast.success('Vendor submitted for approval. An admin will review your KYC.');
      setShopName('');
      setDescription('');
      setDocType('');
      setFile(null);
    } catch (err: any) {
      toast.error(err.message || 'Failed to register vendor');
    }
  };

  return (
  <div className="container max-w-2xl mx-auto py-10">
      <Card>
        <CardHeader>
          <CardTitle>Vendor Registration</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <Label htmlFor="shopName">Shop Name</Label>
              <Input id="shopName" value={shopName} onChange={(e) => setShopName(e.target.value)} required />
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Input id="description" value={description} onChange={(e) => setDescription(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="docType">KYC Document Type</Label>
              <select
                id="docType"
                className="mt-1 block w-full border rounded-md px-3 py-2"
                value={docType}
                onChange={(e) => setDocType(e.target.value as 'CNIC' | 'PASSPORT' | 'LICENSE')}
              >
                <option value="" disabled>
                  Select document type
                </option>
                <option value="CNIC">CNIC</option>
                <option value="PASSPORT">Passport</option>
                <option value="LICENSE">License</option>
              </select>
            </div>
            <div>
              <Label>Document Image</Label>
              <Input type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] || null)} />
            </div>
            <Button type="submit" disabled={createVendor.isPending || kycUpload.isPending}>
              {createVendor.isPending || kycUpload.isPending ? 'Submitting...' : 'Submit'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
