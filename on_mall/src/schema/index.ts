import { z } from 'zod';

export const idParamSchema = z.object({ id: z.string().min(1) });
export const paginationQuerySchema = z.object({
  page: z.string().optional().transform((v) => (v ? parseInt(v, 10) : 1)),
  limit: z.string().optional().transform((v) => Math.min(Math.max(parseInt(v ?? '10', 10), 1), 100)),
});