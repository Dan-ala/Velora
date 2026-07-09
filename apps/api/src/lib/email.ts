import { Resend } from 'resend';
import { getEnv } from '../env';

let resendClient: Resend | null = null;

function getResend(): Resend | null {
  const env = getEnv();
  if (!env.RESEND_API_KEY) return null;
  if (!resendClient) {
    resendClient = new Resend(env.RESEND_API_KEY);
  }
  return resendClient;
}

interface OrderItemData {
  quantity: number;
  price: number;
  product: { name: string };
}

interface OrderData {
  id: string;
  reference: string | null;
  total: number;
  items: OrderItemData[];
  trackingUrl?: string | null;
}

export async function sendOrderConfirmation(
  email: string,
  order: OrderData,
): Promise<void> {
  const env = getEnv();
  const client = getResend();
  if (!client) return;

  const itemsHtml = order.items
    .map(
      (item) => `
    <tr>
      <td style="padding:12px;border-bottom:1px solid #e5e7eb">${item.product.name}</td>
      <td style="padding:12px;border-bottom:1px solid #e5e7eb;text-align:center">${item.quantity}</td>
      <td style="padding:12px;border-bottom:1px solid #e5e7eb;text-align:right">$${(item.price * item.quantity).toLocaleString('es-CO')}</td>
    </tr>`,
    )
    .join('');

  const trackingLink = order.trackingUrl
    ? `<a href="${order.trackingUrl}" style="display:inline-block;background:#000;color:#fff;padding:12px 24px;border-radius:999px;text-decoration:none;font-size:14px;font-weight:600;margin:8px 0">Seguir mi pedido</a>`
    : '';

  await client.emails.send({
    from: env.RESEND_FROM_EMAIL,
    to: email,
    subject: 'Tu pedido en Velora ha sido confirmado',
    html: `
      <div style="font-family:system-ui,sans-serif;max-width:560px;margin:0 auto;padding:24px">
        <h1 style="font-size:24px;margin:0 0 8px">Gracias por tu compra!</h1>
        <p style="color:#6b7280;margin:0 0 24px">Tu pedido ha sido confirmado exitosamente.</p>
        <p><strong>Pedido:</strong> ${order.reference || order.id}</p>
        <table style="width:100%;border-collapse:collapse;margin:16px 0">
          <thead>
            <tr style="background:#f9fafb">
              <th style="padding:12px;text-align:left;font-size:12px;text-transform:uppercase;letter-spacing:0.05em">Producto</th>
              <th style="padding:12px;text-align:center;font-size:12px;text-transform:uppercase;letter-spacing:0.05em">Cant.</th>
              <th style="padding:12px;text-align:right;font-size:12px;text-transform:uppercase;letter-spacing:0.05em">Total</th>
            </tr>
          </thead>
          <tbody>${itemsHtml}</tbody>
        </table>
        <p style="font-size:18px;font-weight:bold;text-align:right;margin-top:16px">Total: $${order.total.toLocaleString('es-CO')}</p>
        ${trackingLink}
        <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0" />
        <p style="color:#6b7280;font-size:14px">
          Recibiras un correo cuando tu pedido sea despachado.<br />
          Si tienes dudas, responde a este correo o contactanos en <a href="https://velora.co">velora.co</a>.
        </p>
      </div>
    `,
  });
}

