"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fastify_1 = __importDefault(require("fastify"));
const cors_1 = __importDefault(require("@fastify/cors"));
const helmet_1 = __importDefault(require("@fastify/helmet"));
const rate_limit_1 = __importDefault(require("@fastify/rate-limit"));
const env_1 = require("./env");
const products_1 = require("./routes/products");
const auth_1 = require("./routes/auth");
const cart_1 = require("./routes/cart");
const orders_1 = require("./routes/orders");
const payments_1 = require("./routes/payments");
const admin_1 = require("./routes/admin");
const inventory_1 = require("./routes/inventory");
const cloudinary_1 = require("./routes/cloudinary");
const wompi_1 = require("./routes/wompi");
const tracking_1 = require("./routes/tracking");
async function bootstrap() {
    const env = (0, env_1.getEnv)();
    const app = (0, fastify_1.default)({
        logger: true,
    });
    await app.register(helmet_1.default, { contentSecurityPolicy: false });
    await app.register(cors_1.default, {
        origin: (origin, cb) => {
            if (!origin || env.NODE_ENV === 'development') {
                cb(null, true);
                return;
            }
            const allowed = env.FRONTEND_URL.split(',').map((s) => s.trim());
            cb(null, allowed.includes(origin));
        },
        credentials: true,
    });
    await app.register(rate_limit_1.default, {
        max: 100,
        timeWindow: '1 minute',
    });
    app.get('/health', async () => ({ success: true, message: 'VELORA API is running' }));
    await app.register(auth_1.authRoutes, { prefix: '/api/auth' });
    await app.register(products_1.productRoutes, { prefix: '/api/products' });
    await app.register(cart_1.cartRoutes, { prefix: '/api/cart' });
    await app.register(orders_1.orderRoutes, { prefix: '/api/orders' });
    await app.register(payments_1.paymentRoutes, { prefix: '/api/payments' });
    await app.register(admin_1.adminRoutes, { prefix: '/api/admin' });
    await app.register(inventory_1.inventoryRoutes, { prefix: '/api/inventory' });
    await app.register(cloudinary_1.cloudinaryRoutes, { prefix: '/api/cloudinary' });
    await app.register(wompi_1.wompiRoutes, { prefix: '/api/wompi' });
    await app.register(tracking_1.trackingRoutes, { prefix: '/api/tracking' });
    try {
        await app.listen({ port: env.PORT, host: '0.0.0.0' });
        console.log(`VELORA API running on port ${env.PORT}`);
    }
    catch (err) {
        app.log.error(err);
        process.exit(1);
    }
}
bootstrap();
//# sourceMappingURL=index.js.map