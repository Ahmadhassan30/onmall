import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { currentUser } from '@/lib/current-user';
import { cookies } from 'next/headers';
import { v4 as uuidv4 } from 'uuid';

// Helper to get or create guest ID
async function getGuestId() {
  const cookieStore = await cookies();
  let guestId = cookieStore.get('guestId')?.value;
  if (!guestId) {
    guestId = uuidv4();
  }
  return guestId;
}

// Helper to get cart for user or guest
async function getCart(userId?: string, guestId?: string) {
  if (userId) {
    return await prisma.cart.findUnique({
      where: { userId },
      include: {
        items: {
          include: {
            product: {
              include: {
                images: true,
                vendor: { select: { shopName: true } }
              }
            }
          }
        }
      }
    });
  } else if (guestId) {
    return await prisma.cart.findUnique({
      where: { guestId },
      include: {
        items: {
          include: {
            product: {
              include: {
                images: true,
                vendor: { select: { shopName: true } }
              }
            }
          }
        }
      }
    });
  }
  return null;
}

// GET /api/cart - get cart items
export async function GET() {
  try {
    const user = await currentUser();
    const guestId = await getGuestId();
    
    const cart = await getCart(user?.id, guestId);
    
    if (!cart) {
      return NextResponse.json({ items: [], total: 0 });
    }

    const total = cart.items.reduce((sum, item) => {
      const price = typeof item.product.price === 'string' 
        ? parseFloat(item.product.price) 
        : Number(item.product.price);
      return sum + (price * item.quantity);
    }, 0);

    const response = NextResponse.json({ 
      items: cart.items,
      total: parseFloat(total.toFixed(2))
    });

    // Set guest ID cookie if not authenticated
    if (!user) {
      response.cookies.set('guestId', guestId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
      });
    }

    return response;
  } catch (error) {
    console.error('Cart GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch cart' }, { status: 500 });
  }
}

// POST /api/cart - add item to cart
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { productId, quantity = 1 } = body;

    if (!productId) {
      return NextResponse.json({ error: 'Product ID is required' }, { status: 400 });
    }

    // Verify product exists
    const product = await prisma.product.findUnique({
      where: { id: productId }
    });

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    const user = await currentUser();
    const guestId = await getGuestId();

    // Get or create cart
    let cart = await getCart(user?.id, guestId);
    
    if (!cart) {
      cart = await prisma.cart.create({
        data: user ? { userId: user.id } : { guestId },
        include: {
          items: {
            include: {
              product: {
                include: {
                  images: true,
                  vendor: { select: { shopName: true } }
                }
              }
            }
          }
        }
      });
    }

    // Check if item already exists in cart
    const existingItem = await prisma.cartItem.findUnique({
      where: {
        cartId_productId: {
          cartId: cart.id,
          productId
        }
      }
    });

    if (existingItem) {
      // Update quantity
      await prisma.cartItem.update({
        where: { id: existingItem.id },
        data: { quantity: existingItem.quantity + quantity }
      });
    } else {
      // Add new item
      await prisma.cartItem.create({
        data: {
          cartId: cart.id,
          productId,
          quantity,
          price: product.price
        }
      });
    }

    // Get updated cart
    const updatedCart = await getCart(user?.id, guestId);
    const total = updatedCart?.items.reduce((sum, item) => {
      const price = typeof item.product.price === 'string' 
        ? parseFloat(item.product.price) 
        : Number(item.product.price);
      return sum + (price * item.quantity);
    }, 0) || 0;

    const response = NextResponse.json({ 
      success: true,
      items: updatedCart?.items || [],
      total: parseFloat(total.toFixed(2))
    });

    // Set guest ID cookie if not authenticated
    if (!user) {
      response.cookies.set('guestId', guestId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
      });
    }

    return response;
  } catch (error) {
    console.error('Cart POST error:', error);
    return NextResponse.json({ error: 'Failed to add to cart' }, { status: 500 });
  }
}

// PATCH /api/cart - update item quantity
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { productId, quantity } = body;

    if (!productId || typeof quantity !== 'number') {
      return NextResponse.json({ error: 'Product ID and quantity are required' }, { status: 400 });
    }

    const user = await currentUser();
    const guestId = await getGuestId();
    
    const cart = await getCart(user?.id, guestId);
    
    if (!cart) {
      return NextResponse.json({ error: 'Cart not found' }, { status: 404 });
    }

    if (quantity <= 0) {
      // Remove item
      await prisma.cartItem.delete({
        where: {
          cartId_productId: {
            cartId: cart.id,
            productId
          }
        }
      });
    } else {
      // Update quantity
      await prisma.cartItem.update({
        where: {
          cartId_productId: {
            cartId: cart.id,
            productId
          }
        },
        data: { quantity }
      });
    }

    // Get updated cart
    const updatedCart = await getCart(user?.id, guestId);
    const total = updatedCart?.items.reduce((sum, item) => {
      const price = typeof item.product.price === 'string' 
        ? parseFloat(item.product.price) 
        : Number(item.product.price);
      return sum + (price * item.quantity);
    }, 0) || 0;

    return NextResponse.json({ 
      success: true,
      items: updatedCart?.items || [],
      total: parseFloat(total.toFixed(2))
    });
  } catch (error) {
    console.error('Cart PATCH error:', error);
    return NextResponse.json({ error: 'Failed to update cart' }, { status: 500 });
  }
}

// DELETE /api/cart - clear cart
export async function DELETE() {
  try {
    const user = await currentUser();
    const guestId = await getGuestId();
    
    const cart = await getCart(user?.id, guestId);
    
    if (cart) {
      await prisma.cartItem.deleteMany({
        where: { cartId: cart.id }
      });
    }

    return NextResponse.json({ success: true, items: [], total: 0 });
  } catch (error) {
    console.error('Cart DELETE error:', error);
    return NextResponse.json({ error: 'Failed to clear cart' }, { status: 500 });
  }
}
