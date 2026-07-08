import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import { getEnv } from './env';
import { productRoutes } from './routes/products';
import { authRoutes } from './routes/auth';
import { cartRoutes } from './routes/cart';
import { orderRoutes } from './routes/orders';
import { paymentRoutes } from './routes/payments';
import { adminRoutes } from './routes/admin';
import { inventoryRoutes } from './routes/inventory';
import { cloudinaryRoutes } from './routes/cloudinary';
import { wompiRoutes } from './routes/wompi';
import { trackingRoutes } from './routes/tracking';

async function bootstrap() {
  const env = getEnv();

  const app = Fastify({
    logger: true,
  });

  await app.register(helmet, { contentSecurityPolicy: false });
  await app.register(cors, {
    origin: (origin, cb) => {
      if (!origin || env.NODE_ENV === 'development') {
        cb(null, true);
        return;
      }
      const allowed = env.FRONTEND_URL.split(',').map((s) => s.trim());
      cb(null, allowed.includes(origin));
    },
    credentials: true,
  });
  await app.register(rateLimit, {
    max: 100,
    timeWindow: '1 minute',
  });

  app.get('/health', async () => ({ success: true, message: 'VELORA API is running' }));

  await app.register(authRoutes, { prefix: '/api/auth' });
  await app.register(productRoutes, { prefix: '/api/products' });
  await app.register(cartRoutes, { prefix: '/api/cart' });
  await app.register(orderRoutes, { prefix: '/api/orders' });
  await app.register(paymentRoutes, { prefix: '/api/payments' });
  await app.register(adminRoutes, { prefix: '/api/admin' });
  await app.register(inventoryRoutes, { prefix: '/api/inventory' });
  await app.register(cloudinaryRoutes, { prefix: '/api/cloudinary' });
  await app.register(wompiRoutes, { prefix: '/api/wompi' });
  await app.register(trackingRoutes, { prefix: '/api/tracking' });

  try {
    await app.listen({ port: env.PORT, host: '0.0.0.0' });
    console.log(`VELORA API running on port ${env.PORT}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

bootstrap();
