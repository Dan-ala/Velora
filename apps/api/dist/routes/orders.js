"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.orderRoutes = orderRoutes;
const order_service_1 = require("../services/order.service");
const auth_1 = require("../middleware/auth");
const zod_1 = __importDefault(require("zod"));
async function orderRoutes(app) {
    app.get('/', { preHandler: (0, auth_1.preHandler)() }, async (request, reply) => {
        const user = request.user;
        const orders = await order_service_1.orderService.findByUser(user.id);
        return reply.send({ success: true, data: orders });
    });
    app.get('/:id', { preHandler: (0, auth_1.preHandler)() }, async (request, reply) => {
        const { id } = zod_1.default.object({ id: zod_1.default.string() }).parse(request.params);
        const order = await order_service_1.orderService.findById(id);
        if (!order) {
            return reply.status(404).send({ success: false, error: 'Order not found' });
        }
        return reply.send({ success: true, data: order });
    });
    app.post('/', { preHandler: (0, auth_1.preHandler)() }, async (request, reply) => {
        const user = request.user;
        try {
            const order = await order_service_1.orderService.create(user.id);
            return reply.status(201).send({ success: true, data: order });
        }
        catch (error) {
            return reply.status(400).send({ success: false, error: error.message });
        }
    });
}
//# sourceMappingURL=orders.js.map