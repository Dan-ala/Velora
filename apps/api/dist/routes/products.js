"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.productRoutes = productRoutes;
const product_service_1 = require("../services/product.service");
const zod_1 = __importDefault(require("zod"));
async function productRoutes(app) {
    app.get('/', async (request, reply) => {
        const query = zod_1.default.object({
            page: zod_1.default.coerce.number().optional().default(1),
            limit: zod_1.default.coerce.number().optional().default(12),
            category: zod_1.default.string().optional(),
            search: zod_1.default.string().optional(),
        }).parse(request.query);
        const result = await product_service_1.productService.findAll(query);
        return reply.send({ success: true, ...result });
    });
    app.get('/featured', async (_request, reply) => {
        const products = await product_service_1.productService.getFeatured();
        return reply.send({ success: true, data: products });
    });
    app.get('/category/:category', async (request, reply) => {
        const { category } = zod_1.default.object({ category: zod_1.default.string() }).parse(request.params);
        const products = await product_service_1.productService.findByCategory(category);
        return reply.send({ success: true, data: products });
    });
    app.get('/:id', async (request, reply) => {
        const { id } = zod_1.default.object({ id: zod_1.default.string() }).parse(request.params);
        const product = await product_service_1.productService.findById(id);
        if (!product) {
            return reply.status(404).send({ success: false, error: 'Product not found' });
        }
        return reply.send({ success: true, data: product });
    });
}
//# sourceMappingURL=products.js.map