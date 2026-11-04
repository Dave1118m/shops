import { PrismaClient, Role, UserStatus } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding Boutique Database for SQL Server...");

  // 1. Create Default Owner User
  const ownerPassword = await bcrypt.hash("owner123", 10);
  const owner = await prisma.user.upsert({
    where: { username: "owner" },
    update: {},
    create: {
      name: "Shop Owner",
      username: "owner",
      passwordHash: ownerPassword,
      role: Role.OWNER,
      status: UserStatus.ACTIVE,
    },
  });
  console.log("Created Owner:", owner.username);

  // 2. Create Sample Seller User
  const sellerPassword = await bcrypt.hash("seller123", 10);
  const seller = await prisma.user.upsert({
    where: { username: "seller" },
    update: {},
    create: {
      name: "Sarah Seller",
      username: "seller",
      passwordHash: sellerPassword,
      role: Role.SELLER,
      status: UserStatus.ACTIVE,
    },
  });
  console.log("Created Seller:", seller.username);

  // 3. Create Boutique Categories
  const categories = [
    { name: "Dresses", description: "Boutique dresses and gowns" },
    { name: "Tops & Blouses", description: "Shirts, blouses, and knit tops" },
    { name: "Pants & Skirts", description: "Trousers, denim, and skirts" },
    { name: "Accessories", description: "Bags, scarves, and jewelry" },
    { name: "Shoes", description: "Boutique footwear and heels" },
  ];

  for (const cat of categories) {
    await prisma.category.upsert({
      where: { name: cat.name },
      update: {},
      create: cat,
    });
  }
  console.log("Created boutique categories.");

  // 4. Create Default Settings
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
  console.log("Created shop settings.");

  console.log("Seed completed successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
