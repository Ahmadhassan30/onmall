import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@/lib/current-user';
import { prisma } from '@/lib/prisma';

// GET /api/kyc/mine - current vendor's KYC record with documents
export async function GET(req: NextRequest) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Find vendor for current user
  const vendor = await prisma.vendor.findUnique({ where: { userId: (user as any).id } });
  if (!vendor) return NextResponse.json({ error: 'Not a vendor' }, { status: 404 });

  const kyc = await prisma.kYC.findUnique({
    where: { vendorId: vendor.id },
    include: { documents: true },
  });

  if (!kyc) return NextResponse.json({ error: 'KYC not found' }, { status: 404 });

  // Do not include any raw URLs; only public_id and metadata are returned
  return NextResponse.json({
    id: kyc.id,
    status: kyc.status,
    createdAt: kyc.createdAt,
    updatedAt: kyc.updatedAt,
    documents: kyc.documents.map((d) => ({
      id: d.id,
      public_id: d.public_id,
      documentType: d.documentType,
      createdAt: d.createdAt,
    })),
  });
}
