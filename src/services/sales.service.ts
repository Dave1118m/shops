import { prisma } from "@/lib/db";
import { generateReceiptNumber } from "@/lib/utils";
import { Prisma } from "@prisma/client";
import { InventoryService } from "./inventory.service";

export interface CheckoutLineInput {
  itemId: string;
  variantId?: string | null;
  quantity: number;
}

export class SalesService {
  /**
   * NFR-02: Atomic Sale Transaction.
   * Decreases stock via StockMovement, logs Sale & SaleLines, logs MoneyEntry.
   */
  static async processSale(params: {
    sellerId: string;
    lines: CheckoutLineInput[];
    discountAmount?: number;
  }) {
    const { sellerId, lines, discountAmount = 0 } = params;

    if (!lines || lines.length === 0) {
      throw new Error("Cannot complete sale with an empty cart.");
    }

    // 1. Fetch items to get prices and check stock before opening transaction
    const itemIds = lines.map((l) => l.itemId);
    const dbItems = await prisma.item.findMany({
      where: { id: { in: itemIds } },
      include: { variants: true },
    });

    const itemsMap = new Map(dbItems.map((i) => [i.id, i]));

    // Validate quantities and pricing
    const resolvedLines: Array<{
      itemId: string;
      variantId?: string | null;
      quantity: number;
      unitPrice: number;
      unitCostAtSale: number;
      subtotal: number;
    }> = [];

    for (const line of lines) {
      const item = itemsMap.get(line.itemId);
      if (!item || !item.isActive) {
        throw new Error(`Product not found or inactive.`);
      }

      // Check current stock
      const availableStock = await InventoryService.getItemStock(line.itemId, line.variantId);
      if (availableStock < line.quantity) {
        throw new Error(
          `Insufficient stock for "${item.name}". Available: ${availableStock}, Requested: ${line.quantity}`
        );
      }

      let unitPrice = Number(item.sellingPrice);
      if (line.variantId) {
        const variant = item.variants.find((v) => v.id === line.variantId);
        if (variant) {
          unitPrice += Number(variant.additionalPrice);
        }
      }

      const unitCostAtSale = Number(item.buyingPrice);
      const subtotal = Number((unitPrice * line.quantity).toFixed(2));

      resolvedLines.push({
        itemId: line.itemId,
        variantId: line.variantId || null,
        quantity: line.quantity,
        unitPrice,
        unitCostAtSale,
        subtotal,
      });
    }

    const grossTotal = resolvedLines.reduce((sum, l) => sum + l.subtotal, 0);
    const finalTotal = Math.max(0, Number((grossTotal - discountAmount).toFixed(2)));
    const totalCOGS = resolvedLines.reduce((sum, l) => sum + l.unitCostAtSale * l.quantity, 0);
    const receiptNo = generateReceiptNumber();

    // 2. Execute Atomic Transaction (ACID)
    return await prisma.$transaction(async (tx) => {
      // Create Sale
      const sale = await tx.sale.create({
        data: {
          receiptNo,
          sellerId,
          status: "COMPLETED",
          discountAmount: new Prisma.Decimal(discountAmount),
          totalAmount: new Prisma.Decimal(finalTotal),
          totalCost: new Prisma.Decimal(totalCOGS),
          lines: {
            create: resolvedLines.map((l) => ({
              itemId: l.itemId,
              variantId: l.variantId,
              quantity: new Prisma.Decimal(l.quantity),
              unitPrice: new Prisma.Decimal(l.unitPrice),
              unitCostAtSale: new Prisma.Decimal(l.unitCostAtSale),
              subtotal: new Prisma.Decimal(l.subtotal),
            })),
          },
        },
        include: {
          lines: {
            include: {
              item: true,
              variant: true,
            },
          },
          seller: {
            select: { id: true, name: true, username: true },
          },
        },
      });

      // StockMovements (Negative quantity for sales out)
      for (const line of resolvedLines) {
        await tx.stockMovement.create({
          data: {
            itemId: line.itemId,
            variantId: line.variantId,
            quantity: new Prisma.Decimal(-Math.abs(line.quantity)),
            type: "SALE",
            refType: "SALE",
            refId: sale.id,
            userId: sellerId,
            reason: `Sale ${receiptNo}`,
          },
        });
      }

      // MoneyEntry (Cash In from sale)
      await tx.moneyEntry.create({
        data: {
          direction: "IN",
          amount: new Prisma.Decimal(finalTotal),
          type: "SALE",
          refType: "SALE",
          refId: sale.id,
          userId: sellerId,
          notes: `Sale completed: Receipt ${receiptNo}`,
        },
      });

      return sale;
    });
  }

  /**
   * FR-SAL-06: Cancel Sale by Owner.
   * Reverses stock and reverses money flow.
   */
  static async approveSaleCancellation(saleId: string, ownerUserId: string, reason: string) {
    return await prisma.$transaction(async (tx) => {
      const sale = await tx.sale.findUnique({
        where: { id: saleId },
        include: { lines: true },
      });

      if (!sale) throw new Error("Sale not found.");
      if (sale.status === "CANCELLED") throw new Error("Sale is already cancelled.");

      // Mark Sale as cancelled
      const updatedSale = await tx.sale.update({
        where: { id: saleId },
        data: {
          status: "CANCELLED",
          cancelReason: reason,
        },
      });

      // Return Stock (positive movement)
      for (const line of sale.lines) {
        await tx.stockMovement.create({
          data: {
            itemId: line.itemId,
            variantId: line.variantId,
            quantity: line.quantity, // positive to return stock
            type: "RETURN",
            refType: "SALE_CANCEL",
            refId: sale.id,
            userId: ownerUserId,
            reason: `Cancelled Sale ${sale.receiptNo}: ${reason}`,
          },
        });
      }

      // Reversing Money Entry (Cash Out refund)
      await tx.moneyEntry.create({
        data: {
          direction: "OUT",
          amount: sale.totalAmount,
          type: "SALE",
          refType: "SALE_CANCEL",
          refId: sale.id,
          userId: ownerUserId,
          notes: `Reversal of cancelled receipt ${sale.receiptNo}. Reason: ${reason}`,
        },
      });

      // Audit Log
      await tx.auditLog.create({
        data: {
          userId: ownerUserId,
          action: "SALE_CANCELLED",
          entity: "Sale",
          entityId: sale.id,
          details: JSON.stringify({ receiptNo: sale.receiptNo, amount: sale.totalAmount, reason }),
        },
      });

      return updatedSale;
    });
  }
}
