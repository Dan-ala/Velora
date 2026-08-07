"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminRoutes = adminRoutes;
const product_service_1 = require("../services/product.service");
const order_service_1 = require("../services/order.service");
const order_timeline_service_1 = require("../services/order-timeline.service");
const auth_1 = require("../middleware/auth");
const prisma_1 = require("../lib/prisma");
const shipping_service_1 = require("../services/shipping.service");
const notification_service_1 = require("../services/notification.service");
const zod_1 = __importDefault(require("zod"));
async function adminRoutes(app) {
    app.addHook('preHandler', (0, auth_1.preHandler)('admin'));
    app.get('/products', async (request, reply) => {
        const query = zod_1.default.object({
            page: zod_1.default.coerce.number().optional().default(1),
            limit: zod_1.default.coerce.number().optional().default(50),
            search: zod_1.default.string().optional(),
            category: zod_1.default.string().optional(),
        }).parse(request.query);
        const result = await product_service_1.productService.findAll(query);
        return reply.send({ success: true, ...result });
    });
    app.post('/products', async (request, reply) => {
        const body = zod_1.default.object({
            name: zod_1.default.string().min(1),
            description: zod_1.default.string().min(1),
            price: zod_1.default.number().int().positive(),
            category: zod_1.default.string().min(1),
            stock: zod_1.default.number().int().min(0).default(0),
        }).parse(request.body);
        try {
            const product = await product_service_1.productService.create(body);
            return reply.status(201).send({ success: true, data: product });
        }
        catch (err) {
            if (err.message?.startsWith('A product with the name')) {
                return reply.status(409).send({ success: false, error: err.message });
            }
            throw err;
        }
    });
    app.put('/products/:id', async (request, reply) => {
        const { id } = zod_1.default.object({ id: zod_1.default.string() }).parse(request.params);
        const body = zod_1.default.object({
            name: zod_1.default.string().optional(),
            description: zod_1.default.string().optional(),
            price: zod_1.default.number().int().positive().optional(),
            category: zod_1.default.string().optional(),
            stock: zod_1.default.number().int().min(0).optional(),
        }).parse(request.body);
        try {
            const product = await product_service_1.productService.update(id, body);
            return reply.send({ success: true, data: product });
        }
        catch (err) {
            if (err.message?.startsWith('A product with the name')) {
                return reply.status(409).send({ success: false, error: err.message });
            }
            throw err;
        }
    });
    app.delete('/products/:id', async (request, reply) => {
        const { id } = zod_1.default.object({ id: zod_1.default.string() }).parse(request.params);
        await product_service_1.productService.delete(id);
        return reply.send({ success: true, message: 'Product deleted' });
    });
    app.post('/products/:id/images', async (request, reply) => {
        const { id } = zod_1.default.object({ id: zod_1.default.string() }).parse(request.params);
        const body = zod_1.default.object({
            url: zod_1.default.string().url(),
            publicId: zod_1.default.string(),
            position: zod_1.default.number().int().optional(),
        }).parse(request.body);
        const image = await product_service_1.productService.addImage(id, body.url, body.publicId, body.position);
        return reply.status(201).send({ success: true, data: image });
    });
    app.delete('/products/images/:imageId', async (request, reply) => {
        const { imageId } = zod_1.default.object({ imageId: zod_1.default.string() }).parse(request.params);
        await product_service_1.productService.removeImage(imageId);
        return reply.send({ success: true, message: 'Image removed' });
    });
    app.get('/orders', async (request, reply) => {
        const query = zod_1.default.object({
            page: zod_1.default.coerce.number().optional().default(1),
            limit: zod_1.default.coerce.number().optional().default(20),
            status: zod_1.default.string().optional(),
            search: zod_1.default.string().optional(),
            carrier: zod_1.default.string().optional(),
            dateFrom: zod_1.default.string().optional(),
            dateTo: zod_1.default.string().optional(),
            sortBy: zod_1.default.enum(['createdAt', 'total', 'status']).optional().default('createdAt'),
            sortOrder: zod_1.default.enum(['asc', 'desc']).optional().default('desc'),
        }).parse(request.query);
        const where = {};
        if (query.status)
            where.status = query.status;
        if (query.carrier)
            where.carrier = query.carrier;
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
            if (query.dateFrom)
                where.createdAt.gte = new Date(query.dateFrom);
            if (query.dateTo)
                where.createdAt.lte = new Date(query.dateTo);
        }
        const page = query.page;
        const limit = query.limit;
        const skip = (page - 1) * limit;
        const [orders, total] = await Promise.all([
            prisma_1.prisma.order.findMany({
                where: where,
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
                orderBy: { [query.sortBy]: query.sortOrder },
            }),
            prisma_1.prisma.order.count({ where: where }),
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
        const { id } = zod_1.default.object({ id: zod_1.default.string() }).parse(request.params);
        const order = await prisma_1.prisma.order.findUnique({
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
        const { id } = zod_1.default.object({ id: zod_1.default.string() }).parse(request.params);
        const body = zod_1.default.object({
            status: zod_1.default.enum(['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled']),
        }).parse(request.body);
        const user = request.user;
        const order = await order_service_1.orderService.updateStatus(id, body.status, {
            updatedBy: user.email,
        });
        return reply.send({ success: true, data: order });
    });
    app.patch('/orders/:id/ship', async (request, reply) => {
        const { id } = zod_1.default.object({ id: zod_1.default.string() }).parse(request.params);
        const body = zod_1.default.object({
            trackingNumber: zod_1.default.string().min(1),
            carrier: zod_1.default.string().min(1),
            estimatedDelivery: zod_1.default.string().optional(),
            shippingAddress: zod_1.default.string().optional(),
        }).parse(request.body);
        const order = await order_service_1.orderService.ship(id, {
            trackingNumber: body.trackingNumber,
            carrier: body.carrier,
            estimatedDelivery: body.estimatedDelivery ? new Date(body.estimatedDelivery) : undefined,
            shippingAddress: body.shippingAddress,
        });
        // notifyOrderEvent handles both email and WhatsApp internally
        await notification_service_1.notificationService.notifyOrderEvent({
            orderId: id,
            event: 'handed_to_carrier',
            recipientEmail: order.user.email,
            recipientPhone: order.phoneNumber || undefined,
        });
        return reply.send({ success: true, data: order });
    });
    app.get('/orders/:id/timeline', async (request, reply) => {
        const { id } = zod_1.default.object({ id: zod_1.default.string() }).parse(request.params);
        const timeline = await order_timeline_service_1.orderTimelineService.findByOrder(id);
        return reply.send({ success: true, data: timeline });
    });
    app.get('/orders/:id/notes', async (request, reply) => {
        const { id } = zod_1.default.object({ id: zod_1.default.string() }).parse(request.params);
        const notes = await prisma_1.prisma.orderNote.findMany({
            where: { orderId: id },
            orderBy: { createdAt: 'desc' },
            include: { author: { select: { id: true, email: true } } },
        });
        return reply.send({ success: true, data: notes });
    });
    app.post('/orders/:id/notes', async (request, reply) => {
        const { id } = zod_1.default.object({ id: zod_1.default.string() }).parse(request.params);
        const body = zod_1.default.object({ content: zod_1.default.string().min(1) }).parse(request.body);
        const user = request.user;
        const note = await prisma_1.prisma.orderNote.create({
            data: {
                orderId: id,
                content: body.content,
                authorId: user.id,
            },
            include: { author: { select: { id: true, email: true } } },
        });
        await order_timeline_service_1.orderTimelineService.record({
            orderId: id,
            event: 'note_added',
            metadata: { noteId: note.id, author: user.email },
        });
        return reply.status(201).send({ success: true, data: note });
    });
    app.delete('/orders/:id/notes/:noteId', async (request, reply) => {
        const { noteId } = zod_1.default.object({ noteId: zod_1.default.string() }).parse(request.params);
        await prisma_1.prisma.orderNote.delete({ where: { id: noteId } });
        return reply.send({ success: true, message: 'Note deleted' });
    });
    app.post('/orders/:id/guides', async (request, reply) => {
        const { id } = zod_1.default.object({ id: zod_1.default.string() }).parse(request.params);
        const body = zod_1.default.object({
            provider: zod_1.default.enum(['interrapidisimo', 'coordinadora', 'servientrega', 'envia', 'manual']),
        }).parse(request.body);
        const order = await prisma_1.prisma.order.findUnique({
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
        const guide = await shipping_service_1.shippingService.createShipment(order, body.provider);
        await order_timeline_service_1.orderTimelineService.record({
            orderId: id,
            event: 'guide_generated',
            metadata: {
                provider: body.provider,
                guideNumber: guide.guideNumber,
                guideId: guide.id,
            },
        });
        // Auto-ship: update status to shipped + notify user
        const updated = await prisma_1.prisma.order.update({
            where: { id },
            data: { status: 'shipped', shippingStatus: 'shipped' },
            include: { user: { select: { id: true, email: true } } },
        });
        await order_timeline_service_1.orderTimelineService.record({
            orderId: id,
            event: 'handed_to_carrier',
            metadata: { provider: body.provider, guideNumber: guide.guideNumber },
        });
        await order_timeline_service_1.orderTimelineService.record({
            orderId: id,
            event: 'in_transit',
            metadata: { provider: body.provider, guideNumber: guide.guideNumber },
        });
        await notification_service_1.notificationService.notifyOrderEvent({
            orderId: id,
            event: 'handed_to_carrier',
            recipientEmail: updated.user.email,
            recipientPhone: order.phoneNumber || undefined,
        });
        return reply.status(201).send({ success: true, data: { ...guide, autoShipped: true } });
    });
    app.get('/orders/:id/guides', async (request, reply) => {
        const { id } = zod_1.default.object({ id: zod_1.default.string() }).parse(request.params);
        const guides = await prisma_1.prisma.shippingGuide.findMany({
            where: { orderId: id },
            orderBy: { createdAt: 'desc' },
        });
        return reply.send({ success: true, data: guides });
    });
    app.get('/orders/:id/notification-logs', async (request, reply) => {
        const { id } = zod_1.default.object({ id: zod_1.default.string() }).parse(request.params);
        const logs = await prisma_1.prisma.notificationLog.findMany({
            where: { orderId: id },
            orderBy: { createdAt: 'desc' },
        });
        return reply.send({ success: true, data: logs });
    });
}
//# sourceMappingURL=admin.js.map