"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cartService = void 0;
const prisma_1 = require("../lib/prisma");
exports.cartService = {
    async findByUser(userId) {
        const items = await prisma_1.prisma.cartItem.findMany({
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
    async addItem(userId, productId, quantity = 1) {
        const existing = await prisma_1.prisma.cartItem.findUnique({
            where: { userId_productId: { userId, productId } },
        });
        if (existing) {
            return prisma_1.prisma.cartItem.update({
                where: { id: existing.id },
                data: { quantity: existing.quantity + quantity },
                include: {
                    product: { include: { images: { orderBy: { position: 'asc' } } } },
                },
            });
        }
        return prisma_1.prisma.cartItem.create({
            data: { userId, productId, quantity },
            include: {
                product: { include: { images: { orderBy: { position: 'asc' } } } },
            },
        });
    },
    async updateItemQuantity(id, quantity) {
        if (quantity <= 0) {
            return prisma_1.prisma.cartItem.delete({ where: { id } });
        }
        return prisma_1.prisma.cartItem.update({
            where: { id },
            data: { quantity },
            include: {
                product: { include: { images: { orderBy: { position: 'asc' } } } },
            },
        });
    },
    async removeItem(id) {
        return prisma_1.prisma.cartItem.delete({ where: { id } });
    },
    async clearCart(userId) {
        return prisma_1.prisma.cartItem.deleteMany({ where: { userId } });
    },
    async syncItems(userId, items) {
        await prisma_1.prisma.cartItem.deleteMany({ where: { userId } });
        if (items.length === 0)
            return [];
        return prisma_1.prisma.cartItem.createManyAndReturn({
            data: items.map((item) => ({ userId, ...item })),
            skipDuplicates: true,
        });
    },
    async getItemCount(userId) {
        const result = await prisma_1.prisma.cartItem.aggregate({
            where: { userId },
            _sum: { quantity: true },
        });
        return result._sum.quantity ?? 0;
    },
};
//# sourceMappingURL=cart.service.js.map