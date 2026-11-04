import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding Boutique Base Configuration for SQL Server...");

  // 1. Create Boutique Categories
  const categoriesData = [
    { name: "Dresses", description: "Boutique dresses and gowns" },
    { name: "Tops & Blouses", description: "Shirts, blouses, and knit tops" },
    { name: "Pants & Skirts", description: "Trousers, denim, and skirts" },
    { name: "Accessories", description: "Bags, scarves, and jewelry" },
    { name: "Shoes", description: "Boutique footwear and heels" },
  ];

  for (const cat of categoriesData) {
    await prisma.category.upsert({
      where: { name: cat.name },
      update: {},
      create: cat,
    });
  }
  console.log("Boutique categories verified.");

  // 2. Create Default Shop Settings
  const settings = [
    { key: "SHOP_NAME", value: "Elegance Boutique" },
    { key: "SHOP_PHONE", value: "+1 234 567 890" },
    { key: "SHOP_ADDRESS", value: "100 Fashion Blvd, Suite 4B" },
    { key: "CURRENCY", value: "$" },
    { key: "RECEIPT_FOOTER", value: "Thank you for shopping at Elegance Boutique! Goods once sold cannot be returned without receipt." },
    { key: "BUSINESS_TYPE", value: "BOUTIQUE" },
  ];

  for (const s of settings) {
    await prisma.setting.upsert({
      where: { key: s.key },
      update: { value: s.value },
      create: s,
    });
  }
  console.log("Shop settings verified.");

  console.log("Seed complete. No default credentials exist — all accounts must be created through the /register screen.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
