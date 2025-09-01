"use client";
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

// Minimal fetchers against Hono routes
async function fetchJSON(url: string, init?: RequestInit) {
  const res = await fetch(url, { ...init, credentials: 'include' });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

type ProductImg = { id: string; url: string; public_id: string };

type Product = {
  id: string;
  name: string;
  slug: string;
  price: number | string;
  stock: number;
  images: ProductImg[];
  createdAt: string;
};

type VendorProfile = {
  id: string;
  shopName: string;
  products: Product[];
};
type Category = { id: string; name: string; slug: string };

export default function SellerDashPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [vendor, setVendor] = useState<VendorProfile | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);

  // Add Product form state
  const [form, setForm] = useState({
    name: '',
    slug: '',
    price: '',
  discountPrice: '',
    stock: '0',
    description: '',
    categoryId: '',
  });
  const [images, setImages] = useState<{ url: string; public_id: string }[]>([]);
  const [video, setVideo] = useState<{ url: string; public_id: string } | null>(null);
  const [uploading, setUploading] = useState(false);
  const [imagesProgress, setImagesProgress] = useState<{ completed: number; total: number } | null>(null);
  const [videoUploading, setVideoUploading] = useState(false);

  async function uploadImage(file: File) {
    const fd = new FormData();
    fd.append('file', file);
    const res = await fetch('/api/image-upload', { method: 'POST', body: fd, credentials: 'include' });
    if (!res.ok) throw new Error(await res.text());
    const data = await res.json();
    const { result } = data as any;
    return { url: result.secure_url as string, public_id: result.public_id as string };
  }

  async function uploadVideo(file: File) {
    const fd = new FormData();
    fd.append('file', file);
    const res = await fetch('/api/video-upload', { method: 'POST', body: fd, credentials: 'include' });
    if (!res.ok) throw new Error(await res.text());
    const data = await res.json();
    const { result } = data as any;
    return { url: result.secure_url as string, public_id: result.public_id as string };
  }

  useEffect(() => {
    (async () => {
      try {
        const [vData, cats] = await Promise.all([
          fetchJSON('/api/vendor/profile'),
          fetchJSON('/api/category'),
        ]);
        setVendor(vData);
        setCategories(cats);
      } catch (e: any) {
        setError(e?.message || 'Failed to load');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const totalOrders = 0; // TODO: replace with vendor orders aggregate endpoint if needed

  async function handleCreateProduct(e: React.FormEvent) {
    e.preventDefault();
    try {
      setUploading(true);
  const body: any = {
        name: form.name,
        slug: form.slug,
        description: form.description || undefined,
        price: Number(form.price),
        stock: Number(form.stock) || 0,
        categoryId: form.categoryId || undefined,
        images: images.length ? images : undefined,
        video: video ? video : undefined,
      };
  if (form.discountPrice) body.discountPrice = Number(form.discountPrice);
      const created = await fetchJSON('/api/product', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      // refresh vendor profile to show new product
      const refreshed = await fetchJSON('/api/vendor/profile');
      setVendor(refreshed);
  setForm({ name: '', slug: '', price: '', discountPrice: '', stock: '0', description: '', categoryId: '' });
      setImages([]);
      setVideo(null);
    } catch (e: any) {
      alert(e?.message || 'Create failed');
    } finally {
      setUploading(false);
    }
  }

  if (loading) return <div className="p-6">Loading...</div>;
  if (error) return <div className="p-6 text-red-600">{error}</div>;
  if (!vendor) return <div className="p-6">Not a vendor</div>;

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Seller Dashboard</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader><CardTitle>Total Products</CardTitle></CardHeader>
          <CardContent className="text-2xl font-bold">{vendor.products.length}</CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Total Orders</CardTitle></CardHeader>
          <CardContent className="text-2xl font-bold">{totalOrders}</CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Shop</CardTitle></CardHeader>
          <CardContent className="text-lg">{vendor.shopName}</CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Add Product</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreateProduct} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Name</Label>
              <Input id="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            </div>
            <div>
              <Label htmlFor="slug">Slug</Label>
              <Input id="slug" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} required />
            </div>
            <div>
              <Label htmlFor="price">Price</Label>
              <Input id="price" type="number" step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} required />
            </div>
            <div>
              <Label htmlFor="discountPrice">Discount Price (optional)</Label>
              <Input id="discountPrice" type="number" step="0.01" value={form.discountPrice} onChange={(e) => setForm({ ...form, discountPrice: e.target.value })} />
              {form.price && form.discountPrice && Number(form.price) > 0 && Number(form.discountPrice) > 0 && Number(form.discountPrice) < Number(form.price) && (
                <div className="text-xs text-green-600 mt-1 font-medium">
                  {Math.round(((Number(form.price) - Number(form.discountPrice)) / Number(form.price)) * 100)}% OFF
                </div>
              )}
            </div>
            <div>
              <Label htmlFor="stock">Stock</Label>
              <Input id="stock" type="number" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} />
            </div>
            <div className="md:col-span-2">
              <Label htmlFor="description">Description</Label>
              <Input id="description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
            <div className="md:col-span-2">
              <Label htmlFor="categoryId">Category (optional)</Label>
              <select
                id="categoryId"
                className="mt-1 w-full border rounded h-9 px-3 text-sm"
                value={form.categoryId}
                onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
              >
                <option value="">-- None --</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.slug})
                  </option>
                ))}
              </select>
            </div>
            <div className="md:col-span-2">
              <Label>Images</Label>
              <Input
                type="file"
                accept="image/*"
                multiple
                onChange={async (e) => {
                  const files = Array.from(e.target.files || []);
                  if (!files.length) return;
                  try {
                    setUploading(true);
                    setImagesProgress({ completed: 0, total: files.length });
                    const uploaded: { url: string; public_id: string }[] = [];
                    for (const [idx, f] of files.entries()) {
                      const img = await uploadImage(f);
                      uploaded.push(img);
                      setImagesProgress({ completed: idx + 1, total: files.length });
                    }
                    setImages((prev) => [...prev, ...uploaded]);
                  } catch (err: any) {
                    alert(err?.message || 'Image upload failed');
                  } finally {
                    setUploading(false);
                    setTimeout(() => setImagesProgress(null), 800);
                  }
                }}
              />
              {images.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2">
                  {images.map((img, idx) => (
                    <div key={idx} className="relative">
                      <img src={img.url} className="w-full h-24 object-cover rounded" />
                    </div>
                  ))}
                </div>
              )}
              {imagesProgress && (
                <div className="mt-2">
                  <div className="h-2 bg-gray-200 rounded">
                    <div className="h-2 bg-blue-500 rounded" style={{ width: `${Math.round((imagesProgress.completed / imagesProgress.total) * 100)}%` }} />
                  </div>
                  <div className="text-xs text-gray-600 mt-1">
                    Uploading images {imagesProgress.completed}/{imagesProgress.total}
                  </div>
                </div>
              )}
            </div>
            <div className="md:col-span-2">
              <Label>Video</Label>
              <Input
                type="file"
                accept="video/*"
                onChange={async (e) => {
                  const f = (e.target.files || [])[0];
                  if (!f) return;
                  try {
                    setUploading(true);
                    setVideoUploading(true);
                    const v = await uploadVideo(f);
                    setVideo(v);
                  } catch (err: any) {
                    alert(err?.message || 'Video upload failed');
                  } finally {
                    setUploading(false);
                    setVideoUploading(false);
                  }
                }}
              />
              {video && (
                <video className="w-full mt-2" controls src={video.url} />
              )}
              {videoUploading && (
                <div className="text-xs text-gray-600 mt-1">Uploading video...</div>
              )}
            </div>
            <div className="md:col-span-2 flex gap-2">
              <Button type="submit" disabled={uploading}>Create</Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Your Products</CardTitle>
        </CardHeader>
        <CardContent>
          {vendor.products.length === 0 ? (
            <div className="text-sm text-muted-foreground">No products yet.</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {vendor.products.map((p) => (
                <div key={p.id} className="border rounded p-3">
                  <div className="font-medium">{p.name}</div>
                  <div className="text-sm text-muted-foreground">
                    {
                      (() => {
                        const n = typeof p.price === 'number' ? p.price : parseFloat(String(p.price));
                        return Number.isFinite(n) ? `$${n.toFixed(2)}` : `$${String(p.price)}`;
                      })()
                    }
                  </div>
                  {p.images?.[0]?.url && (
                    <img src={p.images[0].url} alt={p.name} className="w-full h-40 object-cover rounded mt-2" />
                  )}
                  {/* show video if exists */}
                  {(p as any).video?.url && (
                    <video className="w-full mt-2" controls src={(p as any).video.url} />
                  )}
                  <div className="flex gap-2 mt-3">
                    <a href={`/vendor-center/seller-dash/edit/${p.id}`} className="text-sm underline">Edit</a>
                    <a href={`/product/${(p as any).slug || p.id}`} className="text-sm underline" target="_blank" rel="noopener noreferrer">View</a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
