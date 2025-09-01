import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { currentUser } from '@/lib/current-user';
import { categoryCreateSchema } from '@/schema';

// GET /api/category - list all categories (public)
export async function GET(_req: NextRequest) {
  const items = await prisma.category.findMany({ orderBy: { name: 'asc' } });
  return NextResponse.json(items);
}

// POST /api/category - admin only create
export async function POST(req: NextRequest) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if ((user as any).role !== 'ADMIN') return NextResponse.json({ error: 'Admin access required' }, { status: 403 });

  const body = await req.json().catch(() => ({}));
  const parsed = categoryCreateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'Invalid body', issues: parsed.error.issues }, { status: 400 });

  const { name, slug, parentId } = parsed.data as any;
  const created = await prisma.category.create({
    data: { name, slug, parentId: parentId ?? undefined },
  });
  return NextResponse.json(created, { status: 201 });
}
