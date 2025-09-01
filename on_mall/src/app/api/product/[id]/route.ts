import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/product/[id] - get product by ID
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  const product = await prisma.product.findUnique({
    where: { id },
    include: {
      images: true,
      video: true,
      vendor: { select: { id: true, shopName: true, approved: true } },
      flashSales: true,
      category: { select: { id: true, name: true, slug: true } },
    },
  });
  
  if (!product) {
    return NextResponse.json({ error: 'Product not found' }, { status: 404 });
  }
  
  return NextResponse.json(product);
}
