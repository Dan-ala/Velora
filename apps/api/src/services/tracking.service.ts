import crypto from 'crypto';
import { prisma } from '../lib/prisma';

export const trackingService = {
  async generateToken(orderId: string): Promise<string> {
    const existing = await prisma.trackingToken.findUnique({
      where: { orderId },
    });

    if (existing) return existing.token;

    const raw = crypto.randomBytes(24).toString('hex');
    const token = crypto.createHash('sha256').update(raw).digest('hex').slice(0, 32);

    await prisma.trackingToken.create({
      data: { orderId, token },
    });

    return token;
  },

  async getOrderByToken(token: string) {
    const trackingToken = await prisma.trackingToken.findUnique({
      where: { token },
      include: {
        order: {
          include: {
            items: {
              include: {
                product: { include: { images: { orderBy: { position: 'asc' } } } },
              },
            },
            payments: true,
            timeline: { orderBy: { createdAt: 'asc' } },
            guides: { orderBy: { createdAt: 'desc' } },
          },
        },
      },
    });

    if (!trackingToken) return null;

    return trackingToken.order;
  },

  async getTrackingUrl(orderId: string): Promise<string | null> {
    const token = await this.generateToken(orderId);
    const env = (await import('../env')).getEnv();
    const baseUrl = env.FRONTEND_URL.split(',')[0];
    return `${baseUrl}/tracking/${token}`;
  },
};
