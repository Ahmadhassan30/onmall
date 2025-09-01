import { z } from 'zod';

export const idParamSchema = z.object({ id: z.string().min(1) });
export const paginationQuerySchema = z.object({
  page: z.string().optional().transform((v) => (v ? parseInt(v, 10) : 1)),
  limit: z.string().optional().transform((v) => Math.min(Math.max(parseInt(v ?? '10', 10), 1), 100)),
});

// Vendor Schemas
export const vendorCreateSchema = z.object({
  shopName: z.string().min(2).max(100),
  description: z.string().max(500).optional().nullable(),
});

export const vendorUpdateSchema = z.object({
  shopName: z.string().min(2).max(100).optional(),
  description: z.string().max(500).optional().nullable(),
  approved: z.boolean().optional(),
});

export const vendorListQuerySchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
  search: z.string().optional(),
}).transform(({ page, limit, search }) => ({
  page: page ? Math.max(parseInt(page, 10) || 1, 1) : 1,
  limit: limit ? Math.min(Math.max(parseInt(limit, 10) || 10, 1), 100) : 10,
  search: search?.trim() || undefined,
}));

// Vendor KYC schemas
export const vendorKycCreateSchema = z.object({
  documentType: z.enum(['CNIC', 'PASSPORT', 'LICENSE']),
  public_id: z.string().min(1),
});

// Product Schemas
export const productCreateSchema = z.object({
  name: z.string().min(2).max(150),
  slug: z.string().min(2).max(180),
  description: z.string().max(2000).optional().nullable(),
  price: z.number().positive(),
  stock: z.number().int().min(0).default(0),
  categoryId: z.string().uuid().optional().nullable(),
  vendorId: z.string().uuid().optional(), // admin-only usage
  // media
  images: z
    .array(
      z.object({
        url: z.string().url(),
        public_id: z.string().min(1),
      })
    )
    .optional(),
  video: z
    .object({
      url: z.string().url(),
      public_id: z.string().min(1),
    })
    .optional()
    .nullable(),
});

export const productUpdateSchema = z.object({
  name: z.string().min(2).max(150).optional(),
  slug: z.string().min(2).max(180).optional(),
  description: z.string().max(2000).optional().nullable(),
  price: z.number().positive().optional(),
  stock: z.number().int().min(0).optional(),
  categoryId: z.string().uuid().optional().nullable(),
  // If provided, replace all images with the given set
  images: z
    .array(
      z.object({
        url: z.string().url(),
        public_id: z.string().min(1),
      })
    )
    .optional(),
  // If provided, set/replace the single product video. Use null to remove video
  video: z
    .union([
      z.object({
        url: z.string().url(),
        public_id: z.string().min(1),
      }),
      z.null(),
    ])
    .optional(),
});

export const productListQuerySchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
  search: z.string().optional(),
  categoryId: z.string().optional(),
  vendorId: z.string().optional(),
  sort: z.enum(['new', 'price_asc', 'price_desc']).optional(),
}).transform(({ page, limit, search, categoryId, vendorId, sort }) => ({
  page: page ? Math.max(parseInt(page, 10) || 1, 1) : 1,
  limit: limit ? Math.min(Math.max(parseInt(limit, 10) || 12, 1), 100) : 12,
  search: search?.trim() || undefined,
  categoryId: categoryId || undefined,
  vendorId: vendorId || undefined,
  sort: sort || 'new',
}));

// Category Schemas
export const categoryCreateSchema = z.object({
  name: z.string().min(2).max(100),
  slug: z.string().min(2).max(140),
  parentId: z.string().uuid().optional().nullable(),
});

export const categoryListQuerySchema = z.object({
  search: z.string().optional(),
  parentId: z.string().optional(),
}).transform(({ search, parentId }) => ({
  search: search?.trim() || undefined,
  parentId: parentId || undefined,
}));