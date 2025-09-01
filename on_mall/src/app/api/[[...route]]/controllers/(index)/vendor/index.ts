import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { currentUser } from '@/lib/current-user';
import { vendorCreateSchema, vendorUpdateSchema, vendorListQuerySchema, idParamSchema, vendorKycCreateSchema } from '@/schema';

const vendor = new Hono();

// Helpers
async function requireAdmin(c: any) {
  const user = await currentUser();
  if (!user) return c.json({ error: 'Unauthorized' }, 401);
  if ((user as any).role !== 'ADMIN') return c.json({ error: 'Admin access required' }, 403);
  return user;
}

async function requireAuth(c: any) {
  const user = await currentUser();
  if (!user) return c.json({ error: 'Unauthorized' }, 401);
  return user;
}

// GET /api/vendor/profile - current vendor profile (hide KYC documents; expose status only)
vendor.get('/profile', async (c) => {
  const user = await requireAuth(c);
  if ((user as any).status) return user;

  const v = await prisma.vendor.findUnique({
    where: { userId: (user as any).id },
    include: {
      products: {
        include: { images: true, video: true },
      },
      kyc: {
        select: {
          id: true,
          status: true,
          createdAt: true,
          updatedAt: true,
        },
      },
    },
  });

  if (!v) return c.json({ error: 'Not a vendor' }, 404);
  return c.json(v);
});

// GET /api/vendor - Admin only: list all vendors (admin sees KYC documents) with optional search
vendor.get('/', zValidator('query', vendorListQuerySchema), async (c) => {
  const user = await requireAdmin(c);
  if ((user as any).status) return user;

  const { search } = c.req.valid('query') as any;

  const where = search
    ? { shopName: { contains: search, mode: 'insensitive' as const } }
    : {};

  const vendors = await prisma.vendor.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    include: {
      user: { select: { id: true, name: true, email: true, role: true, createdAt: true } },
      products: { include: { images: true, video: true } },
      kyc: { select: { status: true, documents: true } },
    },
  });

  return c.json(vendors);
});

// POST /api/vendor - create vendor for current user
vendor.post('/', zValidator('json', vendorCreateSchema.extend({ kyc: vendorKycCreateSchema.optional() })), async (c) => {
  const user = await requireAuth(c);
  if ((user as any).status) return user; // Return error response if auth failed
  
  const body = c.req.valid('json') as z.infer<typeof vendorCreateSchema> & { kyc?: z.infer<typeof vendorKycCreateSchema> };

  // Ensure the user is not already a vendor
  const existing = await prisma.vendor.findUnique({ 
    where: { userId: (user as any).id } 
  });
  if (existing) return c.json({ error: 'Already a vendor' }, 409);

  try {
    // Create vendor with approved=false (default) and optional initial KYC (Pending)
    const v = await prisma.$transaction(async (tx) => {
      const vendor = await tx.vendor.create({
        data: {
          userId: (user as any).id,
          shopName: body.shopName,
          description: body.description ?? undefined,
          approved: false,
        },
      });

      if (body.kyc) {
        await tx.kYC.create({
          data: {
            vendorId: vendor.id,
            status: 'Pending',
            documents: {
              create: {
                public_id: body.kyc.public_id,
                documentType: body.kyc.documentType as any,
              },
            },
          },
        });
      } else {
        // ensure at least a KYC record exists with Pending status for vendor
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
    
    return c.json(v, 201);
  } catch (err: any) {
    // Handle unique constraint errors (e.g., shopName or userId)
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
      const target = (err.meta?.target as string[] | undefined)?.join(', ') || 'unique field';
      return c.json({ error: `Conflict: ${target} already exists` }, 409);
    }
    console.error('Create vendor failed', err);
    return c.json({ error: 'Failed to create vendor' }, 500);
  }
});

// PUT /api/vendor - update vendor for current user (or admin)
vendor.put('/', zValidator('json', vendorUpdateSchema), async (c) => {
  const user = await requireAuth(c);
  if ((user as any).status) return user; // Return error response if auth failed
  
  const body = { ...c.req.valid('json') } as any;

  const v = await prisma.vendor.findUnique({ 
    where: { userId: (user as any).id } 
  });
  if (!v) return c.json({ error: 'Not a vendor' }, 404);

  // Only admin can approve vendors
  if ((user as any).role !== 'ADMIN') delete body.approved;

  const updated = await prisma.vendor.update({ 
    where: { id: v.id }, 
    data: { ...body },
    include: {
      products: { include: { images: true, video: true } },
    }
  });
  
  return c.json(updated);
});

// GET /api/vendor/all - list all vendors without KYC details (public)
vendor.get('/all', zValidator('query', vendorListQuerySchema), async (c) => {
  const { page, limit, search } = c.req.valid('query') as any;
  const where = search
    ? { 
        shopName: { contains: search, mode: 'insensitive' as const },
        approved: true // Only show approved vendors publicly
      }
    : { approved: true };

  const [items, total] = await Promise.all([
    prisma.vendor.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        products: { include: { video: true, images: true } },
        kyc: { select: { status: true } }, // expose only status publicly
      }
      // Intentionally not including KYC relation for privacy
    }),
    prisma.vendor.count({ where }),
  ]);

  return c.json({ items, page, limit, total });
});

