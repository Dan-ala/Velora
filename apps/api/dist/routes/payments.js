"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.paymentRoutes = paymentRoutes;
const stripe_1 = require("../lib/stripe");
const prisma_1 = require("../lib/prisma");
const auth_1 = require("../middleware/auth");
const env_1 = require("../env");
const wompi_1 = require("../lib/wompi");
const email_1 = require("../lib/email");
const order_timeline_service_1 = require("../services/order-timeline.service");
const notification_service_1 = require("../services/notification.service");
const zod_1 = __importDefault(require("zod"));
async function getCart(userId) {
    return prisma_1.prisma.cartItem.findMany({
        where: { userId },
        include: { product: true },
    });
}
function calcTotal(cart) {
    return cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
}
function calcShipping(subtotal) {
    return subtotal >= 200000 ? 0 : 15000;
}
async function cancelPendingOrders(userId) {
    const pendingOrders = await prisma_1.prisma.order.findMany({
        where: { userId, status: 'pending' },
        include: { payments: { where: { status: 'pending' } } },
    });
    for (const order of pendingOrders) {
        await prisma_1.prisma.order.update({
            where: { id: order.id },
            data: { status: 'cancelled' },
        });
        for (const payment of order.payments) {
            await prisma_1.prisma.payment.update({
                where: { id: payment.id },
                data: { status: 'failed' },
            });
        }
    }
}
async function confirmOrder(userId, provider) {
    const [user, cart] = await Promise.all([
        prisma_1.prisma.user.findUnique({ where: { id: userId }, select: { email: true } }),
        getCart(userId),
    ]);
    if (!user)
        throw new Error('User not found');
    if (cart.length === 0)
        throw new Error('Cart is empty');
    const total = calcTotal(cart);
    const order = await prisma_1.prisma.order.create({
        data: {
            userId,
            total,
            status: 'confirmed',
            items: {
                create: cart.map((item) => ({
                    productId: item.productId,
                    quantity: item.quantity,
                    price: item.product.price,
                })),
            },
            payments: {
                create: { provider, status: 'completed' },
            },
        },
        include: {
            items: {
                include: {
                    product: { include: { images: { orderBy: { position: 'asc' } } } },
                },
            },
            payments: true,
        },
    });
    for (const item of cart) {
        const product = item.product;
        await prisma_1.prisma.product.update({
            where: { id: item.productId },
            data: { stock: product.stock - item.quantity },
        });
        await prisma_1.prisma.inventoryEvent.create({
            data: {
                productId: item.productId,
                oldStock: product.stock,
                newStock: product.stock - item.quantity,
            },
        });
    }
    await prisma_1.prisma.cartItem.deleteMany({ where: { userId } });
    await order_timeline_service_1.orderTimelineService.record({
        orderId: order.id,
        event: 'payment_confirmed',
        metadata: { provider, total },
    });
    (0, email_1.sendOrderConfirmation)(user.email, {
        id: order.id,
        reference: order.reference,
        total: order.total,
        items: order.items,
    }).catch(() => { });
    notification_service_1.notificationService.notifyOrderEvent({
        orderId: order.id,
        event: 'payment_confirmed',
        recipientEmail: user.email,
    }).catch(() => { });
    return order;
}
async function paymentRoutes(app) {
    app.post('/create-payment-intent', { preHandler: (0, auth_1.preHandler)() }, async (request, reply) => {
        const user = request.user;
        if (!stripe_1.stripe) {
            return reply.status(400).send({ success: false, error: 'Stripe not configured' });
        }
        const cart = await getCart(user.id);
        if (cart.length === 0) {
            return reply.status(400).send({ success: false, error: 'Cart is empty' });
        }
        const total = calcTotal(cart);
        const paymentIntent = await stripe_1.stripe.paymentIntents.create({
            amount: total,
            currency: 'cop',
            metadata: { userId: user.id },
        });
        return reply.send({
            success: true,
            data: { clientSecret: paymentIntent.client_secret, total },
        });
    });
    app.post('/webhook', async (request, reply) => {
        const env = (0, env_1.getEnv)();
        if (!stripe_1.stripe || !env.STRIPE_WEBHOOK_SECRET) {
            return reply.status(400).send({ success: false, error: 'Stripe not configured' });
        }
        const sig = request.headers['stripe-signature'];
        let event;
        try {
            const body = request.body;
            event = stripe_1.stripe.webhooks.constructEvent(body, sig, env.STRIPE_WEBHOOK_SECRET);
        }
        catch {
            return reply.status(400).send({ success: false, error: 'Invalid signature' });
        }
        if (event.type === 'payment_intent.succeeded') {
            const paymentIntent = event.data.object;
            await confirmOrder(paymentIntent.metadata.userId, 'stripe');
        }
        return reply.send({ received: true });
    });
    app.post('/confirm', { preHandler: (0, auth_1.preHandler)() }, async (request, reply) => {
        const user = request.user;
        const body = zod_1.default.object({
            paymentIntentId: zod_1.default.string(),
            provider: zod_1.default.enum(['stripe', 'wompi']).default('stripe'),
        }).parse(request.body);
        try {
            if (body.provider === 'wompi') {
                const payment = await prisma_1.prisma.payment.findFirst({
                    where: {
                        OR: [
                            { transactionId: body.paymentIntentId },
                            { reference: body.paymentIntentId },
                        ],
                        provider: 'wompi',
                    },
                    include: { order: true },
                });
                if (!payment) {
                    return reply.status(404).send({ success: false, error: 'Payment not found' });
                }
                let transactionId = payment.transactionId;
                if (!transactionId) {
                    const tx = await wompi_1.wompi.getTransactionByReference(payment.reference);
                    if (tx) {
                        transactionId = tx.id;
                    }
                }
                if (!transactionId) {
                    return reply.status(404).send({ success: false, error: 'Payment not found on Wompi', transactionId: null });
                }
                const transaction = await wompi_1.wompi.getTransaction(transactionId);
                if (transaction.status === 'APPROVED') {
                    const order = await prisma_1.prisma.order.findUnique({
                        where: { id: payment.orderId },
                        include: {
                            items: { include: { product: true } },
                        },
                    });
                    if (!order) {
                        return reply.status(404).send({ success: false, error: 'Order not found' });
                    }
                    await prisma_1.prisma.payment.update({
                        where: { id: payment.id },
                        data: { status: 'completed', transactionId },
                    });
                    if (order.status !== 'confirmed') {
                        await prisma_1.prisma.order.update({
                            where: { id: payment.orderId },
                            data: { status: 'confirmed' },
                        });
                        for (const item of order.items) {
                            const product = item.product;
                            await prisma_1.prisma.product.update({
                                where: { id: item.productId },
                                data: { stock: product.stock - item.quantity },
                            });
                            await prisma_1.prisma.inventoryEvent.create({
                                data: {
                                    productId: item.productId,
                                    oldStock: product.stock,
                                    newStock: product.stock - item.quantity,
                                },
                            });
                        }
                        await order_timeline_service_1.orderTimelineService.record({
                            orderId: payment.orderId,
                            event: 'payment_confirmed',
                            metadata: { provider: 'wompi', transactionId },
                        });
                        (0, email_1.sendOrderConfirmation)(user.email, {
                            id: order.id,
                            reference: order.reference,
                            total: order.total,
                            items: order.items,
                        }).catch(() => { });
                        notification_service_1.notificationService.notifyOrderEvent({
                            orderId: order.id,
                            event: 'payment_confirmed',
                            recipientEmail: user.email,
                            recipientPhone: order.phoneNumber || undefined,
                        }).catch(() => { });
                    }
                    await prisma_1.prisma.cartItem.deleteMany({ where: { userId: user.id } });
                    return reply.send({ success: true, data: order });
                }
                return reply.status(400).send({
                    success: false,
                    error: `Transaction status: ${transaction.status}`,
                    transactionId,
                });
            }
            const order = await confirmOrder(user.id, body.provider);
            return reply.status(201).send({ success: true, data: order });
        }
        catch (error) {
            return reply.status(400).send({ success: false, error: error.message });
        }
    });
    app.get('/wompi/financial-institutions', async (_request, reply) => {
        try {
            const institutions = await wompi_1.wompi.getFinancialInstitutions();
            return reply.send({ success: true, data: institutions });
        }
        catch (error) {
            return reply.status(502).send({ success: false, error: error.message });
        }
    });
    app.get('/wompi/debug', async (_request, reply) => {
        const env = (0, env_1.getEnv)();
        return reply.send({
            success: true,
            data: {
                hasPublicKey: !!env.WOMPI_PUBLIC_KEY,
                hasPrivateKey: !!env.WOMPI_PRIVATE_KEY,
                hasIntegrityKey: !!env.WOMPI_INTEGRITY_KEY,
                hasEventKey: !!env.WOMPI_EVENT_KEY,
                isLive: env.WOMPI_LIVE,
                baseUrl: wompi_1.wompi.baseUrl(),
                pkPrefix: env.WOMPI_PUBLIC_KEY?.substring(0, 8),
            },
        });
    });
    app.post('/wompi/card-init', { preHandler: (0, auth_1.preHandler)() }, async (request, reply) => {
        try {
            const user = request.user;
            const cart = await getCart(user.id);
            if (cart.length === 0) {
                return reply.status(400).send({ success: false, error: 'Cart is empty' });
            }
            await cancelPendingOrders(user.id);
            const subtotal = calcTotal(cart);
            const shipping = calcShipping(subtotal);
            const total = subtotal + shipping;
            const amountInCents = total * 100;
            const reference = wompi_1.wompi.generateReference();
            if (amountInCents < 150000) {
                return reply.status(400).send({
                    success: false,
                    error: 'El monto mínimo para pagar con Wompi es $1,500 COP',
                });
            }
            const order = await prisma_1.prisma.order.create({
                data: {
                    userId: user.id,
                    total,
                    status: 'pending',
                    reference,
                    items: {
                        create: cart.map((item) => ({
                            productId: item.productId,
                            quantity: item.quantity,
                            price: item.product.price,
                        })),
                    },
                    payments: {
                        create: {
                            provider: 'wompi',
                            status: 'pending',
                            reference,
                        },
                    },
                },
            });
            const signature = wompi_1.wompi.generateIntegritySignature(amountInCents, reference, 'COP');
            return reply.send({
                success: true,
                data: {
                    orderId: order.id,
                    reference,
                    signature,
                    amountInCents,
                },
            });
        }
        catch (error) {
            return reply.status(400).send({ success: false, error: error.message });
        }
    });
    app.post('/wompi/cancel-pending', { preHandler: (0, auth_1.preHandler)() }, async (request, reply) => {
        try {
            const user = request.user;
            const pendingOrders = await prisma_1.prisma.order.findMany({
                where: { userId: user.id, status: 'pending' },
                include: { payments: { where: { status: 'pending' } } },
            });
            for (const order of pendingOrders) {
                await prisma_1.prisma.order.update({
                    where: { id: order.id },
                    data: { status: 'cancelled' },
                });
                for (const payment of order.payments) {
                    await prisma_1.prisma.payment.update({
                        where: { id: payment.id },
                        data: { status: 'failed' },
                    });
                }
            }
            return reply.send({ success: true, cancelled: pendingOrders.length });
        }
        catch (error) {
            return reply.status(400).send({ success: false, error: error.message });
        }
    });
    app.post('/wompi/create', { preHandler: (0, auth_1.preHandler)() }, async (request, reply) => {
        try {
            const user = request.user;
            const body = zod_1.default.object({
                paymentMethodType: zod_1.default.enum(['PSE', 'BANCOLOMBIA_TRANSFER', 'NEQUI', 'CARD']),
                financialInstitutionCode: zod_1.default.string().optional(),
                userType: zod_1.default.number().optional(),
                userLegalIdType: zod_1.default.string().optional(),
                userLegalId: zod_1.default.string().optional(),
                fullName: zod_1.default.string().optional(),
                phoneNumber: zod_1.default.string().optional(),
            }).parse(request.body);
            const env = (0, env_1.getEnv)();
            const cart = await getCart(user.id);
            if (cart.length === 0) {
                return reply.status(400).send({ success: false, error: 'Cart is empty' });
            }
            await cancelPendingOrders(user.id);
            const subtotal = calcTotal(cart);
            const shipping = calcShipping(subtotal);
            const total = subtotal + shipping;
            const amountInCents = total * 100;
            const reference = wompi_1.wompi.generateReference();
            if (amountInCents < 150000) {
                return reply.status(400).send({
                    success: false,
                    error: 'El monto mínimo para pagar con Wompi es $1,500 COP',
                });
            }
            const paymentMethod = body.paymentMethodType === 'CARD'
                ? undefined
                : { type: body.paymentMethodType };
            if (body.paymentMethodType === 'PSE') {
                paymentMethod.user_type = body.userType ?? 0;
                paymentMethod.user_legal_id_type = body.userLegalIdType ?? 'CC';
                paymentMethod.user_legal_id = body.userLegalId ?? '';
                paymentMethod.financial_institution_code = body.financialInstitutionCode ?? '';
                paymentMethod.payment_description = `VELORA order ${reference}`;
            }
            else if (body.paymentMethodType === 'NEQUI') {
                paymentMethod.phone_number = body.phoneNumber;
                paymentMethod.user_type = body.userType ?? 0;
                paymentMethod.user_legal_id_type = body.userLegalIdType ?? 'CC';
                paymentMethod.user_legal_id = body.userLegalId ?? '';
            }
            else if (body.paymentMethodType === 'BANCOLOMBIA_TRANSFER') {
                paymentMethod.user_type = 'PERSON';
                paymentMethod.user_legal_id_type = body.userLegalIdType ?? 'CC';
                paymentMethod.user_legal_id = body.userLegalId ?? '';
                paymentMethod.financial_institution_code = '1001';
                paymentMethod.payment_description = `VELORA order ${reference}`;
            }
            const redirectUrl = `${env.FRONTEND_URL.split(',')[0]}/checkout?wompi_reference=${reference}`;
            const customerData = body.fullName
                ? {
                    fullName: body.fullName,
                    phoneNumber: body.phoneNumber,
                    legalId: body.userLegalId,
                    legalIdType: body.userLegalIdType,
                }
                : undefined;
            const transaction = await wompi_1.wompi.createTransaction({
                amountInCents,
                reference,
                customerEmail: user.email,
                paymentMethodType: body.paymentMethodType,
                paymentMethod,
                customerData,
                redirectUrl,
            });
            let asyncPaymentUrl = transaction.payment_method?.extra?.async_payment_url ||
                transaction.payment_method?.extra?.pseURL ||
                null;
            if (!asyncPaymentUrl && body.paymentMethodType === 'PSE') {
                for (let i = 0; i < 10; i++) {
                    await new Promise((r) => setTimeout(r, 1000));
                    const updated = await wompi_1.wompi.getTransaction(transaction.id);
                    asyncPaymentUrl =
                        updated.payment_method?.extra?.async_payment_url ||
                            updated.payment_method?.extra?.pseURL ||
                            null;
                    if (asyncPaymentUrl)
                        break;
                }
            }
            await prisma_1.prisma.order.create({
                data: {
                    userId: user.id,
                    total,
                    status: 'pending',
                    items: {
                        create: cart.map((item) => ({
                            productId: item.productId,
                            quantity: item.quantity,
                            price: item.product.price,
                        })),
                    },
                    payments: {
                        create: {
                            provider: 'wompi',
                            status: 'pending',
                            transactionId: transaction.id,
                            reference,
                        },
                    },
                },
            });
            return reply.send({
                success: true,
                data: {
                    transactionId: transaction.id,
                    reference,
                    asyncPaymentUrl,
                    status: transaction.status,
                },
            });
        }
        catch (error) {
            return reply.status(400).send({ success: false, error: error.message });
        }
    });
    app.get('/wompi/transaction/:id', async (request, reply) => {
        const { id } = zod_1.default.object({ id: zod_1.default.string() }).parse(request.params);
        const transaction = await wompi_1.wompi.getTransaction(id);
        return reply.send({ success: true, data: transaction });
    });
    app.post('/wompi/webhook', async (request, reply) => {
        try {
            const event = request.body;
            if (!wompi_1.wompi.verifyWebhookEvent(event)) {
                return reply.status(401).send({ success: false, error: 'Invalid signature' });
            }
            if (event.event !== 'transaction.updated' || !event.data?.transaction) {
                return reply.send({ received: true });
            }
            const tx = event.data.transaction;
            const payment = await prisma_1.prisma.payment.findFirst({
                where: { transactionId: tx.id, provider: 'wompi' },
                include: {
                    order: {
                        include: {
                            items: { include: { product: true } },
                            user: { select: { id: true, email: true } },
                        },
                    },
                },
            });
            if (!payment?.order) {
                return reply.send({ received: true });
            }
            const order = payment.order;
            if (tx.status === 'APPROVED') {
                if (order.status === 'confirmed') {
                    return reply.send({ received: true });
                }
                await prisma_1.prisma.payment.update({
                    where: { id: payment.id },
                    data: { status: 'completed' },
                });
                await prisma_1.prisma.order.update({
                    where: { id: order.id },
                    data: { status: 'confirmed' },
                });
                for (const item of order.items) {
                    const product = item.product;
                    await prisma_1.prisma.product.update({
                        where: { id: item.productId },
                        data: { stock: product.stock - item.quantity },
                    });
                    await prisma_1.prisma.inventoryEvent.create({
                        data: {
                            productId: item.productId,
                            oldStock: product.stock,
                            newStock: product.stock - item.quantity,
                        },
                    });
                }
                await prisma_1.prisma.cartItem.deleteMany({ where: { userId: order.userId } });
                await order_timeline_service_1.orderTimelineService.record({
                    orderId: order.id,
                    event: 'payment_confirmed',
                    metadata: { provider: 'wompi', transactionId: tx.id },
                });
                await (0, email_1.sendOrderConfirmation)(order.user.email, {
                    id: order.id,
                    reference: order.reference,
                    total: order.total,
                    items: order.items,
                });
                await notification_service_1.notificationService.notifyOrderEvent({
                    orderId: order.id,
                    event: 'payment_confirmed',
                    recipientEmail: order.user.email,
                    recipientPhone: order.phoneNumber || undefined,
                });
            }
            else if (['DECLINED', 'ERROR', 'VOIDED'].includes(tx.status)) {
                await prisma_1.prisma.payment.update({
                    where: { id: payment.id },
                    data: { status: 'failed' },
                });
                await prisma_1.prisma.order.update({
                    where: { id: order.id },
                    data: { status: 'cancelled' },
                });
                await order_timeline_service_1.orderTimelineService.record({
                    orderId: order.id,
                    event: 'cancelled',
                    metadata: { reason: `payment_${tx.status.toLowerCase()}`, transactionStatus: tx.status },
                });
                await (0, email_1.sendOrderFailed)(order.user.email, {
                    id: order.id,
                    reference: order.reference,
                });
                await notification_service_1.notificationService.notifyOrderEvent({
                    orderId: order.id,
                    event: 'cancelled',
                    recipientEmail: order.user.email,
                    recipientPhone: order.phoneNumber || undefined,
                });
            }
            return reply.send({ received: true });
        }
        catch (error) {
            request.log.error(error);
            return reply.status(500).send({ success: false, error: error.message });
        }
    });
}
//# sourceMappingURL=payments.js.map