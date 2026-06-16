import type { FastifyInstance } from 'fastify';
import { prisma } from '../lib/prisma';
import { preHandler } from '../middleware/auth';
import z from 'zod';

export async function inventoryRoutes(app: FastifyInstance) {
  app.get('/events', { preHandler: preHandler('admin') }, async (request, reply) => {
    const query = z.object({
      productId: z.string().optional(),
      page: z.coerce.number().optional().default(1),
      limit: z.coerce.number().optional().default(50),
    }).parse(request.query);

    const where: Record<string, unknown> = {};
    if (query.productId) where.productId = query.productId;

    const skip = (query.page - 1) * query.limit;

    const [events, total] = await Promise.all([
      prisma.inventoryEvent.findMany({
        where,
        include: { product: { select: { name: true } } },
        orderBy: { createdAt: 'desc' },
        skip,
        take: query.limit,
      }),
      prisma.inventoryEvent.count({ where }),
    ]);

    return reply.send({
      success: true,
      data: events,
      total,
      page: query.page,
      limit: query.limit,
      totalPages: Math.ceil(total / query.limit),
    });
  });

  app.get('/stock/:productId', async (request, reply) => {
    const { productId } = z.object({ productId: z.string() }).parse(request.params);

    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: { id: true, name: true, stock: true },
    });

    if (!product) {
      return reply.status(404).send({ success: false, error: 'Product not found' });
    }

    return reply.send({ success: true, data: product });
  });
}