export async function sendOrderShipped(
  email: string,
  order: {
    id: string;
    reference: string | null;
    trackingNumber: string | null;
    carrier: string | null;
    estimatedDelivery: Date | null;
    items: Array<{ quantity: number; price: number; product: { name: string } }>;
    total: number;
  },
): Promise<void> {
  const env = getEnv();
  const client = getResend();
  if (!client) return;

  const itemsHtml = order.items
    .map(
      (item) => `
    <tr>
      <td style="padding:12px;border-bottom:1px solid #e5e7eb">${item.product.name}</td>
      <td style="padding:12px;border-bottom:1px solid #e5e7eb;text-align:center">${item.quantity}</td>
      <td style="padding:12px;border-bottom:1px solid #e5e7eb;text-align:right">$${(item.price * item.quantity).toLocaleString('es-CO')}</td>
    </tr>`,
    )
    .join('');

  const deliveryDate = order.estimatedDelivery
    ? new Intl.DateTimeFormat('es-CO', {
        dateStyle: 'long',
        timeStyle: 'short',
      }).format(new Date(order.estimatedDelivery))
    : 'Proximamente';

  await client.emails.send({
    from: env.RESEND_FROM_EMAIL,
    to: email,
    subject: 'Tu pedido en Velora esta en camino!',
    html: `
      <div style="font-family:system-ui,sans-serif;max-width:560px;margin:0 auto;padding:24px">
        <h1 style="font-size:24px;margin:0 0 8px">Tu pedido esta en camino! \u{1F680}</h1>
        <p style="color:#6b7280;margin:0 0 24px">Hemos despachado tu pedido <strong>${order.reference || order.id}</strong>.</p>

        <div style="background:#f9fafb;border-radius:12px;padding:16px;margin:16px 0">
          <p style="margin:0 0 8px"><strong>Transportadora:</strong> ${order.carrier || 'Por definir'}</p>
          <p style="margin:0 0 8px"><strong>Numero de guia:</strong> ${order.trackingNumber || 'Pendiente'}</p>
          <p style="margin:0"><strong>Fecha estimada de entrega:</strong> ${deliveryDate}</p>
        </div>

        <table style="width:100%;border-collapse:collapse;margin:16px 0">
          <thead>
            <tr style="background:#f9fafb">
              <th style="padding:12px;text-align:left;font-size:12px;text-transform:uppercase;letter-spacing:0.05em">Producto</th>
              <th style="padding:12px;text-align:center;font-size:12px;text-transform:uppercase;letter-spacing:0.05em">Cant.</th>
              <th style="padding:12px;text-align:right;font-size:12px;text-transform:uppercase;letter-spacing:0.05em">Total</th>
            </tr>
          </thead>
          <tbody>${itemsHtml}</tbody>
        </table>

        <p style="font-size:18px;font-weight:bold;text-align:right;margin-top:16px">Total: $${order.total.toLocaleString('es-CO')}</p>

        <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0" />
        <p style="color:#6b7280;font-size:14px">
          Puedes hacer seguimiento de tu pedido en tu <a href="${env.FRONTEND_URL.split(',')[0]}/orders/${order.id}">pagina de seguimiento</a>.<br />
          Si tienes dudas, responde a este correo o contactanos en <a href="https://velora.co">velora.co</a>.
        </p>
      </div>
    `,
  });
}

export async function sendOrderDelivered(
  email: string,
  order: {
    id: string;
    reference: string | null;
    items: Array<{ quantity: number; price: number; product: { name: string } }>;
    total: number;
    trackingUrl?: string | null;
  },
): Promise<void> {
  const env = getEnv();
  const client = getResend();
  if (!client) return;

  await client.emails.send({
    from: env.RESEND_FROM_EMAIL,
    to: email,
    subject: 'Tu pedido en Velora ha sido entregado!',
    html: `
      <div style="font-family:system-ui,sans-serif;max-width:560px;margin:0 auto;padding:24px">
        <h1 style="font-size:24px;margin:0 0 8px">Pedido entregado! \u{1F389}</h1>
        <p style="color:#6b7280;margin:0 0 24px">Tu pedido <strong>${order.reference || order.id}</strong> ha sido entregado exitosamente.</p>
        <p>Esperamos que disfrutes tus productos Velora. Si tienes alguna novedad, respondenos a este correo.</p>
        ${order.trackingUrl ? `<p style="margin-top:16px"><a href="${order.trackingUrl}" style="color:#000;text-decoration:underline">Ver detalle del pedido</a></p>` : ''}
        <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0" />
        <p style="color:#6b7280;font-size:14px">
          Gracias por confiar en Velora.<br />
          <a href="https://velora.co" style="color:#000">velora.co</a>
        </p>
      </div>
    `,
  });
}

export async function sendOrderFailed(
  email: string,
  order: { id: string; reference: string | null },
): Promise<void> {
  const env = getEnv();
  const client = getResend();
  if (!client) return;

  await client.emails.send({
    from: env.RESEND_FROM_EMAIL,
    to: email,
    subject: 'Tu pago en Velora no pudo ser procesado',
    html: `
      <div style="font-family:system-ui,sans-serif;max-width:560px;margin:0 auto;padding:24px">
        <h1 style="font-size:24px;margin:0 0 8px">Pago no procesado</h1>
        <p style="color:#6b7280;margin:0 0 24px">
          El pago de tu pedido <strong>${order.reference || order.id}</strong> no pudo ser completado.
        </p>
        <p>Puedes intentar nuevamente desde tu carrito de compras o contactarnos si necesitas ayuda.</p>
        <p style="color:#6b7280;font-size:14px">
          Si el cargo aparece en tu cuenta, sera reembolsado automaticamente segun las politicas de tu banco.
        </p>
      </div>
    `,
  });
}
