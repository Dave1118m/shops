export type UserRole = "OWNER" | "SELLER";

export interface CurrentUser {
  id: string;
  name: string;
  username: string;
  role: UserRole;
}

export interface BoutiqueItemWithStock {
  id: string;
  name: string;
  category: { id: string; name: string };
  code: string | null;
  buyingPrice?: number; // Only returned if user is OWNER
  sellingPrice: number;
  reorderLevel: number;
  unitType: string;
  currentStock: number;
  variants: Array<{
    id: string;
    size: string | null;
    color: string | null;
    sku: string | null;
    additionalPrice: number;
    currentStock: number;
  }>;
}

export interface CartItem {
  itemId: string;
  variantId?: string;
  name: string;
  variantDescription?: string; // e.g. "Size: L, Color: Black"
  unitPrice: number;
  quantity: number;
  maxAvailable: number;
}

export interface SaleCheckoutPayload {
  lines: Array<{
    itemId: string;
    variantId?: string;
    quantity: number;
    unitPrice: number;
  }>;
  discountAmount?: number;
}

export interface PurchasePayload {
  supplier?: string;
  extraCost?: number;
  notes?: string;
  lines: Array<{
    itemId: string;
    variantId?: string;
    quantity: number;
    unitCost: number;
  }>;
}

export interface StockAdjustmentPayload {
  itemId: string;
  variantId?: string;
  newCountedQuantity: number;
  reason: string;
}

export interface StockWriteOffPayload {
  itemId: string;
  variantId?: string;
  quantity: number;
  reason: string; // e.g., "Damaged during handling", "Customer torn", "Expired"
}

export interface ExpensePayload {
  category: "RENT" | "SALARY" | "TRANSPORT" | "ELECTRICITY" | "PACKAGING" | "OTHER";
  amount: number;
  note?: string;
  date?: string;
}

export interface DayClosingPayload {
  openingCash: number;
  countedCash: number;
  notes?: string;
}

export interface ProfitAndLossReport {
  period: { start: string; end: string };
  totalSales: number;
  totalCOGS: number;
  grossProfit: number;
  totalExpenses: number;
  totalWriteOffLoss: number;
  netProfit: number;
  marginPercentage: number;
  salesCount: number;
  expensesByCategory: Record<string, number>;
}

