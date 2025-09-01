import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { currentUser } from '@/lib/current-user';
import { Prisma } from '@prisma/client';

// GET /api/product - list products with pagination and filters
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const page = Math.max(parseInt(url.searchParams.get('page') || '1', 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(url.searchParams.get('limit') || '12', 10) || 12, 1), 100);
  const search = (url.searchParams.get('search') || '').trim() || undefined;
  const categoryId = url.searchParams.get('categoryId') || undefined;
  const vendorId = url.searchParams.get('vendorId') || undefined;
  const sort = (url.searchParams.get('sort') as 'new' | 'price_asc' | 'price_desc') || 'new';
  const flash = url.searchParams.get('flash'); // if 'true', only return products with >=50% discount

  const where: any = {};
  if (search) where.name = { contains: search, mode: 'insensitive' as const };
  if (categoryId) where.categoryId = categoryId;
  if (vendorId) where.vendorId = vendorId;

  const orderBy = sort === 'price_asc' ? { price: 'asc' as const } : sort === 'price_desc' ? { price: 'desc' as const } : { createdAt: 'desc' as const };

  const [itemsRaw, total] = await Promise.all([
    prisma.product.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy,
      include: {
        images: true,
        video: true,
        vendor: { select: { id: true, shopName: true, approved: true } },
        flashSales: true,
      },
    }),
    prisma.product.count({ where }),
  ]);

  let items = itemsRaw as any[];
  if (flash === 'true') {
    items = items.filter(p => {
      if (!p.discountPrice) return false;
      const orig = Number(p.price);
      const disc = Number(p.discountPrice);
      if (!isFinite(orig) || !isFinite(disc) || orig <= 0 || disc <= 0 || disc >= orig) return false;
      const pct = (orig - disc) / orig * 100;
      return pct >= 50; // 50% or more discount
    }).sort((a, b) => {
      // sort by highest discount percentage desc
      const da = (Number(a.price) - Number(a.discountPrice)) / Number(a.price);
      const db = (Number(b.price) - Number(b.discountPrice)) / Number(b.price);
      return db - da;
    });
  }

  return NextResponse.json({ items, page, limit, total });
}

// POST /api/product - create product for vendor (or admin)
export async function POST(req: NextRequest) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  // lightweight validation mirroring zod schema
  const name = body?.name;
  const slug = body?.slug;
  const price = Number(body?.price);
  const discountPrice = body?.discountPrice !== undefined ? Number(body.discountPrice) : undefined;
  if (!name || !slug || !Number.isFinite(price) || price <= 0) {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 });
  }
  if (discountPrice !== undefined) {
    if (!Number.isFinite(discountPrice) || discountPrice <= 0 || discountPrice >= price) {
      return NextResponse.json({ error: 'Invalid discountPrice (must be >0 and < price)' }, { status: 400 });
    }
  }

  const me: any = user;
  const vendor = await prisma.vendor.findUnique({ where: { userId: me.id } });
  const isAdmin = me.role === 'ADMIN';
  if (!vendor && !isAdmin) return NextResponse.json({ error: 'Vendor access required' }, { status: 403 });

  const data: any = {
    name: String(body.name),
    slug: String(body.slug),
    description: body.description ?? undefined,
    price: price,
  stock: Number.isFinite(Number(body?.stock)) ? Number(body.stock) : 0,
  discountPrice: discountPrice !== undefined ? discountPrice : undefined,
    vendorId: isAdmin && body.vendorId ? String(body.vendorId) : (vendor?.id as string),
    categoryId: body.categoryId || undefined,
  };

  try {
    const created = await prisma.product.create({
      data: {
        ...data,
        images: Array.isArray(body.images) && body.images.length > 0 ? {
          create: body.images.map((img: any) => ({ url: String(img.url), public_id: String(img.public_id) })),
        } : undefined,
        video: body.video ? { create: { url: String(body.video.url), public_id: String(body.video.public_id) } } : undefined,
      },
      include: {
        images: true,
        video: true,
        vendor: { select: { id: true, shopName: true, approved: true } },
        flashSales: true,
      },
    });
    return NextResponse.json(created, { status: 201 });
  } catch (e: any) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
      const target = (e.meta?.target as string[] | undefined)?.join(', ') || 'unique field';
      return NextResponse.json({ error: `Conflict: ${target} already exists` }, { status: 409 });
    }
    console.error('Product create failed', e);
    return NextResponse.json({ error: 'Failed to create product' }, { status: 500 });
  }
}

