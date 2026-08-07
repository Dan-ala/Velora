"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.cartRoutes = cartRoutes;
const cart_service_1 = require("../services/cart.service");
const auth_1 = require("../middleware/auth");
const zod_1 = __importDefault(require("zod"));
async function cartRoutes(app) {
    app.get('/', { preHandler: (0, auth_1.preHandler)() }, async (request, reply) => {
        const user = request.user;
        const cart = await cart_service_1.cartService.findByUser(user.id);
        return reply.send({ success: true, data: cart });
    });
    app.get('/count', { preHandler: (0, auth_1.preHandler)() }, async (request, reply) => {
        const user = request.user;
        const count = await cart_service_1.cartService.getItemCount(user.id);
        return reply.send({ success: true, data: { count } });
    });
    app.post('/', { preHandler: (0, auth_1.preHandler)() }, async (request, reply) => {
        const user = request.user;
        const body = zod_1.default.object({
            productId: zod_1.default.string(),
            quantity: zod_1.default.number().int().positive().optional().default(1),
        }).parse(request.body);
        const item = await cart_service_1.cartService.addItem(user.id, body.productId, body.quantity);
        return reply.status(201).send({ success: true, data: item });
    });
    app.put('/:id', { preHandler: (0, auth_1.preHandler)() }, async (request, reply) => {
        const { id } = zod_1.default.object({ id: zod_1.default.string() }).parse(request.params);
        const body = zod_1.default.object({ quantity: zod_1.default.number().int().positive() }).parse(request.body);
        const item = await cart_service_1.cartService.updateItemQuantity(id, body.quantity);
        return reply.send({ success: true, data: item });
    });
    app.delete('/:id', { preHandler: (0, auth_1.preHandler)() }, async (request, reply) => {
        const { id } = zod_1.default.object({ id: zod_1.default.string() }).parse(request.params);
        await cart_service_1.cartService.removeItem(id);
        return reply.send({ success: true, message: 'Item removed from cart' });
    });
    app.delete('/', { preHandler: (0, auth_1.preHandler)() }, async (request, reply) => {
        const user = request.user;
        await cart_service_1.cartService.clearCart(user.id);
        return reply.send({ success: true, message: 'Cart cleared' });
    });
    app.put('/sync', { preHandler: (0, auth_1.preHandler)() }, async (request, reply) => {
        const user = request.user;
        const body = zod_1.default.object({
            items: zod_1.default.array(zod_1.default.object({
                productId: zod_1.default.string(),
                quantity: zod_1.default.number().int().positive(),
            })),
        }).parse(request.body);
        await cart_service_1.cartService.syncItems(user.id, body.items);
        const cart = await cart_service_1.cartService.findByUser(user.id);
        return reply.send({ success: true, data: cart });
    });
}
//# sourceMappingURL=cart.js.map