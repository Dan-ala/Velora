import type { FastifyInstance } from 'fastify';
import { cartService } from '../services/cart.service';
import { preHandler } from '../middleware/auth';
import z from 'zod';

export async function cartRoutes(app: FastifyInstance) {
  app.get('/', { preHandler: preHandler() }, async (request, reply) => {
    const user = (request as any).user;
    const cart = await cartService.findByUser(user.id);
    return reply.send({ success: true, data: cart });
  });

  app.get('/count', { preHandler: preHandler() }, async (request, reply) => {
    const user = (request as any).user;
    const count = await cartService.getItemCount(user.id);
    return reply.send({ success: true, data: { count } });
  });

  app.post('/', { preHandler: preHandler() }, async (request, reply) => {
    const user = (request as any).user;
    const body = z.object({
      productId: z.string(),
      quantity: z.number().int().positive().optional().default(1),
    }).parse(request.body);

    const item = await cartService.addItem(user.id, body.productId, body.quantity);
    return reply.status(201).send({ success: true, data: item });
  });

  app.put('/:id', { preHandler: preHandler() }, async (request, reply) => {
    const { id } = z.object({ id: z.string() }).parse(request.params);
    const body = z.object({ quantity: z.number().int().positive() }).parse(request.body);

    const item = await cartService.updateItemQuantity(id, body.quantity);
    return reply.send({ success: true, data: item });
  });

  app.delete('/:id', { preHandler: preHandler() }, async (request, reply) => {
    const { id } = z.object({ id: z.string() }).parse(request.params);
    await cartService.removeItem(id);
    return reply.send({ success: true, message: 'Item removed from cart' });
  });

  app.delete('/', { preHandler: preHandler() }, async (request, reply) => {
    const user = (request as any).user;
    await cartService.clearCart(user.id);
    return reply.send({ success: true, message: 'Cart cleared' });
  });

  app.put('/sync', { preHandler: preHandler() }, async (request, reply) => {
    const user = (request as any).user;
    const body = z.object({
      items: z.array(z.object({
        productId: z.string(),
        quantity: z.number().int().positive(),
      })),
    }).parse(request.body);

    await cartService.syncItems(user.id, body.items);
    const cart = await cartService.findByUser(user.id);
    return reply.send({ success: true, data: cart });
  });
}
