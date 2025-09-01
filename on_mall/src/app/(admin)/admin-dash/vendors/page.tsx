"use client";
import { useMemo, useState } from 'react';
import { useVendorList, useApproveVendor } from '@/app/_api/vendor';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
// Using server-side KYC endpoints for preview/open to ensure access works for admins

export default function VendorsAdminPage() {
  const [search, setSearch] = useState('');
  const { data, isLoading, error } = useVendorList(search);
  const approveVendor = useApproveVendor();

  const vendors = data || [];
  
  // Debug: Log the vendors data to see the structure
  console.log('Vendors data:', vendors);
  console.log('First vendor KYC:', vendors[0]?.kyc);
  if (vendors[0]?.kyc?.documents) {
    console.log('First vendor documents:', vendors[0].kyc.documents);
    console.log('Documents is array?', Array.isArray(vendors[0].kyc.documents));
    console.log('Documents length:', vendors[0].kyc.documents.length);
  }
  
  const filtered = useMemo(() => {
    const s = search.trim().toLowerCase();
    return vendors.filter((v: any) => v.shopName.toLowerCase().includes(s));
  }, [vendors, search]);

  const approved = filtered.filter((v: any) => v.approved);
  const unapproved = filtered.filter((v: any) => !v.approved);

  return (
    <div className="container mx-auto py-8">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-semibold">Vendors</h1>
        <div className="w-64">
          <Input placeholder="Search by shop name" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </div>

      {isLoading && <p>Loading...</p>}
      {error && <p className="text-red-500">{(error as any).message}</p>}

      {!isLoading && !error && (
        <Tabs defaultValue="unapproved">
          <TabsList>
            <TabsTrigger value="unapproved">Unapproved ({unapproved.length})</TabsTrigger>
            <TabsTrigger value="approved">Approved ({approved.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="unapproved">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
              {unapproved.map((v: any) => (
                <Card key={v.id}>
                  <CardHeader>
                    <CardTitle>{v.shopName}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">{v.description || 'No description'}</p>
                    <p className="text-xs mt-2">KYC: {v.kyc?.status || 'Pending'}</p>
                    
                    {/* Debug: Show raw KYC data */}
                    <div className="mt-2 text-xs text-gray-500 bg-gray-100 p-2 rounded max-h-32 overflow-y-auto">
                      <pre>{JSON.stringify(v.kyc, null, 2)}</pre>
                    </div>
                    
                    {/* KYC Documents */}
                    {v.kyc?.documents && Array.isArray(v.kyc.documents) && v.kyc.documents.length > 0 && (
                      <div className="mt-3 space-y-2">
                        <div className="text-xs font-medium">KYC Documents ({v.kyc.documents.length}):</div>
                        {v.kyc.documents.map((doc: any) => (
                          <KycDocPreview key={doc.id} doc={doc} />
                        ))}
                      </div>
                    )}
                    
                    {/* Debug: Show if no documents */}
                    {v.kyc && (!v.kyc.documents || !Array.isArray(v.kyc.documents) || v.kyc.documents.length === 0) && (
                      <div className="mt-3 text-xs text-yellow-600">
                        No KYC documents found. Documents type: {typeof v.kyc.documents}, Length: {v.kyc.documents?.length}
                      </div>
                    )}
                    
                    <div className="flex gap-2 mt-4">
                      <Button
                        size="sm"
                        onClick={() => approveVendor.mutate({ id: v.id, approved: true })}
                        disabled={approveVendor.isPending}
                      >
                        Approve
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => approveVendor.mutate({ id: v.id, approved: false })}
                        disabled={approveVendor.isPending}
                      >
                        Reject
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="approved">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
              {approved.map((v: any) => (
                <Card key={v.id}>
                  <CardHeader>
                    <CardTitle>{v.shopName}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">{v.description || 'No description'}</p>
                    <p className="text-xs mt-2">KYC: {v.kyc?.status || 'Pending'}</p>
                    
                    {/* KYC Documents */}
                    {v.kyc?.documents?.length > 0 && (
                      <div className="mt-3 space-y-2">
                        <div className="text-xs font-medium">KYC Documents:</div>
                        {v.kyc.documents.map((doc: any) => (
                          <KycDocPreview key={doc.id} doc={doc} />
                        ))}
                      </div>
                    )}
                    
                    <div className="flex gap-2 mt-4">
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => approveVendor.mutate({ id: v.id, approved: false })}
                        disabled={approveVendor.isPending}
                      >
                        Move to Unapproved
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}

function KycDocPreview({ doc }: { doc: any }) {
  // Construct URLs to server-side endpoints that enforce admin checks
  const previewUrl = `/api/kyc/preview?public_id=${encodeURIComponent(doc.public_id)}`;
  const openUrl = `/api/kyc/open?public_id=${encodeURIComponent(doc.public_id)}`;

  console.log('KycDocPreview doc:', doc);
  console.log('Preview URL:', previewUrl);
  console.log('Open URL:', openUrl);

  return (
    <div className="border rounded p-2 text-xs">
      <div className="flex items-center justify-between mb-1">
        <span>{doc.documentType}</span>
        <a
          href={openUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs"
        >
          <Button size="sm" variant="outline">Open</Button>
        </a>
      </div>

      {/* Debug info */}
      <div className="text-xs text-gray-500 mb-2">
        Public ID: {doc.public_id}
      </div>

      {/* Directly render the preview image from our server endpoint */}
      <img
        src={previewUrl}
        alt={`${doc.documentType} preview`}
        className="w-full rounded mt-1"
        onError={(e) => {
          const el = e.currentTarget as HTMLImageElement;
          el.style.display = 'none';
          console.warn('Failed to load KYC preview for', doc.public_id);
        }}
      />
    </div>
  );
}
