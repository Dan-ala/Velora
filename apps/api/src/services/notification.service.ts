import { prisma } from '../lib/prisma';

export interface NotificationParams {
  orderId: string;
  event: 'order_created' | 'payment_confirmed' | 'preparing' | 'packed' | 'guide_generated' | 'handed_to_carrier' | 'in_transit' | 'out_for_delivery' | 'delivered' | 'cancelled' | 'returned';
  recipientEmail?: string;
  recipientPhone?: string;
  metadata?: Record<string, unknown>;
}

export interface INotificationChannel {
  send(params: {
    recipient: string;
    subject: string;
    content: string;
    html?: string;
    attachments?: Array<{ filename: string; url: string }>;
  }): Promise<{ success: boolean; messageId?: string; error?: string }>;
}

async function logNotification(params: {
  orderId: string;
  channel: 'email' | 'whatsapp' | 'sms' | 'push';
  event: string;
  status: string;
  recipient: string;
  metadata?: Record<string, unknown>;
}) {
  try {
    await prisma.notificationLog.create({
      data: {
        orderId: params.orderId,
        channel: params.channel as any,
        event: params.event as any,
        status: params.status,
        recipient: params.recipient,
        metadata: (params.metadata ?? {}) as any,
      },
    });
  } catch {
    // non-critical
  }
}

export const notificationService = {
  async sendEmail(params: NotificationParams): Promise<void> {
    const { sendOrderConfirmation, sendOrderShipped, sendOrderFailed } = await import('../lib/email');

    try {
      const order = await prisma.order.findUnique({
        where: { id: params.orderId },
        include: {
          items: { include: { product: true } },
          trackingToken: true,
        },
      });

      if (!order || !params.recipientEmail) return;

      const trackingUrl = order.trackingToken
        ? `${((await import('../env')).getEnv()).FRONTEND_URL.split(',')[0]}/tracking/${order.trackingToken.token}`
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
          const { sendOrderDelivered } = await import('../lib/email');
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
    } catch (error: any) {
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

  async sendWhatsApp(params: NotificationParams): Promise<void> {
    const env = (await import('../env')).getEnv();
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

    const trackingService = (await import('./tracking.service')).trackingService;
    const trackingUrl = await trackingService.getTrackingUrl(params.orderId);

    const eventMessages: Record<string, { subject: string; content: string }> = {
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
        const res = await fetch(
          `https://graph.facebook.com/v21.0/${phoneNumber}/messages`,
          {
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
          },
        );

        const data = await res.json();
        const success = res.ok;

        await logNotification({
          orderId: params.orderId,
          channel: 'whatsapp',
          event: params.event,
          status: success ? 'sent' : 'failed',
          recipient: params.recipientPhone,
          metadata: { provider, messageId: data?.messages?.[0]?.id, ...(success ? {} : { error: data }) } as any,
        });
      }
    } catch (error: any) {
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

  async notifyOrderEvent(params: NotificationParams): Promise<void> {
    await Promise.all([
      this.sendEmail(params),
      params.recipientPhone ? this.sendWhatsApp(params) : Promise.resolve(),
    ]);
  },
};
