import { prisma } from '../lib/prisma';

export const cartService = {
  async findByUser(userId: string) {
    const items = await prisma.cartItem.findMany({
      where: { userId },
      include: {
        product: {
          include: { images: { orderBy: { position: 'asc' } } },
        },
      },
    });

    const total = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

    return { id: `cart_${userId}`, userId, items, total };
  },

  async addItem(userId: string, productId: string, quantity: number = 1) {
    const existing = await prisma.cartItem.findUnique({
      where: { userId_productId: { userId, productId } },
    });

    if (existing) {
      return prisma.cartItem.update({
        where: { id: existing.id },
        data: { quantity: existing.quantity + quantity },
        include: {
          product: { include: { images: { orderBy: { position: 'asc' } } } },
        },
      });
    }

    return prisma.cartItem.create({
      data: { userId, productId, quantity },
      include: {
        product: { include: { images: { orderBy: { position: 'asc' } } } },
      },
    });
  },

  async updateItemQuantity(id: string, quantity: number) {
    if (quantity <= 0) {
      return prisma.cartItem.delete({ where: { id } });
    }
    return prisma.cartItem.update({
      where: { id },
      data: { quantity },
      include: {
        product: { include: { images: { orderBy: { position: 'asc' } } } },
      },
    });
  },

  async removeItem(id: string) {
    return prisma.cartItem.delete({ where: { id } });
  },

  async clearCart(userId: string) {
    return prisma.cartItem.deleteMany({ where: { userId } });
  },

  async syncItems(userId: string, items: { productId: string; quantity: number }[]) {
    await prisma.cartItem.deleteMany({ where: { userId } });
    if (items.length === 0) return [];
    return prisma.cartItem.createManyAndReturn({
      data: items.map((item) => ({ userId, ...item })),
      skipDuplicates: true,
    });
  },

  async getItemCount(userId: string) {
    const result = await prisma.cartItem.aggregate({
      where: { userId },
      _sum: { quantity: true },
    });
    return result._sum.quantity ?? 0;
  },
};
