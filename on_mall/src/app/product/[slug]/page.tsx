import { notFound } from 'next/navigation';
import { headers } from 'next/headers';
import AddToCartButton from '@/components/AddToCartButton';

async function fetchProduct(slug: string) {
  // Build an absolute URL for server-side fetch to avoid "Failed to parse URL" on relative paths
  const hdrs = await headers();
  const envBase = process.env.NEXT_PUBLIC_BASE_URL;
  const host = hdrs.get('host');
  const isAbsolute = envBase && /^(http|https):\/\//i.test(envBase);
  const protocol = process.env.VERCEL ? 'https' : 'http';
  const base = isAbsolute
    ? envBase!
    : host
      ? `${protocol}://${host}`
      : 'http://localhost:3000';

  const res = await fetch(`${base}/api/product/slug/${encodeURIComponent(slug)}`, {
    cache: 'no-store',
  });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error('Failed to load product');
  return res.json();
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await fetchProduct(slug);
  if (!product) return notFound();

  return (
    <div className="container mx-auto p-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          {product.images?.length ? (
            <div className="space-y-3">
              <img src={product.images[0].url} alt={product.name} className="w-full rounded" />
              {product.images.slice(1).length > 0 && (
                <div className="grid grid-cols-4 gap-2">
                  {product.images.slice(1).map((img: any) => (
                    <img key={img.id} src={img.url} className="w-full h-24 object-cover rounded" />
                  ))}
                </div>
              )}
            </div>
          ) : product.video?.url ? (
            <video className="w-full rounded" controls src={product.video.url} />
          ) : (
            <div className="text-sm text-muted-foreground">No media</div>
          )}
        </div>
        <div>
          <h1 className="text-2xl font-semibold">{product.name}</h1>
          <div className="text-lg text-muted-foreground mt-1">
            {(() => {
              const n = typeof product.price === 'number' ? product.price : parseFloat(String(product.price));
              return Number.isFinite(n) ? `$${n.toFixed(2)}` : `$${String(product.price)}`;
            })()}
          </div>
          {product.description && (
            <p className="mt-4 text-sm leading-6 text-gray-700">{product.description}</p>
          )}
          {product.category && (
            <div className="mt-4 text-sm">Category: {product.category.name}</div>
          )}
          <div className="mt-6">
            <AddToCartButton productId={product.id} />
          </div>
        </div>
      </div>
    </div>
  );
}
