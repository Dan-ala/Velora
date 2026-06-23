import type { FastifyInstance } from 'fastify';
import { productService } from '../services/product.service';
import { orderService } from '../services/order.service';
import { preHandler } from '../middleware/auth';
import z from 'zod';

export async function adminRoutes(app: FastifyInstance) {
  app.addHook('preHandler', preHandler('admin'));

  app.get('/products', async (request, reply) => {
    const query = z.object({
      page: z.coerce.number().optional().default(1),
      limit: z.coerce.number().optional().default(50),
      search: z.string().optional(),
      category: z.string().optional(),
    }).parse(request.query);

    const result = await productService.findAll(query);
    return reply.send({ success: true, ...result });
  });

  app.post('/products', async (request, reply) => {
    const body = z.object({
      name: z.string().min(1),
      description: z.string().min(1),
      price: z.number().int().positive(),
      category: z.string().min(1),
      stock: z.number().int().min(0).default(0),
    }).parse(request.body);

    try {
      const product = await productService.create(body);
      return reply.status(201).send({ success: true, data: product });
    } catch (err: any) {
      if (err.message?.startsWith('A product with the name')) {
        return reply.status(409).send({ success: false, error: err.message });
      }
      throw err;
    }
  });

  app.put('/products/:id', async (request, reply) => {
    const { id } = z.object({ id: z.string() }).parse(request.params);
    const body = z.object({
      name: z.string().optional(),
      description: z.string().optional(),
      price: z.number().int().positive().optional(),
      category: z.string().optional(),
      stock: z.number().int().min(0).optional(),
    }).parse(request.body);

    try {
      const product = await productService.update(id, body);
      return reply.send({ success: true, data: product });
    } catch (err: any) {
      if (err.message?.startsWith('A product with the name')) {
        return reply.status(409).send({ success: false, error: err.message });
      }
      throw err;
    }
  });

  app.delete('/products/:id', async (request, reply) => {
    const { id } = z.object({ id: z.string() }).parse(request.params);
    await productService.delete(id);
    return reply.send({ success: true, message: 'Product deleted' });
  });

  app.post('/products/:id/images', async (request, reply) => {
    const { id } = z.object({ id: z.string() }).parse(request.params);
    const body = z.object({
      url: z.string().url(),
      publicId: z.string(),
      position: z.number().int().optional(),
    }).parse(request.body);

    const image = await productService.addImage(id, body.url, body.publicId, body.position);
    return reply.status(201).send({ success: true, data: image });
  });

  app.delete('/products/images/:imageId', async (request, reply) => {
    const { imageId } = z.object({ imageId: z.string() }).parse(request.params);
    await productService.removeImage(imageId);
    return reply.send({ success: true, message: 'Image removed' });
  });

  app.get('/orders', async (request, reply) => {
    const query = z.object({
      page: z.coerce.number().optional().default(1),
      limit: z.coerce.number().optional().default(20),
      status: z.string().optional(),
    }).parse(request.query);

    const result = await orderService.findAll(query as any);
    return reply.send({ success: true, ...result });
  });

  app.put('/orders/:id/status', async (request, reply) => {
    const { id } = z.object({ id: z.string() }).parse(request.params);
    const body = z.object({
      status: z.enum(['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled']),
    }).parse(request.body);

    const order = await orderService.updateStatus(id, body.status);
    return reply.send({ success: true, data: order });
  });
}