// PATCH /api/product - update product for vendor (or admin)
export async function PATCH(req: NextRequest) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const id = body?.id;
  if (!id) return NextResponse.json({ error: 'Missing product id' }, { status: 400 });

  const existing = await prisma.product.findUnique({
    where: { id },
    include: { vendor: true },
  });
  if (!existing) return NextResponse.json({ error: 'Product not found' }, { status: 404 });

  const me: any = user;
  const ownerVendor = await prisma.vendor.findUnique({ where: { userId: me.id } });
  const isAdmin = me.role === 'ADMIN';
  const isOwner = ownerVendor?.id === existing.vendorId;
  if (!isAdmin && !isOwner) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  // Validate discountPrice if provided
  if (body.discountPrice !== undefined) {
    if (body.discountPrice === null) {
      // null means remove discount
    } else if (typeof body.discountPrice !== 'number' || body.discountPrice <= 0) {
      return NextResponse.json({ error: 'Invalid discountPrice' }, { status: 400 });
    } else if (typeof body.price === 'number') {
      if (body.discountPrice >= body.price) {
        return NextResponse.json({ error: 'discountPrice must be less than price' }, { status: 400 });
      }
    } else if (body.discountPrice >= Number(existing.price)) {
      return NextResponse.json({ error: 'discountPrice must be less than current price' }, { status: 400 });
    }
  }

  // Base product fields update (excluding images/video handled below)
  // First update standard fields supported by current Prisma Client
  await prisma.product.update({
    where: { id },
    data: {
      name: body.name ?? undefined,
      slug: body.slug ?? undefined,
      description: body.description ?? undefined,
      price: typeof body.price === 'number' ? body.price : undefined,
      stock: typeof body.stock === 'number' ? body.stock : undefined,
      categoryId: body.categoryId ?? undefined,
    },
  });

  // Apply discountPrice separately using raw SQL until Prisma Client is regenerated
  if (body.discountPrice !== undefined) {
    try {
      if (body.discountPrice === null) {
        await prisma.$executeRawUnsafe('UPDATE "Product" SET "discountPrice" = NULL WHERE id = $1', id);
      } else if (typeof body.discountPrice === 'number') {
        await prisma.$executeRawUnsafe('UPDATE "Product" SET "discountPrice" = $1 WHERE id = $2', body.discountPrice, id);
      }
    } catch (e: any) {
      // Column probably not migrated yet; log and continue without failing entire request
      console.warn('discountPrice column update skipped (missing migration?):', e?.message);
    }
  }

  // If images provided, replace all images atomically
  if (Array.isArray(body.images)) {
    await prisma.productImg.deleteMany({ where: { productId: id } });
    if (body.images.length > 0) {
      await prisma.productImg.createMany({
        data: body.images.map((img: any) => ({ productId: id, url: String(img.url), public_id: String(img.public_id) })),
      });
    }
  }

  // If video provided: set/replace, if null: delete
  if (body.video !== undefined) {
    if (body.video === null) {
      await prisma.productVideo.deleteMany({ where: { productId: id } });
    } else {
      // upsert-like: delete existing then create new to avoid unique constraint on productId
      await prisma.$transaction([
        prisma.productVideo.deleteMany({ where: { productId: id } }),
        prisma.productVideo.create({ data: { productId: id, url: String(body.video.url), public_id: String(body.video.public_id) } }),
      ]);
    }
  }

  const result = await prisma.product.findUnique({
    where: { id },
    include: { images: true, video: true, vendor: { select: { id: true, shopName: true } } },
  });
  return NextResponse.json(result);
}
