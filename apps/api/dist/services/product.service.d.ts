export declare const productService: {
    findAll(params: {
        page?: number;
        limit?: number;
        category?: string;
        search?: string;
    }): Promise<{
        data: ({
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
        })[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    findById(id: string): Promise<({
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
    }) | null>;
    findByCategory(category: string): Promise<({
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
    })[]>;
    getFeatured(): Promise<({
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
    })[]>;
    create(data: {
        name: string;
        description: string;
        price: number;
        category: string;
        stock: number;
    }): Promise<{
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
    }>;
    update(id: string, data: {
        name?: string;
        description?: string;
        price?: number;
        category?: string;
        stock?: number;
    }): Promise<{
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
    }>;
    delete(id: string): Promise<{
        name: string;
        id: string;
        createdAt: Date;
        description: string;
        price: number;
        category: string;
        stock: number;
    }>;
    addImage(productId: string, url: string, publicId: string, position?: number): Promise<{
        id: string;
        productId: string;
        position: number;
        url: string;
        publicId: string;
    }>;
    removeImage(id: string): Promise<{
        id: string;
        productId: string;
        position: number;
        url: string;
        publicId: string;
    }>;
};
