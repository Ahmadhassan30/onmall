"use client";
import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

async function fetchJSON(url: string, init?: RequestInit) {
  const res = await fetch(url, { ...init, credentials: 'include' });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

type Category = { id: string; name: string; slug: string };

type Product = {
  id: string;
  name: string;
  slug: string;
  price: number | string;
  discountPrice?: number | string | null;
  stock: number;
  description?: string | null;
  categoryId?: string | null;
  images?: { url: string; public_id: string }[];
  video?: { url: string; public_id: string } | null;
};

export default function EditProductPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = params?.id as string;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cats, setCats] = useState<Category[]>([]);
  const [product, setProduct] = useState<Product | null>(null);

  const [form, setForm] = useState({
    name: '',
    slug: '',
    price: '',
  discountPrice: '',
    stock: '0',
    description: '',
    categoryId: '',
  });
  const [images, setImages] = useState<{ url: string; public_id: string }[] | undefined>(undefined);
  const [video, setVideo] = useState<{ url: string; public_id: string } | null | undefined>(undefined);

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        // Try direct product fetch; if 404, fall back to vendor profile list
        let p: any = null;
        try {
          p = await fetchJSON(`/api/product/${id}`);
        } catch (err: any) {
          if (/(404|not found)/i.test(err?.message || '')) {
            const v = await fetchJSON('/api/vendor/profile');
            p = v?.products?.find((x: any) => x.id === id) || null;
          } else {
            throw err;
          }
        }
        const categories = await fetchJSON('/api/category');
        setProduct(p);
        setCats(categories);
        setForm({
          name: p.name,
          slug: p.slug,
          price: String(typeof p.price === 'number' ? p.price : parseFloat(String(p.price))),
          discountPrice: p.discountPrice ? String(typeof p.discountPrice === 'number' ? p.discountPrice : parseFloat(String(p.discountPrice))) : '',
          stock: String(p.stock),
          description: p.description || '',
          categoryId: p.categoryId || '',
        });
      } catch (e: any) {
        setError(e?.message || 'Failed to load');
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  async function uploadImage(file: File) {
    const fd = new FormData();
    fd.append('file', file);
    const res = await fetch('/api/image-upload', { method: 'POST', body: fd, credentials: 'include' });
    if (!res.ok) throw new Error(await res.text());
    const data = await res.json();
    return { url: data.result.secure_url as string, public_id: data.result.public_id as string };
  }

  async function uploadVideo(file: File) {
    const fd = new FormData();
    fd.append('file', file);
    const res = await fetch('/api/video-upload', { method: 'POST', body: fd, credentials: 'include' });
    if (!res.ok) throw new Error(await res.text());
    const data = await res.json();
    return { url: data.result.secure_url as string, public_id: data.result.public_id as string };
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    try {
  const body: any = {
        id,
        name: form.name,
        slug: form.slug,
        description: form.description || undefined,
        price: Number(form.price),
        stock: Number(form.stock) || 0,
        categoryId: form.categoryId || undefined,
      };
  if (form.discountPrice) body.discountPrice = Number(form.discountPrice); else if (product?.discountPrice && !form.discountPrice) body.discountPrice = null;
      if (images !== undefined) body.images = images; // replace if set
      if (video !== undefined) body.video = video; // replace if set; send null to remove

      await fetchJSON('/api/product', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      router.push('/vendor-center/seller-dash');
    } catch (e: any) {
      alert(e?.message || 'Save failed');
    }
  }

  if (loading) return <div className="p-6">Loading...</div>;
  if (error) return <div className="p-6 text-red-600">{error}</div>;
  if (!product) return <div className="p-6">Not found</div>;

  return (
    <div className="container mx-auto p-6">
      <Card>
        <CardHeader><CardTitle>Edit Product</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              {product?.discountPrice && !form.discountPrice && (
                <div className="text-xs text-amber-600 mt-1">Current discount will be removed on save.</div>
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
              <Label htmlFor="categoryId">Category</Label>
              <select
                id="categoryId"
                className="mt-1 w-full border rounded h-9 px-3 text-sm"
                value={form.categoryId}
                onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
              >
                <option value="">-- None --</option>
                {cats.map((c) => (
                  <option key={c.id} value={c.id}>{c.name} ({c.slug})</option>
                ))}
              </select>
            </div>
            <div className="md:col-span-2">
              <Label>Images (replace all)</Label>
              <Input type="file" accept="image/*" multiple onChange={async (e) => {
                const files = Array.from(e.target.files || []);
                if (!files.length) { setImages([]); return; }
                const uploaded: { url: string; public_id: string }[] = [];
                for (const f of files) uploaded.push(await uploadImage(f));
                setImages(uploaded);
              }} />
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2">
                {(images ?? product.images ?? []).map((img: any, idx: number) => (
                  <img key={idx} src={img.url} className="w-full h-24 object-cover rounded" />
                ))}
              </div>
            </div>
            <div className="md:col-span-2">
              <Label>Video</Label>
              <Input type="file" accept="video/*" onChange={async (e) => {
                const f = (e.target.files || [])[0];
                if (!f) { setVideo(null); return; }
                const v = await uploadVideo(f);
                setVideo(v);
              }} />
              {(video ?? product.video) && (
                <video className="w-full mt-2" controls src={(video ?? product.video)!.url} />
              )}
              <div className="mt-2">
                <Button type="button" variant="outline" onClick={() => setVideo(null)}>Remove video</Button>
              </div>
            </div>
            <div className="md:col-span-2 flex gap-2">
              <Button type="submit">Save</Button>
              <Button type="button" variant="secondary" onClick={() => router.push('/vendor-center/seller-dash')}>Cancel</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
