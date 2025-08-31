"use client";

import { useState, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Upload, 
  FileText, 
  Shield, 
  CheckCircle2, 
  AlertCircle, 
  Trash2,
  Download,
  Eye,
  Lock
} from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/api-client';

interface KYCDocument {
  id: string;
  documentType: 'CNIC' | 'PASSPORT' | 'LICENSE';
  uploadedAt: string;
  secureUrl: string;
}

interface KYCUploadProps {
  vendorId: string;
  onUploadSuccess?: () => void;
}

const documentTypes = [
  { value: 'CNIC', label: 'CNIC (Computerized National Identity Card)', icon: FileText },
  { value: 'PASSPORT', label: 'Passport', icon: FileText },
  { value: 'LICENSE', label: 'Driving License', icon: FileText },
] as const;

export function KYCUpload({ vendorId, onUploadSuccess }: KYCUploadProps) {
  const [uploading, setUploading] = useState<string | null>(null);
  const [documents, setDocuments] = useState<KYCDocument[]>([]);
  const [kycStatus, setKycStatus] = useState<string>('NOT_STARTED');
  const [loading, setLoading] = useState(true);

  // Fetch existing documents
  const fetchDocuments = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/kyc/documents/${vendorId}`, {
        credentials: 'include',
      });
      
      if (response.ok) {
        const data = await response.json();
        setDocuments(data.documents || []);
        setKycStatus(data.status || 'NOT_STARTED');
      } else {
        console.error('Failed to fetch documents');
      }
    } catch (error) {
      console.error('Error fetching documents:', error);
      toast.error('Failed to load KYC documents');
    } finally {
      setLoading(false);
    }
  }, [vendorId]);

  // Load documents on mount and when vendorId changes
  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  const handleFileUpload = async (file: File, documentType: string) => {
    if (!file) return;

    // Validate file
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Invalid file type. Only JPEG, PNG, and PDF files are allowed.');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error('File too large. Maximum size is 10MB.');
      return;
    }

    setUploading(documentType);

    try {
      // Create form data with both file and metadata
      const formData = new FormData();
      formData.append('file', file);
      formData.append('documentType', documentType);
      formData.append('vendorId', vendorId);

      // Upload file with metadata
      const response = await fetch('/api/kyc/upload', {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });

      if (response.ok) {
        toast.success(`${documentType} uploaded successfully`);
        await fetchDocuments();
        onUploadSuccess?.();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Upload failed');
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload document');
    } finally {
      setUploading(null);
    }
  };

  const handleDeleteDocument = async (documentId: string) => {
    if (!confirm('Are you sure you want to delete this document?')) return;

    try {
      const response = await fetch('/api/kyc/document', {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          documentId,
          vendorId,
        }),
      });

      if (response.ok) {
        toast.success('Document deleted successfully');
        await fetchDocuments();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to delete document');
      }
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('Failed to delete document');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'APPROVED': return 'text-green-600';
      case 'REJECTED': return 'text-red-600';
      case 'UNDER_REVIEW': return 'text-yellow-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'APPROVED': return CheckCircle2;
      case 'REJECTED': return AlertCircle;
      case 'UNDER_REVIEW': return Shield;
      default: return FileText;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            <span className="ml-2">Loading KYC documents...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Status Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            KYC Verification Status
            <span className={`text-sm font-medium ${getStatusColor(kycStatus)}`}>
              {kycStatus.replace('_', ' ')}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <Lock className="h-4 w-4" />
            <AlertDescription>
              All KYC documents are stored securely with end-to-end encryption. 
              Only authorized personnel can access your documents for verification purposes.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Document Upload Section */}
      <Card>
        <CardHeader>
          <CardTitle>Upload KYC Documents</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {documentTypes.map((docType) => {
            const existingDoc = documents.find(doc => doc.documentType === docType.value);
            const isUploading = uploading === docType.value;
            const IconComponent = docType.icon;

            return (
              <div key={docType.value} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <IconComponent className="h-4 w-4" />
                    <Label className="font-medium">{docType.label}</Label>
                    {existingDoc && (
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                    )}
                  </div>
                  
                  {existingDoc && (
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(existingDoc.secureUrl, '_blank')}
                      >
                        <Eye className="h-3 w-3 mr-1" />
                        View
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteDocument(existingDoc.id)}
                      >
                        <Trash2 className="h-3 w-3 mr-1" />
                        Delete
                      </Button>
                    </div>
                  )}
                </div>

                {existingDoc ? (
                  <div className="text-sm text-gray-600">
                    Uploaded on: {new Date(existingDoc.uploadedAt).toLocaleDateString()}
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                    <input
                      type="file"
                      accept=".jpg,.jpeg,.png,.pdf"
                      className="hidden"
                      id={`file-${docType.value}`}
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          handleFileUpload(file, docType.value);
                        }
                      }}
                      disabled={isUploading}
                    />
                    <label
                      htmlFor={`file-${docType.value}`}
                      className="cursor-pointer flex flex-col items-center justify-center"
                    >
                      <Upload className={`h-8 w-8 text-gray-400 mb-2 ${isUploading ? 'animate-pulse' : ''}`} />
                      <span className="text-sm text-gray-600">
                        {isUploading ? 'Uploading...' : 'Click to upload or drag and drop'}
                      </span>
                      <span className="text-xs text-gray-400">
                        JPEG, PNG, PDF (max 10MB)
                      </span>
                    </label>
                  </div>
                )}
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Security Notice */}
      <Alert>
        <Shield className="h-4 w-4" />
        <AlertDescription>
          <strong>Security Notice:</strong> Your documents are encrypted and stored securely. 
          Access is logged and monitored. Only upload authentic government-issued documents.
        </AlertDescription>
      </Alert>
    </div>
  );
}
