import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { currentUser } from '@/lib/current-user';
import { vendorCreateSchema, vendorKycCreateSchema, vendorListQuerySchema, vendorUpdateSchema } from '@/schema';
import { Prisma } from '@prisma/client';

// POST /api/vendor - create vendor for current user (file-based route to avoid 404)
export async function POST(req: NextRequest) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const schema = vendorCreateSchema.extend({ kyc: vendorKycCreateSchema.optional() });
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid body', issues: parsed.error.issues }, { status: 400 });
  }

  const data = parsed.data as z.infer<typeof schema>;

  // Ensure the user is not already a vendor
  const existing = await prisma.vendor.findUnique({ where: { userId: (user as any).id } });
  if (existing) return NextResponse.json({ error: 'Already a vendor' }, { status: 409 });

  try {
    const created = await prisma.$transaction(async (tx) => {
      const vendor = await tx.vendor.create({
        data: {
          userId: (user as any).id,
          shopName: data.shopName,
          description: data.description ?? undefined,
          approved: false,
        },
      });

      if (data.kyc) {
        await tx.kYC.create({
          data: {
            vendorId: vendor.id,
            status: 'Pending',
            documents: {
              create: {
                public_id: data.kyc.public_id,
                documentType: data.kyc.documentType as any,
              },
            },
          },
        });
      } else {
        await tx.kYC.create({ data: { vendorId: vendor.id, status: 'Pending' } });
      }

      return tx.vendor.findUnique({
        where: { id: vendor.id },
        include: {
          kyc: { select: { id: true, status: true, createdAt: true, updatedAt: true, documents: true } },
          products: { include: { images: true, video: true } },
        },
      });
    });

    return NextResponse.json(created, { status: 201 });
  } catch (e: any) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
      const target = (e.meta?.target as string[] | undefined)?.join(', ') || 'unique field';
      return NextResponse.json({ error: `Conflict: ${target} already exists` }, { status: 409 });
    }
    console.error('Vendor create failed', e);
    return NextResponse.json({ error: 'Failed to create vendor' }, { status: 500 });
  }
}

// GET /api/vendor - Admin only list vendors (with KYC doc metadata)
export async function GET(req: NextRequest) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if ((user as any).role !== 'ADMIN') return NextResponse.json({ error: 'Admin access required' }, { status: 403 });

  const url = new URL(req.url);
  const search = url.searchParams.get('search') || undefined;
  const where = search ? { shopName: { contains: search, mode: 'insensitive' as const } } : {};

  const vendors = await prisma.vendor.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    include: {
      user: { select: { id: true, name: true, email: true, role: true, createdAt: true } },
      products: { include: { images: true, video: true } },
      kyc: { select: { status: true, documents: true } },
    },
  });

  return NextResponse.json(vendors);
}

// PUT /api/vendor - update current user's vendor (non-admins cannot toggle approved)
export async function PUT(req: NextRequest) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const parsed = vendorUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid body', issues: parsed.error.issues }, { status: 400 });
  }

  const v = await prisma.vendor.findUnique({ where: { userId: (user as any).id } });
  if (!v) return NextResponse.json({ error: 'Not a vendor' }, { status: 404 });

  const data = { ...parsed.data } as any;
  if ((user as any).role !== 'ADMIN') delete data.approved;

  const updated = await prisma.vendor.update({
    where: { id: v.id },
    data,
    include: { products: { include: { images: true, video: true } } },
  });

  return NextResponse.json(updated);
}
