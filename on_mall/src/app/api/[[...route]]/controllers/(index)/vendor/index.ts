import { Hono } from 'hono';
import { prisma } from '@/lib/prisma';

const vendor = new Hono();

// Get vendor profile for authenticated user
vendor.get('/profile', async (c) => {
  try {
    const sessionCookie = c.req.header('cookie');
    if (!sessionCookie) return c.json({ error: 'Unauthorized' }, 401);

    const sessionResponse = await fetch(`${process.env.BETTER_AUTH_URL}/api/auth/get-session`, {
      headers: { cookie: sessionCookie },
    });
    if (!sessionResponse.ok) return c.json({ error: 'Invalid session' }, 401);

    const sessionData = await sessionResponse.json();
    const userId = sessionData?.user?.id as string | undefined;
    if (!userId) return c.json({ error: 'Unauthorized' }, 401);

    const vendor = await prisma.vendor.findUnique({ where: { userId } });
    if (!vendor) return c.json({ error: 'Not a vendor' }, 404);

    return c.json(vendor);
  } catch (e) {
    console.error('vendor/profile error', e);
    return c.json({ error: 'Internal error' }, 500);
  }
});

export default vendor;
