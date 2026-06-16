import type { FastifyInstance } from 'fastify';
import { productService } from '../services/product.service';
import z from 'zod';

export async function productRoutes(app: FastifyInstance) {
  app.get('/', async (request, reply) => {
    const query = z.object({
      page: z.coerce.number().optional().default(1),
      limit: z.coerce.number().optional().default(12),
      category: z.string().optional(),
      search: z.string().optional(),
    }).parse(request.query);

    const result = await productService.findAll(query);
    return reply.send({ success: true, ...result });
  });

  app.get('/featured', async (_request, reply) => {
    const products = await productService.getFeatured();
    return reply.send({ success: true, data: products });
  });

  app.get('/category/:category', async (request, reply) => {
    const { category } = z.object({ category: z.string() }).parse(request.params);
    const products = await productService.findByCategory(category);
    return reply.send({ success: true, data: products });
  });

  app.get('/:id', async (request, reply) => {
    const { id } = z.object({ id: z.string() }).parse(request.params);
    const product = await productService.findById(id);

    if (!product) {
      return reply.status(404).send({ success: false, error: 'Product not found' });
    }

    return reply.send({ success: true, data: product });
  });
}
