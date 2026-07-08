import type { FastifyInstance } from 'fastify';
import { productService } from '../services/product.service';
import { orderService } from '../services/order.service';
import { orderTimelineService } from '../services/order-timeline.service';
import { preHandler } from '../middleware/auth';
import { prisma } from '../lib/prisma';
import { sendOrderShipped } from '../lib/email';
import { shippingService } from '../services/shipping.service';
import { notificationService } from '../services/notification.service';
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
      search: z.string().optional(),
      carrier: z.string().optional(),
      dateFrom: z.string().optional(),
      dateTo: z.string().optional(),
      sortBy: z.enum(['createdAt', 'total', 'status']).optional().default('createdAt'),
      sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
    }).parse(request.query);

    const where: Record<string, unknown> = {};
    if (query.status) where.status = query.status;
    if (query.carrier) where.carrier = query.carrier;

    if (query.search) {
      where.OR = [
        { id: { contains: query.search } },
        { reference: { contains: query.search } },
        { trackingNumber: { contains: query.search } },
        { user: { email: { contains: query.search } } },
      ];
    }

    if (query.dateFrom || query.dateTo) {
      where.createdAt = {};
      if (query.dateFrom) (where.createdAt as Record<string, unknown>).gte = new Date(query.dateFrom);
      if (query.dateTo) (where.createdAt as Record<string, unknown>).lte = new Date(query.dateTo);
    }

    const page = query.page;
    const limit = query.limit;
    const skip = (page - 1) * limit;

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where: where as any,
        include: {
          items: {
            include: {
              product: { include: { images: { orderBy: { position: 'asc' } } } },
            },
          },
          payments: true,
          user: { select: { id: true, email: true } },
          timeline: { orderBy: { createdAt: 'desc' }, take: 1 },
          trackingToken: { select: { token: true } },
        },
        skip,
        take: limit,
        orderBy: { [query.sortBy!]: query.sortOrder },
      }),
      prisma.order.count({ where: where as any }),
    ]);

    return reply.send({
      success: true,
      data: orders,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  });

  app.get('/orders/:id', async (request, reply) => {
    const { id } = z.object({ id: z.string() }).parse(request.params);

    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            product: { include: { images: { orderBy: { position: 'asc' } } } },
          },
        },
        payments: true,
        user: { select: { id: true, email: true } },
        timeline: { orderBy: { createdAt: 'asc' } },
        notes: {
          orderBy: { createdAt: 'desc' },
          include: { author: { select: { id: true, email: true } } },
        },
        guides: { orderBy: { createdAt: 'desc' } },
        trackingToken: true,
        notificationLogs: { orderBy: { createdAt: 'desc' }, take: 20 },
      },
    });

    if (!order) {
      return reply.status(404).send({ success: false, error: 'Order not found' });
    }

    return reply.send({ success: true, data: order });
  });

  app.put('/orders/:id/status', async (request, reply) => {
    const { id } = z.object({ id: z.string() }).parse(request.params);
    const body = z.object({
      status: z.enum(['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled']),
    }).parse(request.body);

    const user = (request as any).user;
    const order = await orderService.updateStatus(id, body.status, {
      updatedBy: user.email,
    });
    return reply.send({ success: true, data: order });
  });

  app.patch('/orders/:id/ship', async (request, reply) => {
    const { id } = z.object({ id: z.string() }).parse(request.params);
    const body = z.object({
      trackingNumber: z.string().min(1),
      carrier: z.string().min(1),
      estimatedDelivery: z.string().optional(),
      shippingAddress: z.string().optional(),
    }).parse(request.body);

    const order = await orderService.ship(id, {
      trackingNumber: body.trackingNumber,
      carrier: body.carrier,
      estimatedDelivery: body.estimatedDelivery ? new Date(body.estimatedDelivery) : undefined,
      shippingAddress: body.shippingAddress,
    });

    await sendOrderShipped(order.user.email, {
      id: order.id,
      reference: order.reference,
      trackingNumber: order.trackingNumber,
      carrier: order.carrier,
      estimatedDelivery: order.estimatedDelivery,
      items: order.items,
      total: order.total,
    });

    await notificationService.notifyOrderEvent({
      orderId: id,
      event: 'handed_to_carrier',
      recipientEmail: order.user.email,
      recipientPhone: order.phoneNumber || undefined,
    });

    return reply.send({ success: true, data: order });
  });

  app.get('/orders/:id/timeline', async (request, reply) => {
    const { id } = z.object({ id: z.string() }).parse(request.params);
    const timeline = await orderTimelineService.findByOrder(id);
    return reply.send({ success: true, data: timeline });
  });

  app.get('/orders/:id/notes', async (request, reply) => {
    const { id } = z.object({ id: z.string() }).parse(request.params);
    const notes = await prisma.orderNote.findMany({
      where: { orderId: id },
      orderBy: { createdAt: 'desc' },
      include: { author: { select: { id: true, email: true } } },
    });
    return reply.send({ success: true, data: notes });
  });

  app.post('/orders/:id/notes', async (request, reply) => {
    const { id } = z.object({ id: z.string() }).parse(request.params);
    const body = z.object({ content: z.string().min(1) }).parse(request.body);
    const user = (request as any).user;

    const note = await prisma.orderNote.create({
      data: {
        orderId: id,
        content: body.content,
        authorId: user.id,
      },
      include: { author: { select: { id: true, email: true } } },
    });

    await orderTimelineService.record({
      orderId: id,
      event: 'note_added',
      metadata: { noteId: note.id, author: user.email },
    });

    return reply.status(201).send({ success: true, data: note });
  });

  app.delete('/orders/:id/notes/:noteId', async (request, reply) => {
    const { noteId } = z.object({ noteId: z.string() }).parse(request.params);
    await prisma.orderNote.delete({ where: { id: noteId } });
    return reply.send({ success: true, message: 'Note deleted' });
  });

  app.post('/orders/:id/guides', async (request, reply) => {
    const { id } = z.object({ id: z.string() }).parse(request.params);
    const body = z.object({
      provider: z.enum(['interrapidisimo', 'coordinadora', 'servientrega', 'envia', 'manual']),
    }).parse(request.body);

    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        items: { include: { product: true } },
        user: { select: { id: true, email: true } },
      },
    });

    if (!order) {
      return reply.status(404).send({ success: false, error: 'Order not found' });
    }

    if (body.provider === 'manual') {
      return reply.status(400).send({
        success: false,
        error: 'Use PATCH /admin/orders/:id/ship for manual shipping',
      });
    }

    const guide = await shippingService.createShipment(order, body.provider as any);

    await orderTimelineService.record({
      orderId: id,
      event: 'guide_generated',
      metadata: {
        provider: body.provider,
        guideNumber: guide.guideNumber,
        guideId: guide.id,
      },
    });

    return reply.status(201).send({ success: true, data: guide });
  });

  app.get('/orders/:id/guides', async (request, reply) => {
    const { id } = z.object({ id: z.string() }).parse(request.params);
    const guides = await prisma.shippingGuide.findMany({
      where: { orderId: id },
      orderBy: { createdAt: 'desc' },
    });
    return reply.send({ success: true, data: guides });
  });

  app.get('/orders/:id/notification-logs', async (request, reply) => {
    const { id } = z.object({ id: z.string() }).parse(request.params);
    const logs = await prisma.notificationLog.findMany({
      where: { orderId: id },
      orderBy: { createdAt: 'desc' },
    });
    return reply.send({ success: true, data: logs });
  });
}
