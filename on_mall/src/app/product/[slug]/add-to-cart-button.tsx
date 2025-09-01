"use client";
import { useAddToCart } from '@/app/_api/cart/use-cart';

export default function AddToCartButton({ productId }: { productId: string }) {
  const { mutate: addToCart, isPending } = useAddToCart();

  const handleAddToCart = () => {
    addToCart({ productId, quantity: 1 }, {
      onSuccess: () => {
        alert('Added to cart!');
      },
      onError: (error) => {
        alert('Failed to add to cart: ' + error.message);
      }
    });
  };

  return (
    <button 
      onClick={handleAddToCart}
      disabled={isPending}
      className="px-4 py-2 bg-black text-white rounded disabled:opacity-50 hover:bg-gray-800 transition-colors"
    >
      {isPending ? 'Adding...' : 'Add to cart'}
    </button>
  );
}
