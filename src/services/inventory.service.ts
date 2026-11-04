import { prisma } from "@/lib/db";
import { StockMovementType, Prisma } from "@prisma/client";

export class InventoryService {
  /**
   * BR-01: Calculate remaining stock strictly from StockMovement records.
   */
  static async getItemStock(itemId: string, variantId?: string | null): Promise<number> {
    const whereClause: Prisma.StockMovementWhereInput = { itemId };
    if (variantId) {
      whereClause.variantId = variantId;
    }

    const aggregations = await prisma.stockMovement.aggregate({
      _sum: {
        quantity: true,
      },
      where: whereClause,
    });

    return Number(aggregations._sum.quantity ?? 0);
  }

  /**
   * Record inventory adjustment (stock count discrepancy).
   * Calculates diff: newCounted - currentStock, and logs a CORRECTION movement.
   */
  static async recordStockAuditCorrection(params: {
    itemId: string;
    variantId?: string | null;
    newCountedQuantity: number;
    reason: string;
    userId: string;
  }) {
    const { itemId, variantId, newCountedQuantity, reason, userId } = params;
    const currentStock = await this.getItemStock(itemId, variantId);
    const difference = newCountedQuantity - currentStock;

    if (difference === 0) {
      return { difference: 0, message: "Count matches current recorded stock." };
    }

    return await prisma.$transaction(async (tx) => {
      const movement = await tx.stockMovement.create({
        data: {
          itemId,
          variantId: variantId || null,
          quantity: new Prisma.Decimal(difference),
          type: StockMovementType.CORRECTION,
          reason: `Stock Count Correction: ${reason} (Was: ${currentStock}, Now: ${newCountedQuantity})`,
          refType: "AUDIT",
          userId,
        },
      });

      await tx.auditLog.create({
        data: {
          userId,
          action: "STOCK_CORRECTION",
          entity: "Item",
          entityId: itemId,
          details: JSON.stringify({ currentStock, newCountedQuantity, difference, reason }),
        },
      });

      return movement;
    });
  }

  /**
   * FR-STK-06: Damaged, lost, or expired goods write-off.
   * Decreases stock and loss is recorded.
   */
  static async recordWriteOff(params: {
    itemId: string;
    variantId?: string | null;
    quantity: number;
    reason: string;
    userId: string;
  }) {
    const { itemId, variantId, quantity, reason, userId } = params;

    if (quantity <= 0) {
      throw new Error("Write-off quantity must be greater than zero.");
    }

    return await prisma.$transaction(async (tx) => {
      const movement = await tx.stockMovement.create({
        data: {
          itemId,
          variantId: variantId || null,
          quantity: new Prisma.Decimal(-Math.abs(quantity)),
          type: StockMovementType.WRITE_OFF,
          reason: `Write-off: ${reason}`,
          refType: "WRITE_OFF",
          userId,
        },
      });

      await tx.auditLog.create({
        data: {
          userId,
          action: "STOCK_WRITE_OFF",
          entity: "Item",
          entityId: itemId,
          details: JSON.stringify({ quantity, reason }),
        },
      });

      return movement;
    });
  }
}
