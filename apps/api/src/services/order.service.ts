import { prisma } from '../lib/prisma';
import type { OrderStatus } from '@prisma/client';
import { orderTimelineService } from './order-timeline.service';
import { trackingService } from './tracking.service';

export const orderService = {
  async findByUser(userId: string) {
    return prisma.order.findMany({
      where: { userId },
      include: {
        items: {
          include: {
            product: { include: { images: { orderBy: { position: 'asc' } } } },
          },
        },
        payments: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  },

  async findById(id: string) {
    return prisma.order.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            product: { include: { images: { orderBy: { position: 'asc' } } } },
          },
        },
        payments: true,
        user: { select: { id: true, email: true } },
      },
    });
  },

  async findAll(params: { page?: number; limit?: number; status?: OrderStatus }) {
    const page = params.page || 1;
    const limit = params.limit || 20;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (params.status) where.status = params.status;

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: {
          items: {
            include: {
              product: { include: { images: { orderBy: { position: 'asc' } } } },
            },
          },
          payments: true,
          user: { select: { id: true, email: true } },
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.order.count({ where }),
    ]);

    return { data: orders, total, page, limit, totalPages: Math.ceil(total / limit) };
  },

  async create(userId: string) {
    const cart = await prisma.cartItem.findMany({
      where: { userId },
      include: { product: true },
    });

    if (cart.length === 0) {
      throw new Error('Cart is empty');
    }

    const total = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

    const order = await prisma.order.create({
      data: {
        userId,
        total,
        items: {
          create: cart.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            price: item.product.price,
          })),
        },
      },
      include: {
        items: {
          include: {
            product: { include: { images: { orderBy: { position: 'asc' } } } },
          },
        },
        payments: true,
      },
    });

    for (const item of cart) {
      const product = item.product;
      const oldStock = product.stock;
      const newStock = oldStock - item.quantity;

      await prisma.product.update({
        where: { id: item.productId },
        data: { stock: newStock },
      });

      await prisma.inventoryEvent.create({
        data: {
          productId: item.productId,
          oldStock,
          newStock,
        },
      });
    }

    await prisma.cartItem.deleteMany({ where: { userId } });

    await orderTimelineService.record({
      orderId: order.id,
      event: 'order_created',
      metadata: { total, itemsCount: cart.length },
    });

    try {
      await trackingService.generateToken(order.id);
    } catch {
      // non-critical
    }

    return order;
  },

  async updateStatus(id: string, status: OrderStatus, metadata?: Record<string, unknown>) {
    const eventMap: Record<string, 'preparing' | 'delivered' | 'cancelled' | 'in_transit' | undefined> = {
      processing: 'preparing',
      delivered: 'delivered',
      cancelled: 'cancelled',
      shipped: 'in_transit',
    };

    const event = eventMap[status];

    const order = await prisma.order.update({
      where: { id },
      data: { status },
      include: {
        items: {
          include: {
            product: { include: { images: { orderBy: { position: 'asc' } } } },
          },
        },
        payments: true,
      },
    });

    if (event) {
      await orderTimelineService.record({
        orderId: id,
        event,
        metadata: { ...metadata, previousStatus: status },
      });
    }

    return order;
  },

  async ship(id: string, data: {
    trackingNumber: string;
    carrier: string;
    estimatedDelivery?: Date;
    shippingAddress?: string;
  }) {
    const order = await prisma.order.update({
      where: { id },
      data: {
        status: 'shipped',
        shippingStatus: 'shipped',
        trackingNumber: data.trackingNumber,
        carrier: data.carrier,
        estimatedDelivery: data.estimatedDelivery ?? null,
        shippingAddress: data.shippingAddress ?? null,
      },
      include: {
        items: {
          include: {
            product: { include: { images: { orderBy: { position: 'asc' } } } },
          },
        },
        payments: true,
        user: { select: { id: true, email: true } },
      },
    });

    await orderTimelineService.record({
      orderId: id,
      event: 'guide_generated',
      metadata: { carrier: data.carrier, trackingNumber: data.trackingNumber },
    });

    await orderTimelineService.record({
      orderId: id,
      event: 'handed_to_carrier',
      metadata: { carrier: data.carrier, trackingNumber: data.trackingNumber },
    });

    await orderTimelineService.record({
      orderId: id,
      event: 'in_transit',
      metadata: { carrier: data.carrier, estimatedDelivery: data.estimatedDelivery?.toISOString() },
    });

    return order;
  },
};
