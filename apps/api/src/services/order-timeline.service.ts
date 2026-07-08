import { prisma } from '../lib/prisma';

export interface TimelineEvent {
  orderId: string;
  event: 'order_created' | 'payment_confirmed' | 'preparing' | 'packed' | 'guide_generated' | 'handed_to_carrier' | 'in_transit' | 'out_for_delivery' | 'delivered' | 'cancelled' | 'returned' | 'note_added';
  metadata?: Record<string, unknown>;
}

export const orderTimelineService = {
  async record(event: TimelineEvent) {
    return prisma.orderTimeline.create({
      data: {
        orderId: event.orderId,
        event: event.event,
        metadata: (event.metadata ?? {}) as any,
      },
    });
  },

  async findByOrder(orderId: string) {
    return prisma.orderTimeline.findMany({
      where: { orderId },
      orderBy: { createdAt: 'asc' },
    });
  },

  async findRecentByOrder(orderId: string, limit = 5) {
    return prisma.orderTimeline.findMany({
      where: { orderId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  },
};
