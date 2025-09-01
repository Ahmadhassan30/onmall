import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { prisma } from '@/lib/prisma';
import { currentUser } from '@/lib/current-user';
import { categoryCreateSchema, categoryListQuerySchema } from '@/schema';

const category = new Hono();

async function requireAdmin(c: any) {
  const user = await currentUser();
  if (!user) return c.json({ error: 'Unauthorized' }, 401);
  if ((user as any).role !== 'ADMIN') return c.json({ error: 'Admin access required' }, 403);
  return user;
}

// GET /api/category?search=&parentId=
category.get('/', zValidator('query', categoryListQuerySchema), async (c) => {
  const { search, parentId } = c.req.valid('query') as any;
  const where: any = {};
  if (search) where.name = { contains: search, mode: 'insensitive' as const };
  if (parentId) where.parentId = parentId;

  const items = await prisma.category.findMany({
    where,
    orderBy: { name: 'asc' },
    include: { children: true },
  });
  return c.json(items);
});

// POST /api/category - admin only
category.post('/', zValidator('json', categoryCreateSchema), async (c) => {
  const user = await requireAdmin(c);
  if ((user as any).status) return user;
  const body = c.req.valid('json') as any;

  const created = await prisma.category.create({
    data: {
      name: body.name,
      slug: body.slug,
      parentId: body.parentId ?? undefined,
    },
  });
  return c.json(created, 201);
});

export default category;
