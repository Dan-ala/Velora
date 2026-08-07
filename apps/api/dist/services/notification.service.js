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
exports.notificationService = void 0;
const prisma_1 = require("../lib/prisma");
async function logNotification(params) {
    try {
        await prisma_1.prisma.notificationLog.create({
            data: {
                orderId: params.orderId,
                channel: params.channel,
                event: params.event,
                status: params.status,
                recipient: params.recipient,
                metadata: (params.metadata ?? {}),
            },
        });
    }
    catch {
        // non-critical
    }
}
exports.notificationService = {
    async sendEmail(params) {
        const { sendOrderConfirmation, sendOrderShipped, sendOrderFailed } = await Promise.resolve().then(() => __importStar(require('../lib/email')));
        try {
            const order = await prisma_1.prisma.order.findUnique({
                where: { id: params.orderId },
                include: {
                    items: { include: { product: true } },
                    trackingToken: true,
                },
            });
            if (!order || !params.recipientEmail)
                return;
            const trackingUrl = order.trackingToken
                ? `${((await Promise.resolve().then(() => __importStar(require('../env')))).getEnv()).FRONTEND_URL.split(',')[0]}/tracking/${order.trackingToken.token}`
                : null;
            switch (params.event) {
                case 'payment_confirmed': {
                    await sendOrderConfirmation(params.recipientEmail, {
                        id: order.id,
                        reference: order.reference,
                        total: order.total,
                        items: order.items,
                        trackingUrl,
                    });
                    await logNotification({
                        orderId: params.orderId,
                        channel: 'email',
                        event: params.event,
                        status: 'sent',
                        recipient: params.recipientEmail,
                    });
                    break;
                }
                case 'in_transit':
                case 'handed_to_carrier': {
                    await sendOrderShipped(params.recipientEmail, {
                        id: order.id,
                        reference: order.reference,
                        trackingNumber: order.trackingNumber,
                        carrier: order.carrier,
                        estimatedDelivery: order.estimatedDelivery,
                        items: order.items,
                        total: order.total,
                    });
                    await logNotification({
                        orderId: params.orderId,
                        channel: 'email',
                        event: params.event,
                        status: 'sent',
                        recipient: params.recipientEmail,
                    });
                    break;
                }
                case 'delivered': {
                    const { sendOrderDelivered } = await Promise.resolve().then(() => __importStar(require('../lib/email')));
                    await sendOrderDelivered(params.recipientEmail, {
                        id: order.id,
                        reference: order.reference,
                        items: order.items,
                        total: order.total,
                        trackingUrl,
                    });
                    await logNotification({
                        orderId: params.orderId,
                        channel: 'email',
                        event: params.event,
                        status: 'sent',
                        recipient: params.recipientEmail,
                    });
                    break;
                }
                case 'cancelled': {
                    await sendOrderFailed(params.recipientEmail, {
                        id: order.id,
                        reference: order.reference,
                    });
                    await logNotification({
                        orderId: params.orderId,
                        channel: 'email',
                        event: params.event,
                        status: 'sent',
                        recipient: params.recipientEmail,
                    });
                    break;
                }
            }
        }
        catch (error) {
            await logNotification({
                orderId: params.orderId,
                channel: 'email',
                event: params.event,
                status: 'failed',
                recipient: params.recipientEmail || '',
                metadata: { error: error.message },
            });
        }
    },
    async sendWhatsApp(params) {
        const env = (await Promise.resolve().then(() => __importStar(require('../env')))).getEnv();
        const apiKey = env.WHATSAPP_API_KEY;
        const phoneNumber = env.WHATSAPP_PHONE_NUMBER;
        const provider = env.WHATSAPP_PROVIDER;
        if (!apiKey || !phoneNumber || !params.recipientPhone) {
            await logNotification({
                orderId: params.orderId,
                channel: 'whatsapp',
                event: params.event,
                status: 'skipped',
                recipient: params.recipientPhone || '',
                metadata: { reason: 'Not configured or no recipient phone' },
            });
            return;
        }
        const trackingService = (await Promise.resolve().then(() => __importStar(require('./tracking.service')))).trackingService;
        const trackingUrl = await trackingService.getTrackingUrl(params.orderId);
        const eventMessages = {
            order_created: {
                subject: 'Pedido recibido',
                content: `¡Gracias por tu compra en Velora! Hemos recibido tu pedido.`,
            },
            payment_confirmed: {
                subject: 'Pago confirmado',
                content: `¡Tu pago ha sido confirmado! Pronto comenzaremos a preparar tu pedido.`,
            },
            guide_generated: {
                subject: 'Guía generada',
                content: `Tu pedido ya tiene guía de envío. Puedes hacer seguimiento aquí: ${trackingUrl}`,
            },
            handed_to_carrier: {
                subject: 'Entregado a transportadora',
                content: `Tu pedido ha sido entregado a la transportadora. Sigue tu envío: ${trackingUrl}`,
            },
            in_transit: {
                subject: 'En camino',
                content: `Tu pedido está en camino. Sigue tu envío en tiempo real: ${trackingUrl}`,
            },
            delivered: {
                subject: 'Entregado',
                content: `¡Tu pedido ha sido entregado! Esperamos que disfrutes tus productos Velora.`,
            },
        };
        const msg = eventMessages[params.event];
        if (!msg) {
            await logNotification({
                orderId: params.orderId,
                channel: 'whatsapp',
                event: params.event,
                status: 'skipped',
                recipient: params.recipientPhone,
                metadata: { reason: `No template for event: ${params.event}` },
            });
            return;
        }
        const content = `${msg.subject}\n\n${msg.content}\n\nTienda Velora\nhttps://velorastore.cc`;
        try {
            if (provider === 'meta') {
                const res = await fetch(`https://graph.facebook.com/v21.0/${phoneNumber}/messages`, {
                    method: 'POST',
                    headers: {
                        Authorization: `Bearer ${apiKey}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        messaging_product: 'whatsapp',
                        to: params.recipientPhone,
                        type: 'text',
                        text: { body: content },
                    }),
                });
                const data = await res.json();
                const success = res.ok;
                await logNotification({
                    orderId: params.orderId,
                    channel: 'whatsapp',
                    event: params.event,
                    status: success ? 'sent' : 'failed',
                    recipient: params.recipientPhone,
                    metadata: { provider, messageId: data?.messages?.[0]?.id, ...(success ? {} : { error: data }) },
                });
            }
        }
        catch (error) {
            await logNotification({
                orderId: params.orderId,
                channel: 'whatsapp',
                event: params.event,
                status: 'failed',
                recipient: params.recipientPhone,
                metadata: { provider, error: error.message },
            });
        }
    },
    async notifyOrderEvent(params) {
        await Promise.all([
            this.sendEmail(params),
            params.recipientPhone ? this.sendWhatsApp(params) : Promise.resolve(),
        ]);
    },
};
//# sourceMappingURL=notification.service.js.map