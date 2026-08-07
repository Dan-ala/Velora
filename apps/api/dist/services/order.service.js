"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.orderService = void 0;
const prisma_1 = require("../lib/prisma");
const order_timeline_service_1 = require("./order-timeline.service");
const tracking_service_1 = require("./tracking.service");
const notification_service_1 = require("./notification.service");
exports.orderService = {
    async findByUser(userId) {
        return prisma_1.prisma.order.findMany({
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
    async findById(id) {
        return prisma_1.prisma.order.findUnique({
            where: { id },
            include: {
                items: {
                    include: {
                        product: { include: { images: { orderBy: { position: 'asc' } } } },
                    },
                },
                payments: true,
                user: { select: { id: true, email: true } },
                trackingToken: true,
            },
        });
    },
    async findAll(params) {
        const page = params.page || 1;
        const limit = params.limit || 20;
        const skip = (page - 1) * limit;
        const where = {};
        if (params.status)
            where.status = params.status;
        const [orders, total] = await Promise.all([
            prisma_1.prisma.order.findMany({
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
            prisma_1.prisma.order.count({ where }),
        ]);
        return { data: orders, total, page, limit, totalPages: Math.ceil(total / limit) };
    },
    async create(userId) {
        const cart = await prisma_1.prisma.cartItem.findMany({
            where: { userId },
            include: { product: true },
        });
        if (cart.length === 0) {
            throw new Error('Cart is empty');
        }
        const total = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
        const order = await prisma_1.prisma.order.create({
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
            await prisma_1.prisma.product.update({
                where: { id: item.productId },
                data: { stock: newStock },
            });
            await prisma_1.prisma.inventoryEvent.create({
                data: {
                    productId: item.productId,
                    oldStock,
                    newStock,
                },
            });
        }
        await prisma_1.prisma.cartItem.deleteMany({ where: { userId } });
        await order_timeline_service_1.orderTimelineService.record({
            orderId: order.id,
            event: 'order_created',
            metadata: { total, itemsCount: cart.length },
        });
        try {
            await tracking_service_1.trackingService.generateToken(order.id);
        }
        catch {
            // non-critical
        }
        return order;
    },
    async updateStatus(id, status, metadata) {
        const eventMap = {
            processing: 'preparing',
            delivered: 'delivered',
            cancelled: 'cancelled',
            shipped: 'in_transit',
        };
        const event = eventMap[status];
        const order = await prisma_1.prisma.order.update({
            where: { id },
            data: { status },
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
        if (event) {
            await order_timeline_service_1.orderTimelineService.record({
                orderId: id,
                event,
                metadata: { ...metadata, previousStatus: status },
            });
        }
        if (status === 'shipped' || status === 'delivered' || status === 'cancelled') {
            const notificationEvent = status === 'shipped' ? 'in_transit' : status === 'delivered' ? 'delivered' : 'cancelled';
            notification_service_1.notificationService.notifyOrderEvent({
                orderId: id,
                event: notificationEvent,
                recipientEmail: order.user.email,
                recipientPhone: order.phoneNumber || undefined,
            }).catch(() => { });
        }
        return order;
    },
    async ship(id, data) {
        const order = await prisma_1.prisma.order.update({
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
        await order_timeline_service_1.orderTimelineService.record({
            orderId: id,
            event: 'guide_generated',
            metadata: { carrier: data.carrier, trackingNumber: data.trackingNumber },
        });
        await order_timeline_service_1.orderTimelineService.record({
            orderId: id,
            event: 'handed_to_carrier',
            metadata: { carrier: data.carrier, trackingNumber: data.trackingNumber },
        });
        await order_timeline_service_1.orderTimelineService.record({
            orderId: id,
            event: 'in_transit',
            metadata: { carrier: data.carrier, estimatedDelivery: data.estimatedDelivery?.toISOString() },
        });
        return order;
    },
};
//# sourceMappingURL=order.service.js.map