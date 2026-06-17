import { prisma } from '../lib/prisma';

export const productService = {
  async findAll(params: { page?: number; limit?: number; category?: string; search?: string }) {
    const page = params.page || 1;
    const limit = params.limit || 12;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (params.category) where.category = params.category;
    if (params.search) {
      where.OR = [
        { name: { contains: params.search, mode: 'insensitive' } },
        { description: { contains: params.search, mode: 'insensitive' } },
      ];
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: { images: { orderBy: { position: 'asc' } } },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.product.count({ where }),
    ]);

    return {
      data: products,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  },

  async findById(id: string) {
    return prisma.product.findUnique({
      where: { id },
      include: { images: { orderBy: { position: 'asc' } } },
    });
  },

  async findByCategory(category: string) {
    return prisma.product.findMany({
      where: { category },
      include: { images: { orderBy: { position: 'asc' } } },
      orderBy: { createdAt: 'desc' },
    });
  },

  async getFeatured() {
    return prisma.product.findMany({
      take: 8,
      include: { images: { orderBy: { position: 'asc' } } },
      orderBy: { createdAt: 'desc' },
    });
  },

  async create(data: {
    name: string;
    description: string;
    price: number;
    category: string;
    stock: number;
  }) {
    return prisma.product.create({
      data,
      include: { images: true },
    });
  },

  async update(
    id: string,
    data: { name?: string; description?: string; price?: number; category?: string; stock?: number },
  ) {
    return prisma.product.update({
      where: { id },
      data,
      include: { images: true },
    });
  },

  async delete(id: string) {
    await prisma.orderItem.deleteMany({ where: { productId: id } });
    return prisma.product.delete({ where: { id } });
  },

  async addImage(productId: string, url: string, publicId: string, position?: number) {
    const maxPos = await prisma.productImage.findFirst({
      where: { productId },
      orderBy: { position: 'desc' },
      select: { position: true },
    });

    return prisma.productImage.create({
      data: {
        productId,
        url,
        publicId,
        position: position ?? (maxPos?.position ?? -1) + 1,
      },
    });
  },

  async removeImage(id: string) {
    return prisma.productImage.delete({ where: { id } });
  },
};
