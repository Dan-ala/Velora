"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.productService = void 0;
const prisma_1 = require("../lib/prisma");
exports.productService = {
    async findAll(params) {
        const page = params.page || 1;
        const limit = params.limit || 12;
        const skip = (page - 1) * limit;
        const where = {};
        if (params.category)
            where.category = params.category;
        if (params.search) {
            where.OR = [
                { name: { contains: params.search, mode: 'insensitive' } },
                { description: { contains: params.search, mode: 'insensitive' } },
            ];
        }
        const [products, total] = await Promise.all([
            prisma_1.prisma.product.findMany({
                where,
                include: { images: { orderBy: { position: 'asc' } } },
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
            }),
            prisma_1.prisma.product.count({ where }),
        ]);
        return {
            data: products,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        };
    },
    async findById(id) {
        return prisma_1.prisma.product.findUnique({
            where: { id },
            include: { images: { orderBy: { position: 'asc' } } },
        });
    },
    async findByCategory(category) {
        return prisma_1.prisma.product.findMany({
            where: { category },
            include: { images: { orderBy: { position: 'asc' } } },
            orderBy: { createdAt: 'desc' },
        });
    },
    async getFeatured() {
        return prisma_1.prisma.product.findMany({
            take: 8,
            include: { images: { orderBy: { position: 'asc' } } },
            orderBy: { createdAt: 'desc' },
        });
    },
    async create(data) {
        const existing = await prisma_1.prisma.product.findUnique({ where: { name: data.name } });
        if (existing) {
            throw new Error(`A product with the name "${data.name}" already exists`);
        }
        return prisma_1.prisma.product.create({
            data,
            include: { images: true },
        });
    },
    async update(id, data) {
        if (data.name) {
            const existing = await prisma_1.prisma.product.findUnique({ where: { name: data.name } });
            if (existing && existing.id !== id) {
                throw new Error(`A product with the name "${data.name}" already exists`);
            }
        }
        return prisma_1.prisma.product.update({
            where: { id },
            data,
            include: { images: true },
        });
    },
    async delete(id) {
        await prisma_1.prisma.orderItem.deleteMany({ where: { productId: id } });
        return prisma_1.prisma.product.delete({ where: { id } });
    },
    async addImage(productId, url, publicId, position) {
        if (position !== undefined) {
            await prisma_1.prisma.productImage.updateMany({
                where: { productId, position: { gte: position } },
                data: { position: { increment: 1 } },
            });
        }
        else {
            const maxPos = await prisma_1.prisma.productImage.findFirst({
                where: { productId },
                orderBy: { position: 'desc' },
                select: { position: true },
            });
            position = (maxPos?.position ?? -1) + 1;
        }
        return prisma_1.prisma.productImage.create({
            data: { productId, url, publicId, position },
        });
    },
    async removeImage(id) {
        return prisma_1.prisma.productImage.delete({ where: { id } });
    },
};
//# sourceMappingURL=product.service.js.map