"use client";
import { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

async function fetchJSON(url: string, init?: RequestInit) {
  const res = await fetch(url, { ...init, credentials: 'include' });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

type Category = { id: string; name: string; slug: string; parentId?: string | null };

export default function AdminCategoriesPage() {
  const [items, setItems] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', slug: '', parentId: '' });
  const [slugTouched, setSlugTouched] = useState(false);

  function slugify(v: string) {
    return v
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');
  }

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchJSON('/api/category');
      setItems(data);
    } catch (e: any) {
      setError(e?.message || 'Failed to load categories');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    try {
      await fetchJSON('/api/category', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          slug: form.slug,
          parentId: form.parentId || undefined,
        }),
      });
      setForm({ name: '', slug: '', parentId: '' });
      load();
    } catch (e: any) {
      alert(e?.message || 'Create failed');
    }
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Categories</h1>

      <Card>
        <CardHeader><CardTitle>Add Category</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={form.name}
                onChange={(e) => {
                  const name = e.target.value;
                  setForm((f) => ({
                    ...f,
                    name,
                    slug: slugTouched ? f.slug : slugify(name),
                  }));
                }}
                required
              />
            </div>
            <div>
              <Label htmlFor="slug">Slug</Label>
              <Input
                id="slug"
                value={form.slug}
                onChange={(e) => {
                  setSlugTouched(true);
                  setForm({ ...form, slug: slugify(e.target.value) });
                }}
                required
              />
            </div>
            <div>
              <Label htmlFor="parentId">Parent (optional)</Label>
              <select
                id="parentId"
                className="mt-1 w-full border rounded h-9 px-3 text-sm"
                value={form.parentId}
                onChange={(e) => setForm({ ...form, parentId: e.target.value })}
              >
                <option value="">-- None --</option>
                {items.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div className="md:col-span-3">
              <Button type="submit">Create</Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>All Categories</CardTitle></CardHeader>
        <CardContent>
          {loading ? (
            <div>Loading...</div>
          ) : error ? (
            <div className="text-red-600">{error}</div>
          ) : (
            <ul className="list-disc pl-6 space-y-1">
              {items.map((c) => (
                <li key={c.id}>
                  <span className="font-medium">{c.name}</span> <span className="text-sm text-muted-foreground">({c.slug})</span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
