import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { currentUser } from '@/lib/current-user';
import { idParamSchema, productCreateSchema, productUpdateSchema, productListQuerySchema } from '@/schema';

const product = new Hono();

// helpers
async function requireAuth(c: any) {
	const user = await currentUser();
	if (!user) return c.json({ error: 'Unauthorized' }, 401);
	return user;
}

function buildOrderBy(sort: 'new' | 'price_asc' | 'price_desc') {
	if (sort === 'price_asc') return { price: 'asc' as const };
	if (sort === 'price_desc') return { price: 'desc' as const };
	return { createdAt: 'desc' as const };
}

// GET /api/product - list products (pagination) with vendor, images, video, flash sales if any
product.get('/', zValidator('query', productListQuerySchema), async (c) => {
	const { page, limit, search, categoryId, vendorId, sort } = c.req.valid('query') as any;

	const where: any = {};
	if (search) where.name = { contains: search, mode: 'insensitive' as const };
	if (categoryId) where.categoryId = categoryId;
	if (vendorId) where.vendorId = vendorId;

	const [items, total] = await Promise.all([
		prisma.product.findMany({
			where,
			skip: (page - 1) * limit,
			take: limit,
			orderBy: buildOrderBy(sort),
			include: {
				images: true,
				video: true,
				vendor: { select: { id: true, shopName: true, approved: true } },
				flashSales: true,
			},
		}),
		prisma.product.count({ where }),
	]);

	return c.json({ items, page, limit, total });
});

// GET /api/product/:id - product detail with images, video, vendor, flash sales
product.get('/:id', zValidator('param', idParamSchema), async (c) => {
	const { id } = c.req.valid('param') as { id: string };
	const p = await prisma.product.findUnique({
		where: { id },
		include: {
			images: true,
			video: true,
			vendor: { select: { id: true, shopName: true, approved: true } },
			flashSales: true,
			category: { select: { id: true, name: true, slug: true } },
		},
	});
	if (!p) return c.json({ error: 'Product not found' }, 404);
	return c.json(p);
});

// GET /api/product/slug/:slug - product detail by slug
product.get('/slug/:slug', zValidator('param', z.object({ slug: z.string().min(1) })), async (c) => {
	const { slug } = c.req.valid('param') as { slug: string };
	const p = await prisma.product.findUnique({
		where: { slug },
		include: {
			images: true,
			video: true,
			vendor: { select: { id: true, shopName: true, approved: true } },
			flashSales: true,
			category: { select: { id: true, name: true, slug: true } },
		},
	});
	if (!p) return c.json({ error: 'Product not found' }, 404);
	return c.json(p);
});

// POST /api/product - create product (must be vendor or admin)
product.post('/', zValidator('json', productCreateSchema), async (c) => {
	const user = await requireAuth(c);
	if ((user as any).status) return user;
	const body = c.req.valid('json') as z.infer<typeof productCreateSchema>;

	// must be vendor or admin
	const me = user as any;
	const vendor = await prisma.vendor.findUnique({ where: { userId: me.id } });
	const isAdmin = me.role === 'ADMIN';
	if (!vendor && !isAdmin) return c.json({ error: 'Vendor access required' }, 403);

		const data: any = {
		name: body.name,
		slug: body.slug,
		description: body.description ?? undefined,
		price: body.price,
		stock: body.stock ?? 0,
			vendorId: isAdmin && body.vendorId ? body.vendorId : (vendor?.id as string),
		categoryId: body.categoryId ?? undefined,
	};

	// Create product with nested media if provided
	const created = await prisma.product.create({
		data: {
			...data,
			images: body.images && body.images.length > 0 ? {
				create: body.images.map((img) => ({ url: img.url, public_id: img.public_id })),
			} : undefined,
			video: body.video ? {
				create: { url: body.video.url, public_id: body.video.public_id },
			} : undefined,
		},
		include: {
			images: true,
			video: true,
			vendor: { select: { id: true, shopName: true, approved: true } },
			flashSales: true,
		},
	});
	return c.json(created, 201);
});

// PATCH /api/product - update (owner vendor or admin)
product.patch('/', zValidator('json', productUpdateSchema.extend({ id: z.string().uuid() })), async (c) => {
	const user = await requireAuth(c);
	if ((user as any).status) return user;
	const body = c.req.valid('json') as z.infer<typeof productUpdateSchema> & { id: string };
	const { id, ...updateData } = body;

	const existing = await prisma.product.findUnique({
		where: { id },
		include: { vendor: true },
	});
	if (!existing) return c.json({ error: 'Product not found' }, 404);

	const me = user as any;
	const ownerVendor = await prisma.vendor.findUnique({ where: { userId: me.id } });
	const isAdmin = me.role === 'ADMIN';
	const isOwner = ownerVendor?.id === existing.vendorId;
	if (!isAdmin && !isOwner) return c.json({ error: 'Forbidden' }, 403);

	// Base product fields update
	const updated = await prisma.product.update({
		where: { id },
		data: {
			name: updateData.name ?? undefined,
			slug: updateData.slug ?? undefined,
			description: updateData.description ?? undefined,
			price: updateData.price ?? undefined,
			stock: updateData.stock ?? undefined,
			categoryId: updateData.categoryId ?? undefined,
		},
		include: { images: true, video: true, vendor: { select: { id: true, shopName: true } } },
	});

	// If images provided, replace all images atomically
	if (updateData.images) {
		await prisma.productImg.deleteMany({ where: { productId: id } });
		if (updateData.images.length > 0) {
			await prisma.productImg.createMany({
				data: updateData.images.map((img) => ({ productId: id, url: img.url, public_id: img.public_id })),
			});
		}
	}

	// If video provided: set/replace, if null: delete
	if (updateData.video !== undefined) {
		if (updateData.video === null) {
			await prisma.productVideo.deleteMany({ where: { productId: id } });
		} else {
			// upsert-like: delete existing then create new to avoid unique constraint on productId
			await prisma.$transaction([
				prisma.productVideo.deleteMany({ where: { productId: id } }),
				prisma.productVideo.create({ data: { productId: id, url: updateData.video.url, public_id: updateData.video.public_id } }),
			]);
		}
	}

	const result = await prisma.product.findUnique({
		where: { id },
		include: { images: true, video: true, vendor: { select: { id: true, shopName: true } } },
	});
	return c.json(result);
});

// DELETE /api/product - delete (owner vendor or admin)
product.delete('/', zValidator('json', z.object({ id: z.string().uuid() })), async (c) => {
	const user = await requireAuth(c);
	if ((user as any).status) return user;
	const { id } = c.req.valid('json') as { id: string };

	const existing = await prisma.product.findUnique({ where: { id } });
	if (!existing) return c.json({ error: 'Product not found' }, 404);

	const me = user as any;
	const ownerVendor = await prisma.vendor.findUnique({ where: { userId: me.id } });
	const isAdmin = me.role === 'ADMIN';
	const isOwner = ownerVendor?.id === existing.vendorId;
	if (!isAdmin && !isOwner) return c.json({ error: 'Forbidden' }, 403);

	await prisma.product.delete({ where: { id } });
	return c.json({ success: true });
});

export default product;
