import { prisma } from "@/lib/db";
import { generatePurchaseNumber } from "@/lib/utils";
import {
  calculateWeightedAverageCost,
  calculateGrossProfit,
  calculateNetProfit,
  calculateMarginPercentage,
  calculateExpectedCash,
} from "@/lib/calculations";
import { Prisma } from "@prisma/client";
import { InventoryService } from "./inventory.service";

export interface RecordPurchaseInput {
  userId: string;
  supplier?: string;
  extraCost?: number;
  notes?: string;
  lines: Array<{
    itemId: string;
    variantId?: string | null;
    quantity: number;
    unitCost: number;
  }>;
}

export class FinanceService {
  /**
   * FR-BUY-01 & FR-BUY-04: Record a purchase, restock items, update weighted average cost.
   */
  static async recordPurchase(input: RecordPurchaseInput) {
    const { userId, supplier, extraCost = 0, notes, lines } = input;

    if (!lines || lines.length === 0) {
      throw new Error("Purchase must contain at least one item line.");
    }

    const purchaseNumber = generatePurchaseNumber();

    return await prisma.$transaction(async (tx) => {
      let totalGoodsCost = 0;

      for (const line of lines) {
        totalGoodsCost += line.quantity * line.unitCost;
      }
      const grandTotalPurchase = totalGoodsCost + extraCost;

      // Create Purchase record
      const purchase = await tx.purchase.create({
        data: {
          purchaseNumber,
          supplier,
          extraCost: new Prisma.Decimal(extraCost),
          notes,
          userId,
          lines: {
            create: lines.map((l) => ({
              itemId: l.itemId,
              variantId: l.variantId || null,
              quantity: new Prisma.Decimal(l.quantity),
              unitCost: new Prisma.Decimal(l.unitCost),
              totalCost: new Prisma.Decimal(Number((l.quantity * l.unitCost).toFixed(2))),
            })),
          },
        },
      });

      // Update Stock and recalculate Weighted Average Cost for each item
      for (const line of lines) {
        const item = await tx.item.findUnique({ where: { id: line.itemId } });
        if (!item) continue;

        const currentStock = await InventoryService.getItemStock(line.itemId);
        const currentBuyingPrice = Number(item.buyingPrice);

        // Portion of extra cost allocated proportionally or added
        const allocatedExtraCost =
          totalGoodsCost > 0 ? (line.quantity * line.unitCost / totalGoodsCost) * extraCost : 0;

        const newWeightedAverageCost = calculateWeightedAverageCost({
          currentQty: currentStock,
          currentBuyingPrice,
          incomingQty: line.quantity,
          incomingUnitCost: line.unitCost,
          extraCost: allocatedExtraCost,
        });

        // Update item's weighted average buying price
        await tx.item.update({
          where: { id: line.itemId },
          data: {
            buyingPrice: new Prisma.Decimal(newWeightedAverageCost),
          },
        });

        // Increase stock via StockMovement
        await tx.stockMovement.create({
          data: {
            itemId: line.itemId,
            variantId: line.variantId || null,
            quantity: new Prisma.Decimal(line.quantity),
            type: "PURCHASE",
            refType: "PURCHASE",
            refId: purchase.id,
            userId,
            reason: `Purchase Restock ${purchaseNumber}`,
          },
        });
      }

      // MoneyEntry (Cash Out for purchase)
      await tx.moneyEntry.create({
        data: {
          direction: "OUT",
          amount: new Prisma.Decimal(grandTotalPurchase),
          type: "PURCHASE",
          refType: "PURCHASE",
          refId: purchase.id,
          userId,
          notes: `Purchase ${purchaseNumber} from ${supplier || "Supplier"}`,
        },
      });

      return purchase;
    });
  }

  /**
   * FR-MON-03: Record shop operating expense.
   */
  static async recordExpense(params: {
    category: string;
    amount: number;
    note?: string;
    userId: string;
    date?: Date;
  }) {
    const { category, amount, note, userId, date = new Date() } = params;

    if (amount <= 0) throw new Error("Expense amount must be greater than zero.");

    return await prisma.$transaction(async (tx) => {
      const expense = await tx.expense.create({
        data: {
          category,
          amount: new Prisma.Decimal(amount),
          note,
          userId,
          date,
        },
      });

      await tx.moneyEntry.create({
        data: {
          direction: "OUT",
          amount: new Prisma.Decimal(amount),
          type: "EXPENSE",
          refType: "EXPENSE",
          refId: expense.id,
          userId,
          notes: `Expense [${category}]: ${note || ""}`,
          date,
        },
      });

      return expense;
    });
  }

