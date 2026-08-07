"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.trackingRoutes = trackingRoutes;
const tracking_service_1 = require("../services/tracking.service");
const shipping_service_1 = require("../services/shipping.service");
const zod_1 = __importDefault(require("zod"));
async function trackingRoutes(app) {
    app.get('/:token', async (request, reply) => {
        const { token } = zod_1.default.object({ token: zod_1.default.string().length(32) }).parse(request.params);
        const order = await tracking_service_1.trackingService.getOrderByToken(token);
        if (!order) {
            return reply.status(404).send({
                success: false,
                error: 'Seguimiento no encontrado',
            });
        }
        const carrierTracking = await shipping_service_1.shippingService.getTracking(order.id).catch(() => null);
        return reply.send({
            success: true,
            data: {
                id: order.id,
                reference: order.reference,
                status: order.status,
                total: order.total,
                shippingCost: order.shippingCost,
                trackingNumber: order.trackingNumber,
                carrier: order.carrier,
                shippingAddress: order.shippingAddress,
                shippingCity: order.shippingCity,
                estimatedDelivery: order.estimatedDelivery,
                createdAt: order.createdAt,
                items: order.items.map((item) => ({
                    id: item.id,
                    quantity: item.quantity,
                    price: item.price,
                    product: {
                        name: item.product.name,
                        image: item.product.images?.[0]?.url || null,
                    },
                })),
                payments: order.payments?.map((p) => ({
                    provider: p.provider,
                    status: p.status,
                })),
                timeline: order.timeline,
                guides: order.guides?.map((g) => ({
                    id: g.id,
                    provider: g.provider,
                    guideNumber: g.guideNumber,
                    labelUrl: g.labelUrl,
                    barcodeUrl: g.barcodeUrl,
                    trackingUrl: g.trackingUrl,
                    cost: g.cost,
                })),
                carrierTracking,
            },
        });
    });
    app.post('/:token/verify', async (request, reply) => {
        const { token } = zod_1.default.object({ token: zod_1.default.string().length(32) }).parse(request.params);
        const trackingToken = await tracking_service_1.trackingService.getOrderByToken(token);
        if (!trackingToken) {
            return reply.status(404).send({ success: false, error: 'Token inválido' });
        }
        return reply.send({ success: true, data: { valid: true } });
    });
}
//# sourceMappingURL=tracking.js.map