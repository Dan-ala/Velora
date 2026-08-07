export interface ShipmentParams {
    orderId: string;
    reference: string | null;
    items: Array<{
        product: {
            name: string;
        };
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
        events: Array<{
            date: string;
            description: string;
            location?: string;
        }>;
        estimatedDelivery?: string;
    }>;
    cancelShipment(guideNumber: string): Promise<boolean>;
    getRates(destination: string, weight: number): Promise<Array<{
        service: string;
        cost: number;
        estimatedDays: string;
    }>>;
}
export declare const shippingService: {
    createShipment(order: {
        id: string;
        reference: string | null;
        items: Array<{
            product: {
                name: string;
            };
            quantity: number;
            price: number;
        }>;
        user: {
            email: string;
        };
        shippingAddress?: string | null;
        shippingCity?: string | null;
    }, providerName: "interrapidisimo" | "coordinadora" | "servientrega" | "envia"): Promise<ShipmentResult & {
        id: string;
    }>;
    getTracking(orderId: string): Promise<{
        status: string;
        events: Array<{
            date: string;
            description: string;
            location?: string;
        }>;
        estimatedDelivery?: string;
    } | null>;
    getProviderList(): Promise<{
        id: string;
        name: string;
        active: boolean;
    }[]>;
};
