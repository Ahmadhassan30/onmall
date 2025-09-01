import { hc } from 'hono/client';
import { AppType } from '@/app/api/[[...route]]/route';

// Use same-origin base to avoid port/env mismatches during dev
const apiBase = '/api';

// Hono client pointing to our Next.js /api routes
// Cast to a shape exposing top-level routers for ease of use in hooks
export const client = hc<AppType>(apiBase) as unknown as {
	vendor: any;
	product: any;
	sample: any;
};
