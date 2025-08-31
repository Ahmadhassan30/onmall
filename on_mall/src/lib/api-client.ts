import { hc } from 'hono/client';
import type { AppType } from '@/app/api/[[...route]]/route';

export const api = hc<AppType>(process.env.NEXT_PUBLIC_API_URL!);
