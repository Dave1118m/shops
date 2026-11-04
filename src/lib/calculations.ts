/**
 * Core business rules and financial calculations as defined in SRS Section 5.
 */

/**
 * Calculates new weighted average buying price when new stock arrives.
 * FR-BUY-04 & FR-BUY-03:
 * New Cost = ((Current Qty * Current Buying Price) + (Incoming Qty * Incoming Unit Cost + Extra Cost)) / Total New Qty
 */
export function calculateWeightedAverageCost(params: {
  currentQty: number;
  currentBuyingPrice: number;
  incomingQty: number;
  incomingUnitCost: number;
  extraCost?: number;
}): number {
  const { currentQty, currentBuyingPrice, incomingQty, incomingUnitCost, extraCost = 0 } = params;

  if (incomingQty <= 0) return currentBuyingPrice;

  const currentTotalValue = Math.max(0, currentQty) * currentBuyingPrice;
  const incomingTotalValue = incomingQty * incomingUnitCost + extraCost;
  const totalQty = Math.max(0, currentQty) + incomingQty;

  if (totalQty === 0) return incomingUnitCost;

  const newAverage = (currentTotalValue + incomingTotalValue) / totalQty;
  return Number(newAverage.toFixed(2));
}

/**
 * BR-02: Sale total = Sum of (quantity * selling price) - discount
 */
export function calculateSaleTotal(lines: Array<{ quantity: number; unitPrice: number }>, discount = 0): number {
  const gross = lines.reduce((acc, line) => acc + line.quantity * line.unitPrice, 0);
  return Number(Math.max(0, gross - discount).toFixed(2));
}

/**
 * BR-03: Cost of goods sold (COGS) at the time of sale
 */
export function calculateCOGS(lines: Array<{ quantity: number; unitCostAtSale: number }>): number {
  const total = lines.reduce((acc, line) => acc + line.quantity * line.unitCostAtSale, 0);
  return Number(total.toFixed(2));
}

/**
 * BR-04: Gross Profit = Sales - Cost of goods sold
 */
export function calculateGrossProfit(totalSales: number, totalCOGS: number): number {
  return Number((totalSales - totalCOGS).toFixed(2));
}

/**
 * BR-05: Net Profit = Gross Profit - Operating Expenses - Write-off Losses
 */
export function calculateNetProfit(grossProfit: number, expenses: number, writeOffLosses: number): number {
  return Number((grossProfit - expenses - writeOffLosses).toFixed(2));
}

/**
 * Profit Margin % = (Net Profit / Total Sales) * 100
 */
export function calculateMarginPercentage(netProfit: number, totalSales: number): number {
  if (totalSales <= 0) return 0;
  return Number(((netProfit / totalSales) * 100).toFixed(2));
}

/**
 * BR-06: Expected Cash in drawer for daily closing:
 * Opening Cash + Cash Sales - Cash Expenses - Cash Purchases - Withdrawals + Cash Injected
 */
export function calculateExpectedCash(params: {
  openingCash: number;
  cashSales: number;
  cashExpenses: number;
  cashPurchases: number;
  ownerWithdrawals: number;
  ownerInjections: number;
}): number {
  const { openingCash, cashSales, cashExpenses, cashPurchases, ownerWithdrawals, ownerInjections } = params;
  const expected = openingCash + cashSales - cashExpenses - cashPurchases - ownerWithdrawals + ownerInjections;
  return Number(expected.toFixed(2));
}

