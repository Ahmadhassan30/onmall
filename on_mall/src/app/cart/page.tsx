"use client";
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import Link from 'next/link';

type CartItem = {
  id: string;
  productId: string;
  quantity: number;
  price: number;
  product: {
    id: string;
    name: string;
    slug: string;
    price: number;
    images: Array<{ url: string }>;
    vendor: { shopName: string };
  };
};

type CartData = {
  items: CartItem[];
  total: number;
};

async function fetchCart(): Promise<CartData> {
  const res = await fetch('/api/cart', { credentials: 'include' });
  if (!res.ok) throw new Error('Failed to fetch cart');
  return res.json();
}

async function updateCartItem(productId: string, quantity: number): Promise<CartData> {
  const res = await fetch('/api/cart', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ productId, quantity }),
  });
  if (!res.ok) throw new Error('Failed to update cart');
  return res.json();
}

async function clearCart(): Promise<CartData> {
  const res = await fetch('/api/cart', {
    method: 'DELETE',
    credentials: 'include',
  });
  if (!res.ok) throw new Error('Failed to clear cart');
  return res.json();
}

export default function CartPage() {
  const [cartData, setCartData] = useState<CartData>({ items: [], total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadCart = async () => {
      try {
        const data = await fetchCart();
        setCartData(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    loadCart();
  }, []);

  const handleQuantityChange = async (productId: string, newQuantity: number) => {
    try {
      const data = await updateCartItem(productId, newQuantity);
      setCartData(data);
      window.dispatchEvent(new CustomEvent('cartUpdated'));
    } catch (err: any) {
      alert('Failed to update cart: ' + err.message);
    }
  };

  const handleClearCart = async () => {
    if (confirm('Are you sure you want to clear your cart?')) {
      try {
        const data = await clearCart();
        setCartData(data);
        window.dispatchEvent(new CustomEvent('cartUpdated'));
      } catch (err: any) {
        alert('Failed to clear cart: ' + err.message);
      }
    }
  };

  if (loading) return <div className="container mx-auto p-6">Loading cart...</div>;
  if (error) return <div className="container mx-auto p-6 text-red-600">Error loading cart: {error}</div>;

  const items = cartData?.items || [];
  const total = cartData?.total || 0;

  if (items.length === 0) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-12">
          <h1 className="text-2xl font-semibold mb-4">Your Cart is Empty</h1>
          <p className="text-gray-600 mb-6">Looks like you haven't added anything to your cart yet.</p>
          <Link href="/">
            <Button>Continue Shopping</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Shopping Cart ({items.length} items)</h1>
        <Button variant="outline" onClick={handleClearCart}>
          Clear Cart
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Cart Items */}
        <div className="lg:col-span-2 space-y-4">
          {items.map((item) => (
            <Card key={item.id}>
              <CardContent className="p-4">
                <div className="flex items-start space-x-4">
                  {/* Product Image */}
                  <div className="w-24 h-24 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                    {item.product.images?.[0]?.url ? (
                      <img 
                        src={item.product.images[0].url} 
                        alt={item.product.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        No image
                      </div>
                    )}
                  </div>

                  {/* Product Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-lg font-medium text-gray-900">
                          <Link href={`/product/${item.product.slug}`} className="hover:text-orange-500">
                            {item.product.name}
                          </Link>
                        </h3>
                        <p className="text-sm text-gray-500">
                          Sold by {item.product.vendor.shopName}
                        </p>
                        <p className="text-lg font-semibold text-gray-900 mt-1">
                          ${typeof item.product.price === 'number' 
                            ? item.product.price.toFixed(2) 
                            : parseFloat(String(item.product.price)).toFixed(2)}
                        </p>
                      </div>
                      
                      {/* Remove Button */}
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleQuantityChange(item.productId, 0)}
                        className="text-red-500 hover:text-red-700"
                      >
                        Remove
                      </Button>
                    </div>

                    {/* Quantity Controls */}
                    <div className="flex items-center mt-4">
                      <span className="text-sm text-gray-700 mr-3">Quantity:</span>
                      <div className="flex items-center border rounded">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleQuantityChange(item.productId, item.quantity - 1)}
                          className="px-3 py-1 h-8"
                        >
                          -
                        </Button>
                        <span className="px-3 py-1 text-sm">{item.quantity}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleQuantityChange(item.productId, item.quantity + 1)}
                          className="px-3 py-1 h-8"
                        >
                          +
                        </Button>
                      </div>
                      <span className="ml-4 text-sm text-gray-600">
                        Subtotal: ${(
                          (typeof item.product.price === 'number' 
                            ? item.product.price 
                            : parseFloat(String(item.product.price))) * item.quantity
                        ).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <Card className="sticky top-6">
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between">
                <span>Subtotal ({items.reduce((sum, item) => sum + item.quantity, 0)} items)</span>
                <span>${total.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Shipping</span>
                <span className="text-green-600">Free</span>
              </div>
              <div className="border-t pt-4">
                <div className="flex justify-between text-lg font-semibold">
                  <span>Total</span>
                  <span>${total.toFixed(2)}</span>
                </div>
              </div>
              <Button className="w-full bg-orange-500 hover:bg-orange-600">
                Proceed to Checkout
              </Button>
              <Link href="/">
                <Button variant="outline" className="w-full">
                  Continue Shopping
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
