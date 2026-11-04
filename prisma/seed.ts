import { PrismaClient, Prisma } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding Boutique Database for SQL Server...");

  // 1. Create Default Owner User
  const ownerPassword = await bcrypt.hash("owner123", 10);
  const owner = await prisma.user.upsert({
    where: { username: "owner" },
    update: {
      email: "owner@soleil.shop",
    },
    create: {
      name: "Shop Owner",
      email: "owner@soleil.shop",
      username: "owner",
      passwordHash: ownerPassword,
      role: "OWNER",
      status: "ACTIVE",
    },
  });
  console.log("Created Owner:", owner.username, `(${owner.email})`);

  // 2. Create Sample Seller User
  const sellerPassword = await bcrypt.hash("seller123", 10);
  const seller = await prisma.user.upsert({
    where: { username: "seller" },
    update: {
      email: "seller@soleil.shop",
    },
    create: {
      name: "Sarah Seller",
      email: "seller@soleil.shop",
      username: "seller",
      passwordHash: sellerPassword,
      role: "SELLER",
      status: "ACTIVE",
    },
  });
  console.log("Created Seller:", seller.username, `(${seller.email})`);

  // 3. Create Boutique Categories
  const categoriesData = [
    { name: "Dresses", description: "Boutique dresses and gowns" },
    { name: "Tops & Blouses", description: "Shirts, blouses, and knit tops" },
    { name: "Pants & Skirts", description: "Trousers, denim, and skirts" },
    { name: "Accessories", description: "Bags, scarves, and jewelry" },
    { name: "Shoes", description: "Boutique footwear and heels" },
  ];

  const categoryMap = new Map<string, string>();
  for (const cat of categoriesData) {
    const saved = await prisma.category.upsert({
      where: { name: cat.name },
      update: {},
      create: cat,
    });
    categoryMap.set(saved.name, saved.id);
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

  // 5. Seed Real Boutique Products with Variants and Initial Purchase
  const existingItemsCount = await prisma.item.count();
  if (existingItemsCount === 0) {
    console.log("Seeding initial boutique catalog and restock purchase...");

    // Item 1: Silk Floral Wrap Dress
    const dressItem = await prisma.item.create({
      data: {
        code: "DR-001",
        name: "Silk Floral Wrap Dress",
        categoryId: categoryMap.get("Dresses")!,
        buyingPrice: new Prisma.Decimal(42.5),
        sellingPrice: new Prisma.Decimal(85.0),
        reorderLevel: 5,
        isActive: true,
        variants: {
          create: [
            { sku: "DR-001-S-RED", size: "S", color: "Rose Red", additionalPrice: new Prisma.Decimal(0) },
            { sku: "DR-001-M-RED", size: "M", color: "Rose Red", additionalPrice: new Prisma.Decimal(0) },
            { sku: "DR-001-L-BLK", size: "L", color: "Noir Black", additionalPrice: new Prisma.Decimal(5.0) },
          ],
        },
      },
      include: { variants: true },
    });

    // Item 2: Linen Button-Down Blouse
    const blouseItem = await prisma.item.create({
      data: {
        code: "TP-002",
        name: "Linen Button-Down Blouse",
        categoryId: categoryMap.get("Tops & Blouses")!,
        buyingPrice: new Prisma.Decimal(22.0),
        sellingPrice: new Prisma.Decimal(48.0),
        reorderLevel: 6,
        isActive: true,
        variants: {
          create: [
            { sku: "TP-002-S-WHT", size: "S", color: "Ivory White", additionalPrice: new Prisma.Decimal(0) },
            { sku: "TP-002-M-WHT", size: "M", color: "Ivory White", additionalPrice: new Prisma.Decimal(0) },
            { sku: "TP-002-L-BLU", size: "L", color: "Sky Blue", additionalPrice: new Prisma.Decimal(0) },
          ],
        },
      },
      include: { variants: true },
    });

    // Item 3: High-Waist Tailored Trousers
    const trousersItem = await prisma.item.create({
      data: {
        code: "TR-003",
        name: "High-Waist Tailored Trousers",
        categoryId: categoryMap.get("Pants & Skirts")!,
        buyingPrice: new Prisma.Decimal(30.0),
        sellingPrice: new Prisma.Decimal(65.0),
        reorderLevel: 4,
        isActive: true,
        variants: {
          create: [
            { sku: "TR-003-36-BLK", size: "36", color: "Classic Black", additionalPrice: new Prisma.Decimal(0) },
            { sku: "TR-003-38-BLK", size: "38", color: "Classic Black", additionalPrice: new Prisma.Decimal(0) },
            { sku: "TR-003-40-CML", size: "40", color: "Camel Tan", additionalPrice: new Prisma.Decimal(0) },
          ],
        },
      },
      include: { variants: true },
    });

    // Item 4: Italian Leather Shoulder Bag
    const bagItem = await prisma.item.create({
      data: {
        code: "AC-004",
        name: "Italian Leather Shoulder Bag",
        categoryId: categoryMap.get("Accessories")!,
        buyingPrice: new Prisma.Decimal(55.0),
        sellingPrice: new Prisma.Decimal(120.0),
        reorderLevel: 3,
        isActive: true,
        variants: {
          create: [
            { sku: "AC-004-STD-TAN", size: "Standard", color: "Cognac Tan", additionalPrice: new Prisma.Decimal(0) },
            { sku: "AC-004-STD-BLK", size: "Standard", color: "Black", additionalPrice: new Prisma.Decimal(0) },
          ],
        },
      },
      include: { variants: true },
    });

    // Record an initial Purchase order to stock inventory properly through the immutable ledger
    const purchaseLines: Array<{
      itemId: string;
      variantId: string;
      quantity: number;
      unitCost: number;
    }> = [
        // Dress variants
        { itemId: dressItem.id, variantId: dressItem.variants[0].id, quantity: 6, unitCost: 42.5 },
        { itemId: dressItem.id, variantId: dressItem.variants[1].id, quantity: 8, unitCost: 42.5 },
        { itemId: dressItem.id, variantId: dressItem.variants[2].id, quantity: 5, unitCost: 42.5 },
        // Blouse variants
        { itemId: blouseItem.id, variantId: blouseItem.variants[0].id, quantity: 10, unitCost: 22.0 },
        { itemId: blouseItem.id, variantId: blouseItem.variants[1].id, quantity: 10, unitCost: 22.0 },
        { itemId: blouseItem.id, variantId: blouseItem.variants[2].id, quantity: 8, unitCost: 22.0 },
        // Trousers variants
        { itemId: trousersItem.id, variantId: trousersItem.variants[0].id, quantity: 5, unitCost: 30.0 },
        { itemId: trousersItem.id, variantId: trousersItem.variants[1].id, quantity: 6, unitCost: 30.0 },
        { itemId: trousersItem.id, variantId: trousersItem.variants[2].id, quantity: 3, unitCost: 30.0 },
        // Bag variants
        { itemId: bagItem.id, variantId: bagItem.variants[0].id, quantity: 4, unitCost: 55.0 },
        { itemId: bagItem.id, variantId: bagItem.variants[1].id, quantity: 2, unitCost: 55.0 },
      ];

    const totalPurchaseCost = purchaseLines.reduce((sum, l) => sum + l.quantity * l.unitCost, 0);

    const initialPurchase = await prisma.purchase.create({
      data: {
        purchaseNumber: "PO-INIT-001",
        supplier: "Milano Fashion Wholesalers",
        extraCost: new Prisma.Decimal(0),
        notes: "Opening boutique collection inventory restock.",
        userId: owner.id,
        lines: {
          create: purchaseLines.map((l) => ({
            itemId: l.itemId,
            variantId: l.variantId,
            quantity: new Prisma.Decimal(l.quantity),
            unitCost: new Prisma.Decimal(l.unitCost),
            totalCost: new Prisma.Decimal(l.quantity * l.unitCost),
          })),
        },
      },
    });

    // Create StockMovements for each variant
    for (const line of purchaseLines) {
      await prisma.stockMovement.create({
        data: {
          itemId: line.itemId,
          variantId: line.variantId,
          quantity: new Prisma.Decimal(line.quantity),
          type: "PURCHASE",
          refType: "PURCHASE",
          refId: initialPurchase.id,
          userId: owner.id,
          reason: `Initial Restock: PO-INIT-001`,
        },
      });
    }

    // Create MoneyEntry for initial capital purchase
    await prisma.moneyEntry.create({
      data: {
        direction: "OUT",
        amount: new Prisma.Decimal(totalPurchaseCost),
        type: "PURCHASE",
        refType: "PURCHASE",
        refId: initialPurchase.id,
        userId: owner.id,
        notes: `Opening inventory purchase: Milano Fashion Wholesalers`,
      },
    });

    // Also record an initial Owner Capital Injection so drawer/cash balance starts healthy
    await prisma.moneyEntry.create({
      data: {
        direction: "IN",
        amount: new Prisma.Decimal(3000.0),
        type: "OWNER_INJECTION",
        notes: "Initial shop opening working capital injection",
        userId: owner.id,
      },
    });

    console.log(`Seeded 4 boutique items with variants and 67 total stock units via PO-INIT-001!`);
  }

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
