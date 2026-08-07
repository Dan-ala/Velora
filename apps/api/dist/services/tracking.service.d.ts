export declare const trackingService: {
    generateToken(orderId: string): Promise<string>;
    getOrderByToken(token: string): Promise<({
        items: ({
            product: {
                images: {
                    id: string;
                    productId: string;
                    position: number;
                    url: string;
                    publicId: string;
                }[];
            } & {
                name: string;
                id: string;
                createdAt: Date;
                description: string;
                price: number;
                category: string;
                stock: number;
            };
        } & {
            id: string;
            productId: string;
            quantity: number;
            orderId: string;
            price: number;
        })[];
        payments: {
            status: import("@prisma/client").$Enums.PaymentStatus;
            id: string;
            reference: string | null;
            orderId: string;
            provider: import("@prisma/client").$Enums.PaymentProvider;
            transactionId: string | null;
        }[];
        timeline: {
            id: string;
            createdAt: Date;
            orderId: string;
            event: import("@prisma/client").$Enums.OrderEvent;
            metadata: import("@prisma/client/runtime/library").JsonValue | null;
        }[];
        guides: {
            status: string;
            id: string;
            createdAt: Date;
            orderId: string;
            provider: string;
            guideNumber: string;
            trackingUrl: string | null;
            labelUrl: string | null;
            barcodeUrl: string | null;
            cost: number | null;
        }[];
    } & {
        status: import("@prisma/client").$Enums.OrderStatus;
        id: string;
        createdAt: Date;
        userId: string;
        total: number;
        shippingCost: number | null;
        reference: string | null;
        paymentStatus: string | null;
        paymentMethod: string | null;
        wompiTxId: string | null;
        phoneNumber: string | null;
        trackingNumber: string | null;
        carrier: string | null;
        shippingStatus: string | null;
        shippingAddress: string | null;
        shippingCity: string | null;
        estimatedDelivery: Date | null;
    }) | null>;
    getTrackingUrl(orderId: string): Promise<string | null>;
};
