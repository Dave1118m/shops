import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyToken } from "@/lib/auth";
import { Prisma } from "@prisma/client";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const categoryName = url.searchParams.get("category");
    const search = url.searchParams.get("search");

    // Optional auth check for role-based buying price visibility
    const authHeader = req.headers.get("authorization");
    let isOwner = false;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.substring(7);
      const session = verifyToken(token);
      if (session && session.role === "OWNER") {
        isOwner = true;
      }
    }

    // Build filter
    const where: Prisma.ItemWhereInput = {
      isActive: true,
    };

    if (categoryName && categoryName !== "ALL") {
      where.category = {
        name: categoryName,
      };
    }

    if (search && search.trim() !== "") {
      where.OR = [
        { name: { contains: search } },
        { code: { contains: search } },
      ];
    }

    // 1. Fetch items with category and variants (single query)
    const items = await prisma.item.findMany({
      where,
      include: {
        category: {
          select: { id: true, name: true },
        },
        variants: true,
      },
      orderBy: { createdAt: "desc" },
    });

    if (items.length === 0) {
      return NextResponse.json({ items: [], count: 0 });
    }

    const itemIds = items.map((i) => i.id);

    // 2. Fetch all stock movements for these items grouped in a single query
    const stockAggregations = await prisma.stockMovement.groupBy({
      by: ["itemId", "variantId"],
      _sum: { quantity: true },
      where: {
        itemId: { in: itemIds },
      },
    });

    // Build lookup maps for variant stock and total item stock
    const variantStockMap = new Map<string, number>();
    const totalItemStockMap = new Map<string, number>();

    for (const agg of stockAggregations) {
      const qty = Number(agg._sum.quantity ?? 0);
      if (agg.variantId) {
        variantStockMap.set(`${agg.itemId}-${agg.variantId}`, qty);
      }
      const existingTotal = totalItemStockMap.get(agg.itemId) || 0;
      totalItemStockMap.set(agg.itemId, existingTotal + qty);
    }

    // Combine into final response
    const itemsWithLiveStock = items.map((item) => {
      const variantsWithStock = item.variants.map((v) => ({
        id: v.id,
        size: v.size || "Standard",
        color: v.color || "Standard",
        additionalPrice: Number(v.additionalPrice),
        stock: variantStockMap.get(`${item.id}-${v.id}`) || 0,
      }));

      const totalStock = totalItemStockMap.get(item.id) || 0;

      return {
        id: item.id,
        name: item.name,
        code: item.code,
        category: item.category.name,
        categoryId: item.categoryId,
        sellingPrice: Number(item.sellingPrice),
        buyingPrice: isOwner ? Number(item.buyingPrice) : undefined, // only visible to OWNER
        reorderLevel: Number(item.reorderLevel),
        stock: totalStock,
        variants: variantsWithStock,
      };
    });

    return NextResponse.json({
      items: itemsWithLiveStock,
      count: itemsWithLiveStock.length,
    });
  } catch (error: any) {
    console.error("GET /api/items error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch items." },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const session = verifyToken(authHeader.substring(7));
    if (!session || session.role !== "OWNER") {
      return NextResponse.json({ error: "Only shop owners can create products." }, { status: 403 });
    }

    const body = await req.json();
    const { name, code, categoryId, buyingPrice, sellingPrice, reorderLevel, variants } = body;

    if (!name || !code || !categoryId || buyingPrice === undefined || sellingPrice === undefined) {
      return NextResponse.json(
        { error: "Name, code, category, buying price, and selling price are required." },
        { status: 400 }
      );
    }

    // Check code unique
    const existing = await prisma.item.findUnique({ where: { code } });
    if (existing) {
      return NextResponse.json({ error: "Item with this code already exists." }, { status: 409 });
    }

    const item = await prisma.item.create({
      data: {
        name,
        code,
        categoryId,
        buyingPrice: new Prisma.Decimal(buyingPrice),
        sellingPrice: new Prisma.Decimal(sellingPrice),
        reorderLevel: typeof reorderLevel === "number" ? reorderLevel : 5,
        isActive: true,
        variants: variants && variants.length > 0 ? {
          create: variants.map((v: any, index: number) => ({
            sku: `${code}-${(v.size || "STD").toUpperCase()}-${(v.color || "STD").toUpperCase()}-${index}`,
            size: v.size || null,
            color: v.color || null,
            additionalPrice: new Prisma.Decimal(v.additionalPrice || 0),
          })),
        } : undefined,
      },
      include: {
        variants: true,
        category: true,
      },
    });

    return NextResponse.json({ success: true, item });
  } catch (error: any) {
    console.error("POST /api/items error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create item." },
      { status: 500 }
    );
  }
}
