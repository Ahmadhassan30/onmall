"use client";
import { useEffect, useState } from 'react';
import Link from 'next/link';

type Product = {
  id: string;
  name: string;
  price: number | string;
  discountPrice?: number | string | null;
  images?: { url: string }[];
};

export default function FlashSaleSection() {
  const [items, setItems] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/product?flash=true&limit=100');
        if (!res.ok) throw new Error(await res.text());
        const data = await res.json();
        setItems(data.items || []);
      } catch (e: any) {
        setError(e.message || 'Failed to load flash sale');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <section className="mt-8"><h2 className="text-xl font-semibold mb-3">Flash Sale</h2><div>Loading...</div></section>;
  if (error) return <section className="mt-8"><h2 className="text-xl font-semibold mb-3">Flash Sale</h2><div className="text-red-600 text-sm">{error}</div></section>;
  if (items.length === 0) return null;

  return (
    <section className="mt-8">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-xl font-semibold">Flash Sale (50%+ OFF)</h2>
        <Link href="/flash-sale" className="text-sm text-orange-600 hover:underline">View All</Link>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {items.slice(0, 12).map(p => {
          const orig = Number(p.price);
          const disc = Number(p.discountPrice);
          const pct = orig > 0 && disc > 0 ? Math.round((orig - disc) / orig * 100) : 0;
          return (
            <Link key={p.id} href={`/product/${(p as any).slug || p.id}`} className="group border rounded-lg bg-white p-3 shadow-sm hover:shadow-md transition">
              <div className="relative mb-2 aspect-square overflow-hidden rounded">
                {p.images?.[0]?.url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.images[0].url} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs bg-gray-50">No Image</div>
                )}
                <span className="absolute top-1 left-1 bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded font-semibold">-{pct}%</span>
              </div>
              <div className="text-xs font-medium line-clamp-2 h-8 mb-1">{p.name}</div>
              <div className="flex items-baseline space-x-1">
                <span className="text-sm font-semibold text-orange-600">${disc.toFixed ? disc.toFixed(2) : Number(disc).toFixed(2)}</span>
                <span className="text-[11px] line-through text-gray-400">${orig.toFixed ? orig.toFixed(2) : Number(orig).toFixed(2)}</span>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
