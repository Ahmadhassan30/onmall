import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import { z } from 'zod';

const app = new Hono()
  .get(
    '/',
    zValidator('query', z.object({ errorMessage: z.string().optional() })),
    (c) => {
      const { errorMessage } = c.req.valid('query');

      if (errorMessage) {
        return c.json({ message: errorMessage, method: 'GET' }, 400);
      }

      return c.json({ message: 'Sample GET Route!' });
    }
  )
  .post(
    '/',
    zValidator('query', z.object({ errorMessage: z.string().optional() })),
    (c) => {
      const { errorMessage } = c.req.valid('query');

      if (errorMessage) {
        return c.json({ message: errorMessage, method: 'POST' }, 400);
      }

      return c.json({ message: 'Sample POST Route!' });
    }
  )
  .patch(
    '/',
    zValidator('query', z.object({ errorMessage: z.string().optional() })),
    (c) => {
      const { errorMessage } = c.req.valid('query');

      if (errorMessage) {
        return c.json({ message: errorMessage, method: 'PATCH' }, 400);
      }

      return c.json({ message: 'Sample PATCH Route!' });
    }
  )
  .delete(
    '/',
    zValidator('query', z.object({ errorMessage: z.string().optional() })),
    (c) => {
      const { errorMessage } = c.req.valid('query');

      if (errorMessage) {
        return c.json({ message: errorMessage, method: 'DELETE' }, 400);
      }

      return c.json({ message: 'Sample DELETE Route!' });
    }
  );

export default app;
