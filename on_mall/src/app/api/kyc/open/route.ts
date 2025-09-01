import { NextRequest, NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';
import { currentUser } from '@/lib/current-user';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

// GET /api/kyc/open?public_id=...  -> 302 redirect to a short-lived signed URL (admin-only)
export async function GET(req: NextRequest) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if ((user as any).role !== 'ADMIN') return NextResponse.json({ error: 'Admin access required' }, { status: 403 });

  const urlObj = new URL(req.url);
  const public_id = urlObj.searchParams.get('public_id') || '';
  if (!public_id) return NextResponse.json({ error: 'public_id required' }, { status: 400 });

  try {
    const signed = cloudinary.url(public_id, {
      type: 'authenticated',
      sign_url: true,
      secure: true,
      expires_at: Math.floor(Date.now() / 1000) + 60 * 5, // 5 minutes
      transformation: [{ fetch_format: 'auto' }],
    });

    return NextResponse.redirect(signed, { status: 302 });
  } catch (e) {
    console.error('KYC open redirect failed', e);
    return NextResponse.json({ error: 'Failed to generate URL' }, { status: 500 });
  }
}