// GET /api/vendor/:id - get a vendor by id (no KYC details for public, with KYC for admin)
vendor.get('/:id', zValidator('param', idParamSchema), async (c) => {
  const { id } = c.req.valid('param') as { id: string };
  const user = await currentUser(); // Optional auth for this endpoint
  
  const includeKycDocs = user && (user as any).role === 'ADMIN';
  
  const v = await prisma.vendor.findUnique({ 
    where: { id },
    include: {
      products: { include: { images: true, video: true } },
      ...(includeKycDocs
        ? { kyc: { select: { status: true, documents: true } } as any }
        : { kyc: { select: { status: true } } as any }),
    }
  });
  
  if (!v) return c.json({ error: 'Vendor not found' }, 404);
  
  // If not admin and vendor is not approved, don't show it
  if (!includeKycDocs && !v.approved) {
    return c.json({ error: 'Vendor not found' }, 404);
  }
  
  return c.json(v);
});

// PUT /api/vendor/:id/approve - Admin only: approve/reject vendor
vendor.put('/:id/approve', 
  zValidator('param', idParamSchema), 
  zValidator('json', z.object({ approved: z.boolean() })), 
  async (c) => {
    const user = await requireAdmin(c);
    if ((user as any).status) return user; // Return error response if auth failed
    
    const { id } = c.req.valid('param') as { id: string };
    const { approved } = c.req.valid('json') as { approved: boolean };

    const v = await prisma.vendor.findUnique({ where: { id } });
    if (!v) return c.json({ error: 'Vendor not found' }, 404);

    const updated = await prisma.vendor.update({
      where: { id },
      data: { approved },
      include: {
        kyc: { select: { status: true, documents: true } },
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    return c.json(updated);
  }
);

// PUT /api/vendor/:id/kyc/status - Admin only: update KYC status (no one else can alter)
vendor.put(
  '/:id/kyc/status',
  zValidator('param', idParamSchema),
  zValidator('json', z.object({ status: z.enum(['Pending', 'Approved', 'Rejected']) })),
  async (c) => {
    const user = await requireAdmin(c);
    if ((user as any).status) return user;

    const { id } = c.req.valid('param') as { id: string };
    const { status } = c.req.valid('json') as { status: 'Pending' | 'Approved' | 'Rejected' };

    const kyc = await prisma.kYC.findUnique({ where: { vendorId: id } });
    if (!kyc) return c.json({ error: 'KYC not found for vendor' }, 404);

    const updated = await prisma.kYC.update({
      where: { id: kyc.id },
      data: { status },
      include: { documents: true, vendor: { select: { id: true, shopName: true, approved: true } } },
    });

    return c.json(updated);
  }
);

export default vendor;

