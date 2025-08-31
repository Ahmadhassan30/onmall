import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary with security settings
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

// Secure upload function for KYC documents
export async function uploadKYCDocument(
  file: Buffer,
  options: {
    vendorId: string;
    documentType: string;
    filename: string;
  }
) {
  const { vendorId, documentType, filename } = options;

  const folder = `kyc_documents/${vendorId}`;
  const publicId = `${folder}/${documentType}_${Date.now()}_${filename.split('.')[0]}`;

  return new Promise<any>((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        public_id: publicId,
        resource_type: 'auto',
        type: 'authenticated', // Upload as authenticated asset
        access_mode: 'authenticated',
        invalidate: false,
        overwrite: false,
        unique_filename: true,
        use_filename: false,
        quality: 'auto:eco',
        format: 'auto',
        transformation: [
          { width: 2000, height: 2000, crop: 'limit' },
          { quality: 'auto:good' },
        ],
        context: {
          vendor: vendorId,
          documentType,
        },
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );

    stream.end(file);
  });
}

// Generate secure signed URL for viewing KYC documents
export function generateSecureKYCUrl(publicId: string) {
  // Signed URL for authenticated asset
  return cloudinary.url(publicId, {
    type: 'authenticated',
    sign_url: true,
    expires_at: Math.floor(Date.now() / 1000) + 60 * 60, // 1 hour
    secure: true,
    transformation: [
      { quality: 'auto:good' },
      { fetch_format: 'auto' },
    ],
  });
}

// Delete KYC document securely
export async function deleteKYCDocument(publicId: string) {
  return cloudinary.uploader.destroy(publicId, {
    type: 'authenticated',
    invalidate: true,
  });
}

export { cloudinary };
