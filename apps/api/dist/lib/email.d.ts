interface OrderItemData {
    quantity: number;
    price: number;
    product: {
        name: string;
    };
}
interface OrderData {
    id: string;
    reference: string | null;
    total: number;
    items: OrderItemData[];
    trackingUrl?: string | null;
}
export declare function sendOrderConfirmation(email: string, order: OrderData): Promise<void>;
export declare function sendOrderShipped(email: string, order: {
    id: string;
    reference: string | null;
    trackingNumber: string | null;
    carrier: string | null;
    estimatedDelivery: Date | null;
    items: Array<{
        quantity: number;
        price: number;
        product: {
            name: string;
        };
    }>;
    total: number;
}): Promise<void>;
export declare function sendOrderDelivered(email: string, order: {
    id: string;
    reference: string | null;
    items: Array<{
        quantity: number;
        price: number;
        product: {
            name: string;
        };
    }>;
    total: number;
    trackingUrl?: string | null;
}): Promise<void>;
export declare function sendOrderFailed(email: string, order: {
    id: string;
    reference: string | null;
}): Promise<void>;
export {};
