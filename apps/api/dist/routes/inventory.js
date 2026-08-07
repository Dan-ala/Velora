"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.inventoryRoutes = inventoryRoutes;
const prisma_1 = require("../lib/prisma");
const auth_1 = require("../middleware/auth");
const zod_1 = __importDefault(require("zod"));
async function inventoryRoutes(app) {
    app.get('/events', { preHandler: (0, auth_1.preHandler)('admin') }, async (request, reply) => {
        const query = zod_1.default.object({
            productId: zod_1.default.string().optional(),
            page: zod_1.default.coerce.number().optional().default(1),
            limit: zod_1.default.coerce.number().optional().default(50),
        }).parse(request.query);
        const where = {};
        if (query.productId)
            where.productId = query.productId;
        const skip = (query.page - 1) * query.limit;
        const [events, total] = await Promise.all([
            prisma_1.prisma.inventoryEvent.findMany({
                where,
                include: { product: { select: { name: true } } },
                orderBy: { createdAt: 'desc' },
                skip,
                take: query.limit,
            }),
            prisma_1.prisma.inventoryEvent.count({ where }),
        ]);
        return reply.send({
            success: true,
            data: events,
            total,
            page: query.page,
            limit: query.limit,
            totalPages: Math.ceil(total / query.limit),
        });
    });
    app.get('/stock/:productId', async (request, reply) => {
        const { productId } = zod_1.default.object({ productId: zod_1.default.string() }).parse(request.params);
        const product = await prisma_1.prisma.product.findUnique({
            where: { id: productId },
            select: { id: true, name: true, stock: true },
        });
        if (!product) {
            return reply.status(404).send({ success: false, error: 'Product not found' });
        }
        return reply.send({ success: true, data: product });
    });
}
//# sourceMappingURL=inventory.js.map