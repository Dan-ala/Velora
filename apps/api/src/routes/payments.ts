import type { FastifyInstance, FastifyRequest } from 'fastify';
import { stripe } from '../lib/stripe';
import { prisma } from '../lib/prisma';
import { preHandler } from '../middleware/auth';
import { getEnv } from '../env';
import { wompi } from '../lib/wompi';
import z from 'zod';

async function getCart(userId: string) {
  return prisma.cartItem.findMany({
    where: { userId },
    include: { product: true },
  });
}

function calcTotal(cart: Awaited<ReturnType<typeof getCart>>) {
  return cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
}

async function confirmOrder(userId: string, provider: 'stripe' | 'wompi') {
  const cart = await getCart(userId);
  if (cart.length === 0) throw new Error('Cart is empty');

  const total = calcTotal(cart);

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
    await prisma.product.update({
      where: { id: item.productId },
      data: { stock: product.stock - item.quantity },
    });
    await prisma.inventoryEvent.create({
      data: {
        productId: item.productId,
        oldStock: product.stock,
        newStock: product.stock - item.quantity,
      },
    });
  }

  await prisma.cartItem.deleteMany({ where: { userId } });
  return order;
}

export async function paymentRoutes(app: FastifyInstance) {
  app.post('/create-payment-intent', { preHandler: preHandler() }, async (request, reply) => {
    const user = (request as any).user;

    if (!stripe) {
      return reply.status(400).send({ success: false, error: 'Stripe not configured' });
    }

    const cart = await getCart(user.id);
    if (cart.length === 0) {
      return reply.status(400).send({ success: false, error: 'Cart is empty' });
    }

    const total = calcTotal(cart);

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
      await confirmOrder(paymentIntent.metadata.userId as string, 'stripe');
    }

    return reply.send({ received: true });
  });

  app.post('/confirm', { preHandler: preHandler() }, async (request, reply) => {
    const user = (request as any).user;
    const body = z.object({
      paymentIntentId: z.string(),
      provider: z.enum(['stripe', 'wompi']).default('stripe'),
    }).parse(request.body);

    try {
      if (body.provider === 'wompi') {
        const payment = await prisma.payment.findFirst({
          where: {
            OR: [
              { transactionId: body.paymentIntentId },
              { reference: body.paymentIntentId },
            ],
            provider: 'wompi',
          },
          include: { order: true },
        });

        if (!payment || !payment.transactionId) {
          return reply.status(404).send({ success: false, error: 'Payment not found' });
        }

        const transaction = await wompi.getTransaction(payment.transactionId);

        if (transaction.status === 'APPROVED') {
          await prisma.payment.update({
            where: { id: payment.id },
            data: { status: 'completed' },
          });
          const order = await prisma.order.update({
            where: { id: payment.orderId },
            data: { status: 'confirmed' },
          });
          await prisma.cartItem.deleteMany({ where: { userId: user.id } });
          return reply.send({ success: true, data: order });
        }

        return reply.status(400).send({
          success: false,
          error: `Transaction status: ${transaction.status}`,
        });
      }

      const order = await confirmOrder(user.id, body.provider);
      return reply.status(201).send({ success: true, data: order });
    } catch (error: any) {
      return reply.status(400).send({ success: false, error: error.message });
    }
  });

  app.get('/wompi/financial-institutions', async (_request, reply) => {
    try {
      const institutions = await wompi.getFinancialInstitutions();
      return reply.send({ success: true, data: institutions });
    } catch (error: any) {
      return reply.status(502).send({ success: false, error: error.message });
    }
  });

  app.get('/wompi/debug', async (_request, reply) => {
    const env = getEnv();
    return reply.send({
      success: true,
      data: {
        hasPublicKey: !!env.WOMPI_PUBLIC_KEY,
        hasPrivateKey: !!env.WOMPI_PRIVATE_KEY,
        hasIntegrityKey: !!env.WOMPI_INTEGRITY_KEY,
        hasEventKey: !!env.WOMPI_EVENT_KEY,
        isLive: env.WOMPI_LIVE,
        baseUrl: wompi.baseUrl(),
        pkPrefix: env.WOMPI_PUBLIC_KEY?.substring(0, 8),
      },
    });
  });

  app.post('/wompi/create', { preHandler: preHandler() }, async (request, reply) => {
    try {
      const user = (request as any).user;
      const body = z.object({
        paymentMethodType: z.enum(['PSE', 'BANCOLOMBIA_TRANSFER', 'NEQUI', 'CARD']),
        financialInstitutionCode: z.string().optional(),
        userType: z.number().optional(),
        userLegalIdType: z.string().optional(),
        userLegalId: z.string().optional(),
        fullName: z.string().optional(),
        phoneNumber: z.string().optional(),
      }).parse(request.body);

      const env = getEnv();
      const cart = await getCart(user.id);
      if (cart.length === 0) {
        return reply.status(400).send({ success: false, error: 'Cart is empty' });
      }

      const total = calcTotal(cart);
      const amountInCents = total;
      const reference = wompi.generateReference();

      const paymentMethod: Record<string, unknown> | undefined =
        body.paymentMethodType === 'CARD'
          ? undefined
          : { type: body.paymentMethodType };
      if (body.paymentMethodType === 'PSE') {
        paymentMethod!.user_type = body.userType ?? 0;
        paymentMethod!.user_legal_id_type = body.userLegalIdType ?? 'CC';
        paymentMethod!.user_legal_id = body.userLegalId ?? '';
        paymentMethod!.financial_institution_code = body.financialInstitutionCode ?? '';
        paymentMethod!.payment_description = `VELORA order ${reference}`;
      } else if (body.paymentMethodType === 'NEQUI') {
        paymentMethod!.phone_number = body.phoneNumber;
        paymentMethod!.user_type = body.userType ?? 0;
        paymentMethod!.user_legal_id_type = body.userLegalIdType ?? 'CC';
        paymentMethod!.user_legal_id = body.userLegalId ?? '';
      } else if (body.paymentMethodType === 'BANCOLOMBIA_TRANSFER') {
        paymentMethod!.user_type = 'PERSON';
        paymentMethod!.user_legal_id_type = body.userLegalIdType ?? 'CC';
        paymentMethod!.user_legal_id = body.userLegalId ?? '';
        paymentMethod!.financial_institution_code = '1001';
        paymentMethod!.payment_description = `VELORA order ${reference}`;
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

      const transaction = await wompi.createTransaction({
        amountInCents,
        reference,
        customerEmail: user.email,
        paymentMethodType: body.paymentMethodType,
        paymentMethod,
        customerData,
        redirectUrl,
      });

      await prisma.order.create({
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
          asyncPaymentUrl: transaction.async_payment_url,
          status: transaction.status,
        },
      });
    } catch (error: any) {
      return reply.status(400).send({ success: false, error: error.message });
    }
  });

  app.get('/wompi/transaction/:id', { preHandler: preHandler() }, async (request, reply) => {
    const { id } = z.object({ id: z.string() }).parse(request.params);
    const transaction = await wompi.getTransaction(id);
    return reply.send({ success: true, data: transaction });
  });

  app.post('/wompi/webhook', async (request: FastifyRequest, reply) => {
    const env = getEnv();
    const signature = request.headers['x-event-signature'] as string;

    const rawBody = (request.body as any)?.rawBody || JSON.stringify(request.body);

    if (!wompi.verifyWebhookSignature(rawBody, signature)) {
      return reply.status(401).send({ success: false, error: 'Invalid signature' });
    }

    const event = request.body as any;
    if (event.event === 'transaction.updated' && event.data?.transaction) {
      const tx = event.data.transaction;
      const payment = await prisma.payment.findFirst({
        where: { transactionId: tx.id, provider: 'wompi' },
      });

      if (payment) {
        if (tx.status === 'APPROVED') {
          await prisma.payment.update({
            where: { id: payment.id },
            data: { status: 'completed' },
          });
          await prisma.order.update({
            where: { id: payment.orderId },
            data: { status: 'confirmed' },
          });
        } else if (['DECLINED', 'ERROR', 'VOIDED'].includes(tx.status)) {
          await prisma.payment.update({
            where: { id: payment.id },
            data: { status: 'failed' },
          });
          await prisma.order.update({
            where: { id: payment.orderId },
            data: { status: 'cancelled' },
          });
        }
      }
    }

    return reply.send({ received: true });
  });
}
