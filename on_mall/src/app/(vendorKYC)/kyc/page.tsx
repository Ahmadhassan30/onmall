"use client";

import { useState, useEffect } from 'react';
import { KYCUpload } from '@/components/kyc-upload';
import { KYCDisplay } from '@/components/kyc-display';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Shield, Upload, Eye, AlertCircle } from 'lucide-react';
import { useSession } from '@/lib/auth-client';

type Vendor = { id: string; userId: string; shopName: string; approved: boolean } | null;

export default function VendorKYCPage() {
  const { data: session, error: sessionError } = useSession();
  const [vendor, setVendor] = useState<Vendor>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('upload');

  useEffect(() => {
    if (session?.user) {
      fetchVendorData();
    }
  }, [session]);

  const fetchVendorData = async () => {
    try {
      setLoading(true);
      // Check if user is a vendor
      const response = await fetch('/api/vendor/profile', {
        credentials: 'include',
      });
      
      if (response.ok) {
  const vendorData = await response.json();
  setVendor(vendorData);
      } else if (response.status === 404) {
        // User is not a vendor
        setVendor(null);
      }
    } catch (error) {
      console.error('Error fetching vendor data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          <span className="ml-2">Loading...</span>
        </div>
      </div>
    );
  }

  if (!session?.user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="p-8 text-center">
            <AlertCircle className="h-12 w-12 mx-auto mb-4 text-red-500" />
            <h2 className="text-xl font-semibold mb-2">Authentication Required</h2>
            <p className="text-gray-600 mb-4">Please sign in to access KYC verification.</p>
            <Button onClick={() => window.location.href = '/auth/sign-in'}>
              Sign In
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!vendor) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="p-8 text-center">
            <Shield className="h-12 w-12 mx-auto mb-4 text-blue-500" />
            <h2 className="text-xl font-semibold mb-2">Vendor Account Required</h2>
            <p className="text-gray-600 mb-4">
              You need to be a registered vendor to access KYC verification.
            </p>
            <Button onClick={() => window.location.href = '/vendor/register'}>
              Become a Vendor
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">KYC Verification</h1>
        <p className="text-gray-600">
          Complete your Know Your Customer (KYC) verification to start selling on OnMall
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="upload" className="flex items-center gap-2">
            <Upload className="h-4 w-4" />
            Upload Documents
          </TabsTrigger>
          <TabsTrigger value="view" className="flex items-center gap-2">
            <Eye className="h-4 w-4" />
            View Documents
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upload" className="space-y-6">
          <KYCUpload 
            vendorId={vendor.id} 
            onUploadSuccess={() => {
              // Refresh the view tab data when upload succeeds
              if (activeTab === 'view') {
                window.location.reload();
              }
            }}
          />
        </TabsContent>

        <TabsContent value="view" className="space-y-6">
          <KYCDisplay vendorId={vendor.id} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
