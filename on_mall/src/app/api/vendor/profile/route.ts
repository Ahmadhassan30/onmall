import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { currentUser } from '@/lib/current-user';

// GET /api/vendor/profile - current vendor with products (images/video) and KYC status only
export async function GET(_req: NextRequest) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const v = await prisma.vendor.findUnique({
    where: { userId: (user as any).id },
    include: {
      products: { include: { images: true, video: true } },
      kyc: { select: { id: true, status: true, createdAt: true, updatedAt: true } },
    },
  });

  if (!v) return NextResponse.json({ error: 'Not a vendor' }, { status: 404 });
  return NextResponse.json(v);
}
