"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Shield, 
  FileText, 
  Eye, 
  Download, 
  CheckCircle2, 
  AlertCircle, 
  Clock,
  Lock
} from 'lucide-react';

interface KYCDocument {
  id: string;
  documentType: 'CNIC' | 'PASSPORT' | 'LICENSE';
  uploadedAt: string;
  secureUrl: string;
}

interface KYCData {
  documents: KYCDocument[];
  status: string;
  kycId: string;
}

interface KYCDisplayProps {
  vendorId: string;
  readOnly?: boolean;
}

export function KYCDisplay({ vendorId, readOnly = false }: KYCDisplayProps) {
  const [kycData, setKycData] = useState<KYCData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchKYCData();
  }, [vendorId]);

  const fetchKYCData = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/kyc/documents/${vendorId}`, {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setKycData(data);
      } else if (response.status === 403) {
        setError('Access denied. You can only view your own KYC documents.');
      } else {
        setError('Failed to load KYC documents');
      }
    } catch (err) {
      console.error('Error fetching KYC data:', err);
      setError('Network error occurred');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return (
          <Badge className="bg-green-100 text-green-800 border-green-200">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Approved
          </Badge>
        );
      case 'REJECTED':
        return (
          <Badge className="bg-red-100 text-red-800 border-red-200">
            <AlertCircle className="h-3 w-3 mr-1" />
            Rejected
          </Badge>
        );
      case 'UNDER_REVIEW':
        return (
          <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">
            <Clock className="h-3 w-3 mr-1" />
            Under Review
          </Badge>
        );
      case 'PENDING':
        return (
          <Badge className="bg-blue-100 text-blue-800 border-blue-200">
            <FileText className="h-3 w-3 mr-1" />
            Pending
          </Badge>
        );
      default:
        return (
          <Badge className="bg-gray-100 text-gray-800 border-gray-200">
            Not Started
          </Badge>
        );
    }
  };

  const getDocumentTypeLabel = (type: string) => {
    switch (type) {
      case 'CNIC': return 'CNIC (National ID)';
      case 'PASSPORT': return 'Passport';
      case 'LICENSE': return 'Driving License';
      default: return type;
    }
  };

  const handleViewDocument = (secureUrl: string) => {
    // Open in new tab with additional security headers
    const newWindow = window.open('', '_blank');
    if (newWindow) {
      newWindow.document.write(`
        <html>
          <head>
            <title>KYC Document - OnMall</title>
            <style>
              body { 
                margin: 0; 
                padding: 20px; 
                font-family: Arial, sans-serif;
                background: #f5f5f5;
              }
              .header {
                background: #fff;
                padding: 15px;
                border-radius: 8px;
                margin-bottom: 20px;
                text-align: center;
                box-shadow: 0 2px 4px rgba(0,0,0,0.1);
              }
              .document-container {
                text-align: center;
                background: #fff;
                padding: 20px;
                border-radius: 8px;
                box-shadow: 0 2px 4px rgba(0,0,0,0.1);
              }
              img, embed {
                max-width: 100%;
                height: auto;
                border-radius: 4px;
              }
              .security-notice {
                background: #fef3c7;
                border: 1px solid #f59e0b;
                padding: 10px;
                margin-top: 20px;
                border-radius: 4px;
                font-size: 12px;
              }
            </style>
          </head>
          <body>
            <div class="header">
              <h3>🔒 OnMall KYC Document</h3>
              <p style="margin: 0; color: #666;">Secure Document Viewer</p>
            </div>
            <div class="document-container">
              <img src="${secureUrl}" alt="KYC Document" onerror="this.style.display='none'; document.getElementById('pdf-embed').style.display='block';" />
              <embed id="pdf-embed" src="${secureUrl}" width="100%" height="600px" style="display: none;" />
            </div>
            <div class="security-notice">
              ⚠️ This document is confidential and protected. Unauthorized access or distribution is prohibited.
            </div>
          </body>
        </html>
      `);
      newWindow.document.close();
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

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-red-600">
            <AlertCircle className="h-8 w-8 mx-auto mb-2" />
            <p>{error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!kycData || kycData.documents.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            KYC Documents
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-gray-600 py-8">
            <FileText className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <p>No KYC documents uploaded yet</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Status Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              KYC Verification Status
            </div>
            {getStatusBadge(kycData.status)}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Lock className="h-4 w-4" />
              All documents are securely encrypted and access-controlled
            </div>
            <div className="text-sm text-gray-600">
              Documents uploaded: {kycData.documents.length} of 3 required
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Documents List */}
      <Card>
        <CardHeader>
          <CardTitle>Uploaded Documents</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {kycData.documents.map((document) => (
              <div 
                key={document.id} 
                className="flex items-center justify-between p-4 border rounded-lg bg-gray-50"
              >
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-gray-600" />
                  <div>
                    <div className="font-medium">
                      {getDocumentTypeLabel(document.documentType)}
                    </div>
                    <div className="text-sm text-gray-600">
                      Uploaded: {new Date(document.uploadedAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleViewDocument(document.secureUrl)}
                  >
                    <Eye className="h-3 w-3 mr-1" />
                    View
                  </Button>
                  
                  {!readOnly && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const a = window.document.createElement('a');
                        a.href = document.secureUrl;
                        a.download = `${document.documentType}_${document.id}`;
                        a.target = '_blank';
                        a.click();
                      }}
                    >
                      <Download className="h-3 w-3 mr-1" />
                      Download
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Security Footer */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Shield className="h-5 w-5 text-blue-600 mt-0.5" />
            <div className="text-sm">
              <div className="font-medium text-blue-900 mb-1">
                Document Security & Privacy
              </div>
              <div className="text-blue-700 space-y-1">
                <p>• All documents are encrypted with AES-256 encryption</p>
                <p>• Access is logged and monitored for security</p>
                <p>• Documents are automatically deleted after verification completion</p>
                <p>• Only authorized OnMall staff can access documents for verification</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
