import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { handle } from 'hono/vercel';
import { sample } from './controllers/(index)';
import { kyc } from './controllers/(index)';
import { vendor } from './controllers/(index)';

// This file is already mounted at /api by Next.js. Do not set basePath('/api') here.
const app = new Hono();

app.onError((err, c) => {
  console.error(err);
  if (err instanceof HTTPException) return err.getResponse();
  return c.json({ message: 'Internal Error' }, 500);
});

const routes = app
  .route('/sample', sample)
  .route('/kyc', kyc)
  .route('/vendor', vendor);

export const GET = handle(app);
export const POST = handle(app);
export const PUT = handle(app);
export const PATCH = handle(app);
export const DELETE = handle(app);

export type AppType = typeof routes;