import { prisma } from '../lib/prisma';

export interface ShipmentParams {
  orderId: string;
  reference: string | null;
  items: Array<{
    product: { name: string };
    quantity: number;
    price: number;
  }>;
  userEmail: string;
  destinationAddress?: string | null;
  destinationCity?: string | null;
}

export interface ShipmentResult {
  guideNumber: string;
  trackingUrl: string | null;
  labelUrl: string | null;
  barcodeUrl: string | null;
  cost: number;
}

export interface IShippingProvider {
  createShipment(params: ShipmentParams): Promise<ShipmentResult>;
  getTracking(guideNumber: string): Promise<{
    status: string;
    events: Array<{ date: string; description: string; location?: string }>;
    estimatedDelivery?: string;
  }>;
  cancelShipment(guideNumber: string): Promise<boolean>;
  getRates(destination: string, weight: number): Promise<Array<{ service: string; cost: number; estimatedDays: string }>>;
}

async function getProvider(providerName: string): Promise<IShippingProvider> {
  switch (providerName) {
    case 'interrapidisimo':
      const { InterrapidisimoProvider } = await import('../shipping/interrapidisimo.provider');
      return new InterrapidisimoProvider();
    default:
      throw new Error(`Unknown shipping provider: ${providerName}`);
  }
}

export const shippingService = {
  async createShipment(
    order: {
      id: string;
      reference: string | null;
      items: Array<{ product: { name: string }; quantity: number; price: number }>;
      user: { email: string };
      shippingAddress?: string | null;
      shippingCity?: string | null;
    },
    providerName: 'interrapidisimo' | 'coordinadora' | 'servientrega' | 'envia',
  ): Promise<ShipmentResult & { id: string }> {
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

    const guide = await prisma.shippingGuide.create({
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

    await prisma.order.update({
      where: { id: order.id },
      data: {
        trackingNumber: result.guideNumber,
        carrier: providerName,
        shippingStatus: 'guide_generated',
      },
    });

    return { ...result, id: guide.id };
  },

  async getTracking(
    orderId: string,
  ): Promise<{ status: string; events: Array<{ date: string; description: string; location?: string }>; estimatedDelivery?: string } | null> {
    const guide = await prisma.shippingGuide.findFirst({
      where: { orderId, status: 'active' },
      orderBy: { createdAt: 'desc' },
    });

    if (!guide) return null;

    try {
      const provider = await getProvider(guide.provider);
      return provider.getTracking(guide.guideNumber);
    } catch {
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
