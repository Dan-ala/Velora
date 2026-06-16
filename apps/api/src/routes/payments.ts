import type { FastifyInstance } from 'fastify';
import { stripe } from '../lib/stripe';
import { prisma } from '../lib/prisma';
import { preHandler } from '../middleware/auth';
import { getEnv } from '../env';
import z from 'zod';

export async function paymentRoutes(app: FastifyInstance) {
  app.post('/create-payment-intent', { preHandler: preHandler() }, async (request, reply) => {
    const user = (request as any).user;

    if (!stripe) {
      return reply.status(400).send({ success: false, error: 'Stripe not configured' });
    }

    const cart = await prisma.cartItem.findMany({
      where: { userId: user.id },
      include: { product: true },
    });

    if (cart.length === 0) {
      return reply.status(400).send({ success: false, error: 'Cart is empty' });
    }

    const total = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

    const paymentIntent = await stripe.paymentIntents.create({
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
    const env = getEnv();
    if (!stripe || !env.STRIPE_WEBHOOK_SECRET) {
      return reply.status(400).send({ success: false, error: 'Stripe not configured' });
    }

    const sig = request.headers['stripe-signature'] as string;
    let event;

    try {
      const body = request.body as string;
      event = stripe.webhooks.constructEvent(body, sig, env.STRIPE_WEBHOOK_SECRET);
    } catch {
      return reply.status(400).send({ success: false, error: 'Invalid signature' });
    }

    if (event.type === 'payment_intent.succeeded') {
      const paymentIntent = event.data.object;
      const userId = paymentIntent.metadata.userId;

      const cart = await prisma.cartItem.findMany({
        where: { userId },
        include: { product: true },
      });

      const total = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

      const order = await prisma.order.create({
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
            create: {
              provider: 'stripe',
              status: 'completed',
            },
          },
        },
      });

      for (const item of cart) {
        const product = item.product;
        const oldStock = product.stock;
        const newStock = oldStock - item.quantity;

        await prisma.product.update({
          where: { id: item.productId },
          data: { stock: newStock },
        });

        await prisma.inventoryEvent.create({
          data: {
            productId: item.productId,
            oldStock,
            newStock,
          },
        });
      }

      await prisma.cartItem.deleteMany({ where: { userId } });
    }

    return reply.send({ received: true });
  });

  app.post('/confirm', { preHandler: preHandler() }, async (request, reply) => {
    const user = (request as any).user;
    const body = z.object({
      paymentIntentId: z.string(),
      provider: z.enum(['stripe', 'wompi']).default('stripe'),
    }).parse(request.body);

    const cart = await prisma.cartItem.findMany({
      where: { userId: user.id },
      include: { product: true },
    });

    if (cart.length === 0) {
      return reply.status(400).send({ success: false, error: 'Cart is empty' });
    }

    const total = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

    const order = await prisma.order.create({
      data: {
        userId: user.id,
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
          create: {
            provider: body.provider,
            status: 'completed',
          },
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
      await prisma.product.update({
        where: { id: item.productId },
        data: { stock: product.stock - item.quantity },
      });
    }

    await prisma.cartItem.deleteMany({ where: { userId: user.id } });

    return reply.status(201).send({ success: true, data: order });
  });
}
