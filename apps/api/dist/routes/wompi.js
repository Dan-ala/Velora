"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.wompiRoutes = wompiRoutes;
const crypto_1 = __importDefault(require("crypto"));
const zod_1 = require("zod");
const env_1 = require("../env");
const prisma_1 = require("../lib/prisma");
const auth_1 = require("../middleware/auth");
const BASE_URL_SANDBOX = 'https://sandbox.wompi.co/v1';
const BASE_URL_PRODUCTION = 'https://production.wompi.co/v1';
function apiBaseUrl() {
    return (0, env_1.getEnv)().WOMPI_LIVE ? BASE_URL_PRODUCTION : BASE_URL_SANDBOX;
}
function authHeaders() {
    const env = (0, env_1.getEnv)();
    return {
        Authorization: `Bearer ${env.WOMPI_PRIVATE_KEY}`,
        'Content-Type': 'application/json',
    };
}
function generateIntegritySignature(amountInCents, reference, currency) {
    const env = (0, env_1.getEnv)();
    const hash = crypto_1.default.createHash('sha256');
    hash.update(`${reference}${amountInCents}${currency}${env.WOMPI_INTEGRITY_KEY}`);
    return hash.digest('hex');
}
async function wompiRoutes(app) {
    app.post('/signature', { preHandler: (0, auth_1.preHandler)() }, async (request, reply) => {
        try {
            const body = zod_1.z.object({
                orderId: zod_1.z.string(),
                amountInCents: zod_1.z.number().positive(),
                currency: zod_1.z.string().default('COP'),
            }).parse(request.body);
            const reference = `VELORA-${body.orderId}-${Date.now()}`;
            const signature = generateIntegritySignature(body.amountInCents, reference, body.currency);
            await prisma_1.prisma.order.update({
                where: { id: body.orderId },
                data: { reference },
            });
            return reply.send({
                success: true,
                data: { reference, signature },
            });
        }
        catch (error) {
            return reply.status(400).send({ success: false, error: error.message });
        }
    });
    app.get('/transaction/:id', async (request, reply) => {
        try {
            const { id } = zod_1.z.object({ id: zod_1.z.string() }).parse(request.params);
            const res = await fetch(`${apiBaseUrl()}/transactions/${id}`, {
                headers: authHeaders(),
            });
            const json = await res.json();
            if (!res.ok) {
                return reply.status(502).send({
                    success: false,
                    error: json.error?.message || `Wompi error: ${res.status}`,
                });
            }
            return reply.send({ success: true, data: json.data });
        }
        catch (error) {
            return reply.status(500).send({ success: false, error: error.message });
        }
    });
}
//# sourceMappingURL=wompi.js.map