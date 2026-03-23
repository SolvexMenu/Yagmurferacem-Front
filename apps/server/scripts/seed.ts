// prisma/seed.ts

import prisma from "../src/db";

async function main() {
  console.log("Start seeding...");

  // 1. Clean up the database
  console.log("Deleting old products...");
  // Deleting products will also cascade and delete related variants, sizes, and colors
  // due to the `onDelete: Cascade` in your schema.
  await prisma.product.deleteMany();

  // 2. Create the first product: Basic T-Shirt
  console.log("Creating T-Shirt product...");
  const tshirt = await prisma.product.create({
    data: {
      name: "Basic T-Shirt",
      price: 199,
      description: "Pamuklu, rahat basic tişört.",
      stockCode: "TSHIRT-001",
      available: true,
      imageUrls: ["/images/tshirt_white.jpg", "/images/tshirt_black.jpg"],
      categories: ["giyim", "üst"],
      
      // Define the unique size options for this product
      Size: {
        create: [
          { size: 38, available: true },  // S
          { size: 40, available: true },  // M
          { size: 42, available: false }, // L (option exists but is unavailable)
        ],
      },
      
      // Define the unique color options for this product
      Color: {
        create: [
          { color: "Beyaz", available: true },
          { color: "Siyah", available: true },
        ],
      },
      
      // Create the specific variants (combinations of size and color with stock)
      variants: {
        create: [
          // Beyaz variants
          { size: 38, color: "Beyaz", stock: 25, available: true },
          { size: 40, color: "Beyaz", stock: 15, available: true },
          { size: 42, color: "Beyaz", stock: 0, available: false }, // Size 42 is unavailable
          
          // Siyah variants
          { size: 38, color: "Siyah", stock: 30, available: true },
          { size: 40, color: "Siyah", stock: 0, available: false }, // Out of stock
          { size: 42, color: "Siyah", stock: 0, available: false }, // Size 42 is unavailable
        ],
      },
    },
  });

  // 3. Create the second product: Running Sneakers
  console.log("Creating Sneakers product...");
  const sneakers = await prisma.product.create({
    data: {
      name: "Running Sneakers",
      price: 599,
      description: "Koşu için hafif spor ayakkabı.",
      stockCode: "SNKR-100",
      available: true,
      imageUrls: ["/images/sneaker_red.jpg"],
      categories: ["ayakkabı", "spor"],
      
      // Define the unique size options
      Size: {
        create: [
          { size: 41, available: true },
          { size: 42, available: true },
          { size: 43, available: true },
        ],
      },
      
      // Define the unique color options
      Color: {
        create: [
          { color: "Kırmızı", available: true },
          { color: "Mavi", available: false }, // Mavi option exists but is unavailable
        ],
      },
      
      // Create the specific variants
      variants: {
        create: [
          // Kırmızı variants
          { size: 41, color: "Kırmızı", stock: 10, available: true },
          { size: 42, color: "Kırmızı", stock: 5, available: true },
          { size: 43, color: "Kırmızı", stock: 0, available: false }, // Out of stock
          
          // Mavi variants (all unavailable because the color is unavailable)
          { size: 41, color: "Mavi", stock: 0, available: false },
          { size: 42, color: "Mavi", stock: 0, available: false },
          { size: 43, color: "Mavi", stock: 0, available: false },
        ],
      },
    },
  });

  console.log("Seed tamamlandı!", { tshirt, sneakers });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });