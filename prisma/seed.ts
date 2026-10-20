import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

// Real, freely-licensed shoe photos from Unsplash (hotlinked directly, no API key needed) —
// used purely as visual placeholders for sample/demo products until real product photography
// is uploaded. Rotated across products so the shop doesn't show the same image repeatedly.
const SAMPLE_SHOE_IMAGES = [
  "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&h=800&fit=crop&q=80",
  "https://images.unsplash.com/photo-1549298916-b41d501d3772?w=800&h=800&fit=crop&q=80",
  "https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=800&h=800&fit=crop&q=80",
  "https://images.unsplash.com/photo-1600185365483-26d7a4cc7519?w=800&h=800&fit=crop&q=80",
  "https://images.unsplash.com/photo-1600269452121-4f2416e55c28?w=800&h=800&fit=crop&q=80",
  "https://images.unsplash.com/photo-1491553895911-0055eca6402d?w=800&h=800&fit=crop&q=80",
  "https://images.unsplash.com/photo-1460353581641-37baddab0fa2?w=800&h=800&fit=crop&q=80",
  "https://images.unsplash.com/photo-1465479423260-c4afc24172c6?w=800&h=800&fit=crop&q=80",
  "https://images.unsplash.com/photo-1562183241-b937e95585b6?w=800&h=800&fit=crop&q=80",
  "https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=800&h=800&fit=crop&q=80",
  "https://images.unsplash.com/photo-1600804340584-c7db2eacf0bf?w=800&h=800&fit=crop&q=80",
  "https://images.unsplash.com/photo-1518002171953-a080ee817e1f?w=800&h=800&fit=crop&q=80",
];

async function main() {
  console.log("Seeding Brandora House Studio (development sample data)...");

  // ----- Admin + sample customer -----
  const adminPasswordHash = await bcrypt.hash("Admin@12345", 12);
  await prisma.user.upsert({
    where: { email: "admin@brandorahousestudio.com" },
    create: {
      email: "admin@brandorahousestudio.com",
      name: "Brandora Admin",
      passwordHash: adminPasswordHash,
      role: "ADMIN",
    },
    update: {},
  });

  const customerPasswordHash = await bcrypt.hash("Customer@12345", 12);
  await prisma.user.upsert({
    where: { email: "customer@example.com" },
    create: {
      email: "customer@example.com",
      name: "Sample Customer",
      passwordHash: customerPasswordHash,
      role: "CUSTOMER",
    },
    update: {},
  });

  // ----- Brands -----
  const brandDefs = [
    { name: "Campus", slug: "campus", description: "Sample Campus catalog entries for development." },
    { name: "Nike", slug: "nike", description: "Sample Nike catalog entries for development." },
    { name: "Aqualite", slug: "aqualite", description: "Sample Aqualite catalog entries for development." },
    { name: "Action Shoes", slug: "action-shoes", description: "Sample Action Shoes catalog entries for development." },
  ];

  const brands = await Promise.all(
    brandDefs.map((b) => prisma.brand.upsert({ where: { slug: b.slug }, create: b, update: {} }))
  );

  // ----- Categories -----
  const categoryDefs = [
    { name: "Running", slug: "running" },
    { name: "Casual", slug: "casual" },
    { name: "Formal", slug: "formal" },
    { name: "Sports", slug: "sports" },
  ];

  const categories = await Promise.all(
    categoryDefs.map((c) => prisma.category.upsert({ where: { slug: c.slug }, create: c, update: {} }))
  );

  // ----- Shipping rules -----
  const existingRules = await prisma.shippingRule.count();
  if (existingRules === 0) {
    await prisma.shippingRule.createMany({
      data: [
        { name: "Free Shipping", minOrderValue: 2000, maxOrderValue: null, charge: 0, estimatedDays: 5 },
        { name: "Standard Shipping", minOrderValue: 0, maxOrderValue: 1999.99, charge: 99, estimatedDays: 6 },
      ],
    });
  }

  // ----- Sample products (clearly marked [SAMPLE]) -----
  const sizes = ["UK 6", "UK 7", "UK 8", "UK 9", "UK 10"];
  const colors = ["Black", "White", "Navy"];

  let productIndex = 0;
  for (const brand of brands) {
    for (let i = 0; i < 3; i++) {
      productIndex += 1;
      const category = categories[productIndex % categories.length];
      const name = `[SAMPLE] ${brand.name} Street Runner ${i + 1}`;
      const slug = `sample-${brand.slug}-street-runner-${i + 1}`;

      const existing = await prisma.product.findUnique({ where: { slug } });
      if (existing) continue;

      await prisma.product.create({
        data: {
          name,
          slug,
          description: `Development sample product for ${brand.name}. Not a real listing — replace before launch.`,
          brandId: brand.id,
          categoryId: category.id,
          basePrice: 1499 + productIndex * 150,
          discountPct: productIndex % 3 === 0 ? 15 : 0,
          isFeatured: productIndex % 4 === 0,
          isNewArrival: productIndex % 3 === 0,
          isBestSeller: productIndex % 5 === 0,
          avgRating: 4.2,
          ratingCount: 10 + productIndex,
          images: {
            create: [
              {
                url: SAMPLE_SHOE_IMAGES[(productIndex - 1) % SAMPLE_SHOE_IMAGES.length],
                altText: name,
                position: 0,
              },
            ],
          },
          variants: {
            create: sizes.flatMap((size, sizeIdx) =>
              colors.map((color, colorIdx) => ({
                size,
                color,
                sku: `${brand.slug.toUpperCase()}-${productIndex}-${sizeIdx}-${colorIdx}`,
                stock: (sizeIdx + colorIdx) % 2 === 0 ? 12 : 3,
              }))
            ),
          },
        },
      });
    }
  }

  console.log("Seed complete.");
  console.log("Admin login: admin@brandorahousestudio.com / Admin@12345");
  console.log("Customer login: customer@example.com / Customer@12345");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
