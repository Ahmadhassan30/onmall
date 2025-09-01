import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { currentUser } from '@/lib/current-user';

// GET /api/vendor/me - fetch current user's vendor profile (if any)
export async function GET() {
  const user = await currentUser();
  if (!user) return NextResponse.json({ vendor: null }, { status: 200 });

  try {
    const vendor = await prisma.vendor.findUnique({
      where: { userId: (user as any).id },
      include: {
        kyc: { select: { status: true } },
        products: false,
      },
    });
    return NextResponse.json({ vendor });
  } catch (e) {
    console.error('Failed to fetch current vendor', e);
    return NextResponse.json({ error: 'Failed to load vendor' }, { status: 500 });
  }
}
