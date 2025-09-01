import { NextRequest, NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';
import { currentUser } from '@/lib/current-user';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

// GET /api/kyc/preview?public_id=...  -> streams a PNG preview image (admin-only)
export async function GET(req: NextRequest) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if ((user as any).role !== 'ADMIN') return NextResponse.json({ error: 'Admin access required' }, { status: 403 });

  const urlObj = new URL(req.url);
  const public_id = urlObj.searchParams.get('public_id') || '';
  if (!public_id) return NextResponse.json({ error: 'public_id required' }, { status: 400 });

  try {
    // Generate a signed URL for an image preview (first page for PDFs)
    const signed = cloudinary.url(public_id, {
      type: 'authenticated',
      sign_url: true,
      secure: true,
      expires_at: Math.floor(Date.now() / 1000) + 60 * 5, // 5 minutes
      transformation: [{ page: 1 }, { fetch_format: 'png' }, { quality: 'auto:good' }],
    });

    const res = await fetch(signed, { cache: 'no-store' });
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      return NextResponse.json({ error: 'Upstream fetch failed', status: res.status, body: text }, { status: 502 });
    }

    const buff = Buffer.from(await res.arrayBuffer());
    return new NextResponse(buff, {
      status: 200,
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'no-store, max-age=0',
      },
    });
  } catch (e) {
    console.error('KYC preview failed', e);
    return NextResponse.json({ error: 'Failed to generate preview' }, { status: 500 });
  }
}
