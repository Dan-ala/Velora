import type { OrderStatus } from '@prisma/client';
export declare const orderService: {
    findByUser(userId: string): Promise<({
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
    })[]>;
    findById(id: string): Promise<({
        user: {
            id: string;
            email: string;
        };
        trackingToken: {
            id: string;
            createdAt: Date;
            orderId: string;
            token: string;
            expiresAt: Date | null;
        } | null;
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
    findAll(params: {
        page?: number;
        limit?: number;
        status?: OrderStatus;
    }): Promise<{
        data: ({
            user: {
                id: string;
                email: string;
            };
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
        })[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    create(userId: string): Promise<{
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
    }>;
    updateStatus(id: string, status: OrderStatus, metadata?: Record<string, unknown>): Promise<{
        user: {
            id: string;
            email: string;
        };
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
    }>;
    ship(id: string, data: {
        trackingNumber: string;
        carrier: string;
        estimatedDelivery?: Date;
        shippingAddress?: string;
    }): Promise<{
        user: {
            id: string;
            email: string;
        };
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
    }>;
};
