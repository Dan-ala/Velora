import type { FastifyInstance } from 'fastify';
import crypto from 'crypto';
import { z } from 'zod';
import { getEnv } from '../env';
import { prisma } from '../lib/prisma';
import { preHandler } from '../middleware/auth';

const BASE_URL_SANDBOX = 'https://sandbox.wompi.co/v1';
const BASE_URL_PRODUCTION = 'https://production.wompi.co/v1';

function apiBaseUrl() {
  return getEnv().WOMPI_LIVE ? BASE_URL_PRODUCTION : BASE_URL_SANDBOX;
}

function authHeaders() {
  const env = getEnv();
  return {
    Authorization: `Bearer ${env.WOMPI_PRIVATE_KEY}`,
    'Content-Type': 'application/json',
  };
}

function generateIntegritySignature(
  amountInCents: number,
  reference: string,
  currency: string,
): string {
  const env = getEnv();
  const hash = crypto.createHash('sha256');
  hash.update(`${reference}${amountInCents}${currency}${env.WOMPI_INTEGRITY_KEY}`);
  return hash.digest('hex');
}

function verifyWebhookEvent(event: Record<string, any>): boolean {
  const env = getEnv();
  const { signature, timestamp } = event;
  if (!signature?.properties || !signature?.checksum || !timestamp) return false;
  if (!env.WOMPI_EVENT_KEY) return false;

  const tx = event.data?.transaction;
  if (!tx) return false;

  const values = signature.properties.map((prop: string) => String(tx[prop] ?? ''));
  const payload = values.join('') + String(timestamp) + env.WOMPI_EVENT_KEY;
  const hash = crypto.createHash('sha256').update(payload).digest('hex');

  try {
    return crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(signature.checksum));
  } catch {
    return false;
  }
}

export async function wompiRoutes(app: FastifyInstance) {
  app.post('/signature', { preHandler: preHandler() }, async (request, reply) => {
    try {
      const body = z.object({
        orderId: z.string(),
        amountInCents: z.number().positive(),
        currency: z.string().default('COP'),
      }).parse(request.body);

      const reference = `VELORA-${body.orderId}-${Date.now()}`;

      const signature = generateIntegritySignature(
        body.amountInCents,
        reference,
        body.currency,
      );

      await prisma.order.update({
        where: { id: body.orderId },
        data: { reference },
      });

      return reply.send({
        success: true,
        data: { reference, signature },
      });
    } catch (error: any) {
      return reply.status(400).send({ success: false, error: error.message });
    }
  });

  app.post('/webhook', async (request, reply) => {
    try {
      const event = request.body as Record<string, any>;

      if (!verifyWebhookEvent(event)) {
        return reply.status(401).send({ success: false, error: 'Invalid signature' });
      }

      if (event.event === 'transaction.updated' && event.data?.transaction) {
        const tx = event.data.transaction;

        const order = await prisma.order.findFirst({
          where: { reference: tx.reference },
        });

        if (order) {
          await prisma.order.update({
            where: { id: order.id },
            data: {
              wompiTxId: tx.id,
              paymentStatus: tx.status,
              paymentMethod: tx.payment_method_type,
              status: tx.status === 'APPROVED' ? 'confirmed' : tx.status === 'DECLINED' ? 'cancelled' : undefined,
            },
          });
        }
      }

      return reply.send({ received: true });
    } catch (error: any) {
      return reply.status(500).send({ success: false, error: error.message });
    }
  });

  app.get('/transaction/:id', async (request, reply) => {
    try {
      const { id } = z.object({ id: z.string() }).parse(request.params);

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
    } catch (error: any) {
      return reply.status(500).send({ success: false, error: error.message });
    }
  });
}
