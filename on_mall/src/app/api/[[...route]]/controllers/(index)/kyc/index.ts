import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { uploadKYCDocument, generateSecureKYCUrl, deleteKYCDocument } from '@/lib/cloudinary';

type KycVariables = {
  Variables: {
    user: any;
    vendor: { id: string };
  };
};

const kyc = new Hono<KycVariables>();

// Validation schemas
const uploadSchema = z.object({
  documentType: z.enum(['CNIC', 'PASSPORT', 'LICENSE']),
  vendorId: z.string().uuid(),
});

const getDocumentsSchema = z.object({
  vendorId: z.string().uuid(),
});

const deleteDocumentSchema = z.object({
  documentId: z.string().uuid(),
  vendorId: z.string().uuid(),
});

// Middleware to check authentication and vendor authorization
const authMiddleware = async (c: any, next: any) => {
  try {
    // Get session from Better Auth cookie
    const sessionCookie = c.req.header('cookie');
    if (!sessionCookie) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    // Verify session with Better Auth
    const sessionResponse = await fetch(`${process.env.BETTER_AUTH_URL}/api/auth/get-session`, {
      headers: {
        cookie: sessionCookie,
      },
    });

    if (!sessionResponse.ok) {
      return c.json({ error: 'Invalid session' }, 401);
    }

    const sessionData = await sessionResponse.json();
    if (!sessionData.user) {
      return c.json({ error: 'User not authenticated' }, 401);
    }

    // Check if user is a vendor
    const vendor = await prisma.vendor.findUnique({
      where: { userId: sessionData.user.id },
    });

    if (!vendor) {
      return c.json({ error: 'Vendor access required' }, 403);
    }

    // Add user and vendor info to context
  c.set('user', sessionData.user);
  c.set('vendor', vendor);
    
    await next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    return c.json({ error: 'Authentication failed' }, 401);
  }
};

// Upload KYC document (expects multipart/form-data)
kyc.post(
  '/upload',
  authMiddleware,
  async (c) => {
    try {
      // Parse form-data
      const formData = await c.req.formData();
      const file = formData.get('file') as File | null;
      const documentType = (formData.get('documentType') as string | null) || '';
      const vendorId = (formData.get('vendorId') as string | null) || '';

      // Validate payload
      const parsed = uploadSchema.safeParse({ documentType, vendorId });
      if (!parsed.success) {
        return c.json({ error: 'Invalid data submitted' }, 400);
      }
      
  const vendor = c.get('vendor') as { id: string };
      
      // Ensure vendor can only upload their own documents
      if (vendor.id !== vendorId) {
        return c.json({ error: 'Access denied' }, 403);
      }

      if (!file) {
        return c.json({ error: 'No file provided' }, 400);
      }

      // Validate file type and size
      const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
      if (!allowedTypes.includes(file.type)) {
        return c.json({ error: 'Invalid file type. Only JPEG, PNG, and PDF allowed.' }, 400);
      }

      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        return c.json({ error: 'File too large. Maximum size is 10MB.' }, 400);
      }

      // Convert file to buffer
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      // Get or create KYC record
      let kycRecord = await prisma.kYC.findUnique({
        where: { vendorId },
        include: { documents: true },
      });

      if (!kycRecord) {
        kycRecord = await prisma.kYC.create({
          data: {
            vendorId,
            status: 'PENDING',
          },
          include: { documents: true },
        });
      }

      // Check if document type already exists
      const existingDoc = kycRecord.documents.find(doc => doc.documentType === documentType);
      if (existingDoc) {
        // Delete old document from Cloudinary
        try {
          await deleteKYCDocument(existingDoc.public_id);
        } catch (error) {
          console.error('Failed to delete old document:', error);
        }
        
        // Delete from database
        await prisma.kYCDocument.delete({
          where: { id: existingDoc.id },
        });
      }

      // Upload to Cloudinary
      const uploadResult = await uploadKYCDocument(buffer, {
        vendorId,
        documentType,
        filename: file.name,
      });

      // Save document info to database
    const kycDocument = await prisma.kYCDocument.create({
        data: {
      kycId: kycRecord.id,
          documentType: documentType as any,
          public_id: uploadResult.public_id,
          url: uploadResult.secure_url,
        },
      });

      // Update KYC status
      await prisma.kYC.update({
        where: { id: kycRecord.id },
        data: { 
          status: 'UNDER_REVIEW',
          updatedAt: new Date(),
        },
      });

      return c.json({
        success: true,
        document: {
          id: kycDocument.id,
          documentType: kycDocument.documentType,
          uploadedAt: kycDocument.createdAt,
        },
      });
    } catch (error) {
      console.error('KYC upload error:', error);
      return c.json({ error: 'Failed to upload document' }, 500);
    }
  }
);

// Get KYC documents for a vendor
kyc.get(
  '/documents/:vendorId',
  authMiddleware,
  async (c) => {
    try {
      const vendorId = c.req.param('vendorId');
  const vendor = c.get('vendor') as { id: string };
      
      // Ensure vendor can only view their own documents
      if (vendor.id !== vendorId) {
        return c.json({ error: 'Access denied' }, 403);
      }

  const kyc = await prisma.kYC.findUnique({
        where: { vendorId },
        include: { documents: true },
      });

      if (!kyc) {
        return c.json({ documents: [], status: 'NOT_STARTED' });
      }

      // Generate secure URLs for documents
      const documentsWithUrls = kyc.documents.map(doc => ({
        id: doc.id,
        documentType: doc.documentType,
        uploadedAt: doc.createdAt,
        secureUrl: generateSecureKYCUrl(doc.public_id),
      }));

      return c.json({
        documents: documentsWithUrls,
        status: kyc.status,
        kycId: kyc.id,
      });
    } catch (error) {
      console.error('Get KYC documents error:', error);
      return c.json({ error: 'Failed to fetch documents' }, 500);
    }
  }
);

// Delete KYC document
kyc.delete(
  '/document',
  authMiddleware,
  zValidator('json', deleteDocumentSchema),
  async (c) => {
    try {
      const { documentId, vendorId } = c.req.valid('json');
  const vendor = c.get('vendor') as { id: string };
      
      // Ensure vendor can only delete their own documents
      if (vendor.id !== vendorId) {
        return c.json({ error: 'Access denied' }, 403);
      }

      // Get document
      const document = await prisma.kYCDocument.findUnique({
        where: { id: documentId },
        include: { kyc: true },
      });

      if (!document) {
        return c.json({ error: 'Document not found' }, 404);
      }

      if (document.kyc.vendorId !== vendorId) {
        return c.json({ error: 'Access denied' }, 403);
      }

      // Delete from Cloudinary
      await deleteKYCDocument(document.public_id);

      // Delete from database
      await prisma.kYCDocument.delete({
        where: { id: documentId },
      });

      return c.json({ success: true });
    } catch (error) {
      console.error('Delete KYC document error:', error);
      return c.json({ error: 'Failed to delete document' }, 500);
    }
  }
);

export default kyc ;
