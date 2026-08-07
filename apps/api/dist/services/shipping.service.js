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
Object.defineProperty(exports, "__esModule", { value: true });
exports.shippingService = void 0;
const prisma_1 = require("../lib/prisma");
async function getProvider(providerName) {
    switch (providerName) {
        case 'interrapidisimo':
            const { InterrapidisimoProvider } = await Promise.resolve().then(() => __importStar(require('../shipping/interrapidisimo.provider')));
            return new InterrapidisimoProvider();
        default:
            throw new Error(`Unknown shipping provider: ${providerName}`);
    }
}
exports.shippingService = {
    async createShipment(order, providerName) {
        const provider = await getProvider(providerName);
        const result = await provider.createShipment({
            orderId: order.id,
            reference: order.reference,
            items: order.items.map((i) => ({
                product: { name: i.product.name },
                quantity: i.quantity,
                price: i.price,
            })),
            userEmail: order.user.email,
            destinationAddress: order.shippingAddress,
            destinationCity: order.shippingCity,
        });
        const guide = await prisma_1.prisma.shippingGuide.create({
            data: {
                orderId: order.id,
                provider: providerName,
                guideNumber: result.guideNumber,
                trackingUrl: result.trackingUrl,
                labelUrl: result.labelUrl,
                barcodeUrl: result.barcodeUrl,
                cost: result.cost,
            },
        });
        await prisma_1.prisma.order.update({
            where: { id: order.id },
            data: {
                trackingNumber: result.guideNumber,
                carrier: providerName,
                shippingStatus: 'guide_generated',
            },
        });
        return { ...result, id: guide.id };
    },
    async getTracking(orderId) {
        const guide = await prisma_1.prisma.shippingGuide.findFirst({
            where: { orderId, status: 'active' },
            orderBy: { createdAt: 'desc' },
        });
        if (!guide)
            return null;
        try {
            const provider = await getProvider(guide.provider);
            return provider.getTracking(guide.guideNumber);
        }
        catch {
            return null;
        }
    },
    async getProviderList() {
        return [
            { id: 'interrapidisimo', name: 'Inter Rapidísimo', active: true },
            { id: 'coordinadora', name: 'Coordinadora', active: false },
            { id: 'servientrega', name: 'Servientrega', active: false },
            { id: 'envia', name: 'Envia', active: false },
            { id: 'manual', name: 'Mensajero propio', active: true },
        ];
    },
};
//# sourceMappingURL=shipping.service.js.map