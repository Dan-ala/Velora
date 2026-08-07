"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.trackingService = void 0;
const crypto_1 = __importDefault(require("crypto"));
const prisma_1 = require("../lib/prisma");
exports.trackingService = {
    async generateToken(orderId) {
        const existing = await prisma_1.prisma.trackingToken.findUnique({
            where: { orderId },
        });
        if (existing)
            return existing.token;
        const raw = crypto_1.default.randomBytes(24).toString('hex');
        const token = crypto_1.default.createHash('sha256').update(raw).digest('hex').slice(0, 32);
        await prisma_1.prisma.trackingToken.create({
            data: { orderId, token },
        });
        return token;
    },
    async getOrderByToken(token) {
        const trackingToken = await prisma_1.prisma.trackingToken.findUnique({
            where: { token },
            include: {
                order: {
                    include: {
                        items: {
                            include: {
                                product: { include: { images: { orderBy: { position: 'asc' } } } },
                            },
                        },
                        payments: true,
                        timeline: { orderBy: { createdAt: 'asc' } },
                        guides: { orderBy: { createdAt: 'desc' } },
                    },
                },
            },
        });
        if (!trackingToken)
            return null;
        return trackingToken.order;
    },
    async getTrackingUrl(orderId) {
        const token = await this.generateToken(orderId);
        const env = (await Promise.resolve().then(() => __importStar(require('../env')))).getEnv();
        const baseUrl = env.FRONTEND_URL.split(',')[0];
        return `${baseUrl}/tracking/${token}`;
    },
};
//# sourceMappingURL=tracking.service.js.map