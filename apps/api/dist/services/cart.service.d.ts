export declare const cartService: {
    findByUser(userId: string): Promise<{
        id: string;
        userId: string;
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
            userId: string;
            productId: string;
            quantity: number;
        })[];
        total: number;
    }>;
    addItem(userId: string, productId: string, quantity?: number): Promise<{
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
        userId: string;
        productId: string;
        quantity: number;
    }>;
    updateItemQuantity(id: string, quantity: number): Promise<{
        id: string;
        userId: string;
        productId: string;
        quantity: number;
    }>;
    removeItem(id: string): Promise<{
        id: string;
        userId: string;
        productId: string;
        quantity: number;
    }>;
    clearCart(userId: string): Promise<import("@prisma/client").Prisma.BatchPayload>;
    syncItems(userId: string, items: {
        productId: string;
        quantity: number;
    }[]): Promise<{
        id: string;
        userId: string;
        productId: string;
        quantity: number;
    }[]>;
    getItemCount(userId: string): Promise<number>;
};
