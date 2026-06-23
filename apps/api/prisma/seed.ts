import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding VELORA database...');

  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@velora.com' },
    update: {},
    create: {
      email: 'admin@velora.com',
      role: 'admin',
    },
  });

  console.log('Admin user:', adminUser.email);

  const products = [
    {
      name: 'Urban Black Oversized Shirt',
      description:
        'A modern oversized silhouette crafted from premium cotton. Features a relaxed fit, dropped shoulders, and a subtle VELORA logo embroidered at the hem.',
      price: 89900,
      category: 'camisetas',
      stock: 50,
      images: [
        { url: 'https://res.cloudinary.com/dvjfilxjp/image/upload/q_auto,f_auto/v1/velora/urban-black-shirt-1', publicId: 'velora/urban-black-shirt-1', position: 0 },
        { url: 'https://res.cloudinary.com/dvjfilxjp/image/upload/q_auto,f_auto/v1/velora/urban-black-shirt-2', publicId: 'velora/urban-black-shirt-2', position: 1 },
      ],
    },
    {
      name: 'Essential Beige Hoodie',
      description:
        'Your everyday essential redefined. This heavyweight French terry hoodie offers warmth without bulk. Ribbed cuffs, kangaroo pocket, clean finish.',
      price: 159900,
      category: 'buzos',
      stock: 35,
      images: [
        { url: 'https://res.cloudinary.com/dvjfilxjp/image/upload/q_auto,f_auto/v1/velora/beige-hoodie-1', publicId: 'velora/beige-hoodie-1', position: 0 },
        { url: 'https://res.cloudinary.com/dvjfilxjp/image/upload/q_auto,f_auto/v1/velora/beige-hoodie-2', publicId: 'velora/beige-hoodie-2', position: 1 },
      ],
    },
    {
      name: 'Classic White Sneakers',
      description:
        'Minimalist leather sneakers built for the modern wardrobe. Clean lines, premium leather upper, cushioned sole for all-day comfort.',
      price: 199900,
      category: 'zapatos',
      stock: 25,
      images: [
        { url: 'https://res.cloudinary.com/dvjfilxjp/image/upload/q_auto,f_auto/v1/velora/white-sneakers-1', publicId: 'velora/white-sneakers-1', position: 0 },
        { url: 'https://res.cloudinary.com/dvjfilxjp/image/upload/q_auto,f_auto/v1/velora/white-sneakers-2', publicId: 'velora/white-sneakers-2', position: 1 },
      ],
    },
  ];

  for (const product of products) {
    const { images, ...data } = product;
    const created = await prisma.product.create({ data });

    for (const img of images) {
      await prisma.productImage.create({
        data: { productId: created.id, ...img },
      });
    }

    console.log(`Created: ${created.name}`);
  }

  console.log('Seed complete!');
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
