import { NextRequest, NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';
import { currentUser } from '@/lib/current-user';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
const MAX_BYTES = 10 * 1024 * 1024; // 10MB

export async function POST(request: NextRequest) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const form = await request.formData();
    const file = form.get('file') as File | null;
    const desiredPublicId = (form.get('publicId') as string) || '';
    const folder = (form.get('folder') as string) || 'kyc_temp';

    if (!file) return NextResponse.json({ error: 'File not found' }, { status: 400 });
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ error: 'Invalid file type' }, { status: 400 });
    }
    if (file.size > MAX_BYTES) {
      return NextResponse.json({ error: 'File too large (max 10MB)' }, { status: 400 });
    }

    const bytes = Buffer.from(await file.arrayBuffer());
    const publicId = desiredPublicId || `${folder}/doc_${Date.now()}`;

    const result = await new Promise<any>((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          public_id: publicId,
          resource_type: 'auto',
          type: 'authenticated',
          access_mode: 'authenticated',
          overwrite: false,
          invalidate: false,
          folder,
          // Optionally use upload preset if you have one configured
          // upload_preset: 'OnMallKYC', // Uncomment if you want to use the preset
        },
        (error, res) => (error ? reject(error) : resolve(res))
      );
      stream.end(bytes);
    });

    return NextResponse.json({ success: true, public_id: result.public_id, asset_id: result.asset_id });
  } catch (e) {
    console.error('KYC upload failed', e);
    return NextResponse.json({ error: 'KYC upload failed' }, { status: 500 });
  }
}
