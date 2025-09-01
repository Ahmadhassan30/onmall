"use client";
import { useState } from 'react';

async function addToCartAPI(productId: string, quantity = 1) {
  const res = await fetch('/api/cart', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ productId, quantity }),
  });
  if (!res.ok) throw new Error('Failed to add to cart');
  return res.json();
}

export default function AddToCartButton({ productId }: { productId: string }) {
  const [isLoading, setIsLoading] = useState(false);

  const handleAddToCart = async () => {
    setIsLoading(true);
    try {
      await addToCartAPI(productId, 1);
      alert('Added to cart!');
      // Trigger a page refresh or dispatch custom event to update cart count
      window.dispatchEvent(new CustomEvent('cartUpdated'));
    } catch (error: any) {
      alert('Failed to add to cart: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button 
      onClick={handleAddToCart}
      disabled={isLoading}
      className="px-4 py-2 bg-black text-white rounded disabled:opacity-50 hover:bg-gray-800 transition-colors"
    >
      {isLoading ? 'Adding...' : 'Add to cart'}
    </button>
  );
}
