import { NextRequest, NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';
import { currentUser } from '@/lib/current-user';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

export async function DELETE(request: NextRequest) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { public_id } = await request.json().catch(() => ({ public_id: '' }));
  if (!public_id) return NextResponse.json({ error: 'public_id required' }, { status: 400 });

  try {
    await cloudinary.uploader.destroy(public_id, { type: 'authenticated', invalidate: true });
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error('KYC delete failed', e);
    return NextResponse.json({ error: 'Delete failed' }, { status: 500 });
  }
}
