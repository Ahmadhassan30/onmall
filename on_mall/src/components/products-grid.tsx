"use client";
import { useEffect, useState } from 'react';
import Link from 'next/link';

async function fetchJSON(url: string, init?: RequestInit) {
  const res = await fetch(url, { ...init, credentials: 'include' });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

type Product = {
  id: string;
  name: string;
  price: number | string;
  discountPrice?: number | string | null;
  images?: { url: string }[];
  video?: { url: string } | null;
};

type ProductList = { items: Product[] };

function QuickAddToCart({ productId }: { productId: string }) {
  const [isLoading, setIsLoading] = useState(false);

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent navigation
    setIsLoading(true);
    try {
      const res = await fetch('/api/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ productId, quantity: 1 }),
      });
      if (!res.ok) throw new Error('Failed to add to cart');
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
      className="w-full mt-2 px-3 py-1 bg-orange-500 text-white text-sm rounded hover:bg-orange-600 disabled:opacity-50"
    >
      {isLoading ? 'Adding...' : 'Add to Cart'}
    </button>
  );
}

export default function ProductsGrid() {
  const [data, setData] = useState<ProductList | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetchJSON('/api/product?page=1&limit=12&sort=new');
        setData(res);
      } catch (e: any) {
        setError(e?.message || 'Failed to load products');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <div>Loading...</div>;
  if (error) return <div className="text-red-600">{error}</div>;
  if (!data || data.items.length === 0) return <div>No products</div>;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {data.items.map((p) => (
        <div key={p.id} className="border rounded p-3 hover:shadow-sm">
          <Link href={`/product/${(p as any).slug || p.id}`} className="block">
            <div className="font-medium mb-1">{p.name}</div>
            {p.images?.[0]?.url && (
              <img src={p.images[0].url} alt={p.name} className="w-full h-40 object-cover rounded mb-2" />
            )}
            {!p.images?.[0]?.url && p.video?.url && (
              <video className="w-full h-40 rounded mb-2" controls src={p.video.url} />
            )}
            <div className="text-sm mb-2 flex items-baseline space-x-2">
              {p.discountPrice ? (
                <>
                  {(() => {
                    const orig = Number(p.price);
                    const disc = Number(p.discountPrice);
                    const pct = orig > 0 && disc > 0 && disc < orig ? Math.round((orig - disc) / orig * 100) : null;
                    return (
                      <>
                        <span className="text-orange-600 font-semibold">${disc.toFixed ? disc.toFixed(2) : Number(disc).toFixed(2)}</span>
                        <span className="line-through text-gray-400 text-xs">${orig.toFixed ? orig.toFixed(2) : Number(orig).toFixed(2)}</span>
                        {pct !== null && <span className="text-green-600 text-xs font-medium">-{pct}%</span>}
                      </>
                    );
                  })()}
                </>
              ) : (
                (() => {
                  const n = typeof p.price === 'number' ? p.price : parseFloat(String(p.price));
                  return Number.isFinite(n) ? `$${n.toFixed(2)}` : `$${String(p.price)}`;
                })()
              )}
            </div>
          </Link>
          <QuickAddToCart productId={p.id} />
        </div>
      ))}
    </div>
  );
}
