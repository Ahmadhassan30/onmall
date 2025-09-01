import { NextRequest, NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';
import { currentUser } from '@/lib/current-user';
// no DB access needed for stateless signed URL

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

export async function POST(request: NextRequest) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { public_id, mode } = await request.json().catch(() => ({ public_id: '' }));
  if (!public_id) return NextResponse.json({ error: 'public_id required' }, { status: 400 });

  try {
    // If mode === 'preview-image', generate a signed URL that renders a visual preview (e.g., PDF -> PNG of first page)
    const isPreviewImage = mode === 'preview-image';
    const transformation = isPreviewImage
      ? [{ page: 1 }, { fetch_format: 'png' }, { quality: 'auto:good' }]
      : [{ fetch_format: 'auto' }, { quality: 'auto:good' }];

    const url = cloudinary.url(public_id, {
      type: 'authenticated',
      sign_url: true,
      expires_at: Math.floor(Date.now() / 1000) + 60 * 10, // 10 minutes
      secure: true,
      transformation,
    });

    return NextResponse.json({ url });
  } catch (e) {
    console.error('KYC signed-url failed', e);
    return NextResponse.json({ error: 'Failed to generate URL' }, { status: 500 });
  }
}