  /**
   * FR-MON-04: Record Owner drawing or injection.
   */
  static async recordOwnerMoneyTransfer(params: {
    type: "WITHDRAWAL" | "INJECTION";
    amount: number;
    notes?: string;
    userId: string;
  }) {
    const { type, amount, notes, userId } = params;
    if (amount <= 0) throw new Error("Amount must be greater than zero.");

    const isWithdrawal = type === "WITHDRAWAL";
    return await prisma.moneyEntry.create({
      data: {
        direction: isWithdrawal ? "OUT" : "IN",
        amount: new Prisma.Decimal(amount),
        type: isWithdrawal ? "OWNER_WITHDRAWAL" : "OWNER_INJECTION",
        notes: notes || (isWithdrawal ? "Owner Personal Withdrawal" : "Owner Capital Injection"),
        userId,
      },
    });
  }

  /**
   * FR-MON-05: Daily cash closing reconciliation.
   */
  static async performDailyClosing(params: {
    openingCash: number;
    countedCash: number;
    notes?: string;
    closedById: string;
    date?: Date;
  }) {
    const { openingCash, countedCash, notes, closedById, date = new Date() } = params;

    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    // Sum money movements for the day
    const entries = await prisma.moneyEntry.findMany({
      where: {
        date: { gte: startOfDay, lte: endOfDay },
      },
    });

    let cashSales = 0;
    let cashExpenses = 0;
    let cashPurchases = 0;
    let ownerWithdrawals = 0;
    let ownerInjections = 0;

    for (const e of entries) {
      const amt = Number(e.amount);
      if (e.type === "SALE" && e.direction === "IN") cashSales += amt;
      if (e.type === "EXPENSE") cashExpenses += amt;
      if (e.type === "PURCHASE") cashPurchases += amt;
      if (e.type === "OWNER_WITHDRAWAL") ownerWithdrawals += amt;
      if (e.type === "OWNER_INJECTION") ownerInjections += amt;
    }

    const expectedCash = calculateExpectedCash({
      openingCash,
      cashSales,
      cashExpenses,
      cashPurchases,
      ownerWithdrawals,
      ownerInjections,
    });

    const difference = Number((countedCash - expectedCash).toFixed(2));

    return await prisma.dayClosing.create({
      data: {
        date,
        openingCash: new Prisma.Decimal(openingCash),
        expectedCash: new Prisma.Decimal(expectedCash),
        countedCash: new Prisma.Decimal(countedCash),
        difference: new Prisma.Decimal(difference),
        notes,
        closedById,
      },
    });
  }

  /**
   * FR-PRF-01, FR-PRF-02: Comprehensive Profit and Loss report for any custom period.
   */
  static async getProfitAndLoss(startDate: Date, endDate: Date) {
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);

    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    // 1. Sales & COGS
    const sales = await prisma.sale.findMany({
      where: {
        date: { gte: start, lte: end },
        status: "COMPLETED",
      },
    });

    const totalSales = sales.reduce((acc, s) => acc + Number(s.totalAmount), 0);
    const totalCOGS = sales.reduce((acc, s) => acc + Number(s.totalCost), 0);
    const grossProfit = calculateGrossProfit(totalSales, totalCOGS);

    // 2. Expenses
    const expenses = await prisma.expense.findMany({
      where: {
        date: { gte: start, lte: end },
      },
    });

    let totalExpenses = 0;
    const expensesByCategory: Record<string, number> = {};

    for (const exp of expenses) {
      const amt = Number(exp.amount);
      totalExpenses += amt;
      expensesByCategory[exp.category] = (expensesByCategory[exp.category] || 0) + amt;
    }

    // 3. Write-off losses (damage/loss/theft at buying price)
    const writeOffs = await prisma.stockMovement.findMany({
      where: {
        type: "WRITE_OFF",
        date: { gte: start, lte: end },
      },
      include: {
        item: true,
      },
    });

    let totalWriteOffLoss = 0;
    for (const w of writeOffs) {
      const qty = Math.abs(Number(w.quantity));
      const costPerUnit = Number(w.item.buyingPrice);
      totalWriteOffLoss += qty * costPerUnit;
    }

    // 4. Net Profit
    const netProfit = calculateNetProfit(grossProfit, totalExpenses, totalWriteOffLoss);
    const marginPercentage = calculateMarginPercentage(netProfit, totalSales);

    return {
      period: {
        start: start.toISOString(),
        end: end.toISOString(),
      },
      totalSales: Number(totalSales.toFixed(2)),
      totalCOGS: Number(totalCOGS.toFixed(2)),
      grossProfit: Number(grossProfit.toFixed(2)),
      totalExpenses: Number(totalExpenses.toFixed(2)),
      totalWriteOffLoss: Number(totalWriteOffLoss.toFixed(2)),
      netProfit: Number(netProfit.toFixed(2)),
      marginPercentage,
      salesCount: sales.length,
      expensesByCategory,
    };
  }
}
