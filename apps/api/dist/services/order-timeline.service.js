"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.orderTimelineService = void 0;
const prisma_1 = require("../lib/prisma");
exports.orderTimelineService = {
    async record(event) {
        return prisma_1.prisma.orderTimeline.create({
            data: {
                orderId: event.orderId,
                event: event.event,
                metadata: (event.metadata ?? {}),
            },
        });
    },
    async findByOrder(orderId) {
        return prisma_1.prisma.orderTimeline.findMany({
            where: { orderId },
            orderBy: { createdAt: 'asc' },
        });
    },
    async findRecentByOrder(orderId, limit = 5) {
        return prisma_1.prisma.orderTimeline.findMany({
            where: { orderId },
            orderBy: { createdAt: 'desc' },
            take: limit,
        });
    },
};
//# sourceMappingURL=order-timeline.service.js.map