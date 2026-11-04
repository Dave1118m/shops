import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyToken } from "@/lib/auth";
import { FinanceService } from "@/services/finance.service";
import { calculateExpectedCash } from "@/lib/calculations";

export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const session = verifyToken(authHeader.substring(7));
    if (!session || session.role !== "OWNER") {
      return NextResponse.json(
        { error: "Forbidden: Owner access required for financial analytics." },
        { status: 403 }
      );
    }

    const url = new URL(req.url);
    const period = url.searchParams.get("period") || "MONTH";

    const now = new Date();
    let startDate = new Date();
    const endDate = new Date(now);

    if (period === "TODAY") {
      startDate.setHours(0, 0, 0, 0);
    } else if (period === "WEEK") {
      startDate.setDate(now.getDate() - 7);
      startDate.setHours(0, 0, 0, 0);
    } else if (period === "MONTH") {
      startDate.setDate(now.getDate() - 30);
      startDate.setHours(0, 0, 0, 0);
    } else if (period === "CUSTOM") {
      const fromParam = url.searchParams.get("from");
      const toParam = url.searchParams.get("to");
      if (fromParam) startDate = new Date(fromParam);
      if (toParam) endDate.setTime(new Date(toParam).getTime());
    }

    // 1. Calculate Real P&L from Ledger
    const pnl = await FinanceService.getProfitAndLoss(startDate, endDate);

    // 2. Fetch Low Stock Items (single batch query)
    const activeItems = await prisma.item.findMany({
      where: { isActive: true },
      include: {
        category: true,
        variants: true,
      },
    });

    const stockByItem = await prisma.stockMovement.groupBy({
      by: ["itemId"],
      _sum: { quantity: true },
    });

    const stockMap = new Map<string, number>();
    for (const s of stockByItem) {
      stockMap.set(s.itemId, Number(s._sum.quantity ?? 0));
    }

    const lowStockItems: Array<{
      id: string;
      name: string;
      category: string;
      stock: number;
      reorderLevel: number;
      variantsCount: number;
    }> = [];

    for (const item of activeItems) {
      const currentStock = stockMap.get(item.id) || 0;
      if (currentStock <= item.reorderLevel) {
        lowStockItems.push({
          id: item.id,
          name: item.name,
          category: item.category.name,
          stock: currentStock,
          reorderLevel: item.reorderLevel,
          variantsCount: item.variants.length,
        });
      }
    }

    // 3. Cash Drawer Status (Reconciliation)
    // Find latest day closing
    const latestClosing = await prisma.dayClosing.findFirst({
      orderBy: { date: "desc" },
    });

    const closingOpeningCash = latestClosing ? Number(latestClosing.countedCash) : 0;
    const sinceDate = latestClosing ? latestClosing.date : new Date(0);

    // Aggregate money entries since last closing
    const moneyEntries = await prisma.moneyEntry.findMany({
      where: {
        date: { gt: sinceDate },
      },
    });

    let cashSales = 0;
    let cashExpenses = 0;
    let cashPurchases = 0;
    let ownerWithdrawals = 0;
    let ownerInjections = 0;

    for (const e of moneyEntries) {
      const amt = Number(e.amount);
      if (e.type === "SALE" && e.direction === "IN") cashSales += amt;
      if (e.type === "EXPENSE") cashExpenses += amt;
      if (e.type === "PURCHASE") cashPurchases += amt;
      if (e.type === "OWNER_WITHDRAWAL") ownerWithdrawals += amt;
      if (e.type === "OWNER_INJECTION") ownerInjections += amt;
    }

    const expectedCashInDrawer = calculateExpectedCash({
      openingCash: closingOpeningCash,
      cashSales,
      cashExpenses,
      cashPurchases,
      ownerWithdrawals,
      ownerInjections,
    });

    const lastCountedCash = latestClosing ? Number(latestClosing.countedCash) : 0;
    const cashDifference = latestClosing ? Number(latestClosing.difference) : 0;

    // 4. Recent Sales summary
    const recentSales = await prisma.sale.findMany({
      take: 10,
      orderBy: { createdAt: "desc" },
      include: {
        seller: {
          select: { name: true },
        },
      },
    });

    return NextResponse.json({
      period,
      stats: {
        totalSales: pnl.totalSales,
        cogs: pnl.totalCOGS,
        grossProfit: pnl.grossProfit,
        operatingExpenses: pnl.totalExpenses,
        writeOffLosses: pnl.totalWriteOffLoss,
        netProfit: pnl.netProfit,
        marginPercentage: pnl.marginPercentage,
        salesCount: pnl.salesCount,
        expectedCashInDrawer: Number(expectedCashInDrawer.toFixed(2)),
        lastCountedCash,
        cashDifference,
      },
      lowStockItems,
      recentSales: recentSales.map((s) => ({
        id: s.id,
        receiptNo: s.receiptNo,
        totalAmount: Number(s.totalAmount),
        sellerName: s.seller.name,
        date: s.date.toISOString(),
        status: s.status,
      })),
    });
  } catch (error: any) {
    console.error("GET /api/dashboard error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to load dashboard data." },
      { status: 500 }
    );
  }
}
