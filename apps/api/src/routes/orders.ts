import type { FastifyInstance } from 'fastify';
import { orderService } from '../services/order.service';
import { preHandler } from '../middleware/auth';
import z from 'zod';

export async function orderRoutes(app: FastifyInstance) {
  app.get('/', { preHandler: preHandler() }, async (request, reply) => {
    const user = (request as any).user;
    const orders = await orderService.findByUser(user.id);
    return reply.send({ success: true, data: orders });
  });

  app.get('/:id', { preHandler: preHandler() }, async (request, reply) => {
    const { id } = z.object({ id: z.string() }).parse(request.params);
    const order = await orderService.findById(id);

    if (!order) {
      return reply.status(404).send({ success: false, error: 'Order not found' });
    }

    return reply.send({ success: true, data: order });
  });

  app.post('/', { preHandler: preHandler() }, async (request, reply) => {
    const user = (request as any).user;

    try {
      const order = await orderService.create(user.id);
      return reply.status(201).send({ success: true, data: order });
    } catch (error: any) {
      return reply.status(400).send({ success: false, error: error.message });
    }
  });
}
