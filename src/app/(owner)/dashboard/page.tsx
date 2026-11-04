"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  TrendingUp,
  Package,
  AlertTriangle,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  Layers,
  ShoppingBag,
  ArrowLeft,
  FileText,
  PlusCircle,
  Plus,
} from "lucide-react";

export default function OwnerDashboardPage() {
  const [selectedPeriod, setSelectedPeriod] = useState<"TODAY" | "WEEK" | "MONTH" | "CUSTOM">("MONTH");

  // Sample real-time boutique performance figures (derived from SQL Server MoneyEntry & StockMovements)
  const stats = {
    totalSales: 4850.0,
    cogs: 2150.0,
    grossProfit: 2700.0,
    operatingExpenses: 850.0,
    writeOffLosses: 120.0,
    netProfit: 1730.0,
    marginPercentage: 35.67,
    expectedCashInDrawer: 1420.0,
    lastCountedCash: 1410.0,
    cashDifference: -10.0, // Short by $10
  };

  const lowStockItems = [
    { name: "Silk Floral Wrap Dress (S, Red)", stock: 2, reorderLevel: 5, category: "Dresses" },
    { name: "High-Waist Tailored Trousers (40, Camel)", stock: 2, reorderLevel: 4, category: "Pants" },
    { name: "Italian Leather Shoulder Bag (Black)", stock: 2, reorderLevel: 3, category: "Accessories" },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Top Navbar */}
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-4">
          <Link
            href="/"
            className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Home
          </Link>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Owner Financial & Stock Dashboard</h1>
            <p className="text-xs text-slate-400">Elegance Boutique • Real-Time Ledger Analytics</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-semibold">
            {(["TODAY", "WEEK", "MONTH", "CUSTOM"] as const).map((p) => (
              <button
                key={p}
                onClick={() => setSelectedPeriod(p)}
                className={`px-3 py-1.5 rounded-lg transition ${
                  selectedPeriod === p ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-900"
                }`}
              >
                {p}
              </button>
            ))}
          </div>

          <Link
            href="/pos"
            className="flex items-center gap-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold px-3.5 py-2 rounded-xl shadow-sm transition"
          >
            <ShoppingBag className="w-4 h-4" /> Open POS
          </Link>
        </div>
      </header>

      {/* Content */}
      <main className="p-6 max-w-7xl w-full mx-auto space-y-6">
        {/* Metric Cards Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Total Sales */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
            <div className="flex justify-between items-start">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Sales</span>
              <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-2xl font-bold text-slate-900">${stats.totalSales.toFixed(2)}</span>
              <p className="text-xs text-emerald-600 font-medium mt-1 flex items-center gap-0.5">
                <ArrowUpRight className="w-3.5 h-3.5" /> +14.2% from previous period
              </p>
            </div>
          </div>

          {/* Card 2: Cost of Goods (COGS) */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
            <div className="flex justify-between items-start">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Cost of Goods (COGS)</span>
              <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
                <Package className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-2xl font-bold text-slate-900">${stats.cogs.toFixed(2)}</span>
              <p className="text-xs text-slate-400 mt-1">Weighted average cost basis</p>
            </div>
          </div>

          {/* Card 3: Operating Expenses & Losses */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
            <div className="flex justify-between items-start">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Expenses & Write-offs</span>
              <div className="p-2 rounded-xl bg-purple-50 text-purple-600">
                <DollarSign className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-2xl font-bold text-slate-900">
                ${(stats.operatingExpenses + stats.writeOffLosses).toFixed(2)}
              </span>
              <p className="text-xs text-slate-400 mt-1">
                Expenses: ${stats.operatingExpenses.toFixed(0)} • Loss: ${stats.writeOffLosses.toFixed(0)}
              </p>
            </div>
          </div>

          {/* Card 4: Net Profit */}
          <div className="bg-emerald-600 text-white p-5 rounded-2xl shadow-sm flex flex-col justify-between">
            <div className="flex justify-between items-start">
              <span className="text-xs font-semibold text-emerald-100 uppercase tracking-wider">Net Profit</span>
              <span className="bg-emerald-500/80 text-white text-[11px] font-bold px-2 py-0.5 rounded-full">
                {stats.marginPercentage}% Margin
              </span>
            </div>
            <div className="mt-3">
              <span className="text-2xl font-extrabold">${stats.netProfit.toFixed(2)}</span>
              <p className="text-xs text-emerald-100 mt-1">Net profit after all shop expenses</p>
            </div>
          </div>
        </div>

        {/* Middle Section: Cash Drawer & Low Stock */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Drawer Reconciliation Card */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-slate-900 text-sm">Cash Drawer Closing Status</h3>
                <span className="text-[11px] font-semibold bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                  Daily Closing
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Calculated expected drawer cash vs counted cash entered by Owner.
              </p>
            </div>

            <div className="space-y-2.5 bg-slate-50 p-4 rounded-xl border border-slate-100 text-sm">
              <div className="flex justify-between text-slate-600">
                <span>Expected Drawer Cash:</span>
                <strong className="text-slate-900">${stats.expectedCashInDrawer.toFixed(2)}</strong>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Owner Counted Cash:</span>
                <strong className="text-slate-900">${stats.lastCountedCash.toFixed(2)}</strong>
              </div>
              <div className="flex justify-between pt-2 border-t border-slate-200 font-bold">
                <span>Variance:</span>
                <span className="text-red-600 flex items-center gap-0.5">
                  <ArrowDownRight className="w-4 h-4" /> -${Math.abs(stats.cashDifference).toFixed(2)} (Short)
                </span>
              </div>
            </div>

            <button className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition">
              Perform Daily Cash Closing
            </button>
          </div>

          {/* Low Stock Warning Card */}
          <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                <h3 className="font-bold text-slate-900 text-sm">Low-Stock & Reorder Alerts</h3>
              </div>
              <span className="text-xs font-bold bg-amber-50 text-amber-700 px-2.5 py-0.5 rounded-full">
                {lowStockItems.length} items at reorder level
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-400 font-semibold">
                    <th className="pb-2">Item & Variant</th>
                    <th className="pb-2">Category</th>
                    <th className="pb-2">Current Stock</th>
                    <th className="pb-2">Reorder Level</th>
                    <th className="pb-2 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {lowStockItems.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/80">
                      <td className="py-2.5 font-semibold text-slate-800">{item.name}</td>
                      <td className="py-2.5 text-slate-500">{item.category}</td>
                      <td className="py-2.5">
                        <span className="font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded">
                          {item.stock} left
                        </span>
                      </td>
                      <td className="py-2.5 text-slate-500">{item.reorderLevel} units</td>
                      <td className="py-2.5 text-right">
                        <button className="text-xs font-semibold text-rose-600 hover:text-rose-700 hover:underline">
                          + Restock PO
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Quick Management Actions */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <button className="p-4 bg-white border border-slate-200 hover:border-slate-300 rounded-xl text-left shadow-sm transition group">
            <PlusCircle className="w-5 h-5 text-rose-600 mb-2 group-hover:scale-110 transition" />
            <h4 className="font-bold text-xs text-slate-900">Add Boutique Item</h4>
            <p className="text-[11px] text-slate-500 mt-0.5">Setup sizes, colors & prices</p>
          </button>

          <button className="p-4 bg-white border border-slate-200 hover:border-slate-300 rounded-xl text-left shadow-sm transition group">
            <Package className="w-5 h-5 text-blue-600 mb-2 group-hover:scale-110 transition" />
            <h4 className="font-bold text-xs text-slate-900">Record Purchase</h4>
            <p className="text-[11px] text-slate-500 mt-0.5">Auto-weighted average cost</p>
          </button>

          <button className="p-4 bg-white border border-slate-200 hover:border-slate-300 rounded-xl text-left shadow-sm transition group">
            <DollarSign className="w-5 h-5 text-purple-600 mb-2 group-hover:scale-110 transition" />
            <h4 className="font-bold text-xs text-slate-900">Record Expense</h4>
            <p className="text-[11px] text-slate-500 mt-0.5">Rent, salaries & utilities</p>
          </button>

          <button className="p-4 bg-white border border-slate-200 hover:border-slate-300 rounded-xl text-left shadow-sm transition group">
            <FileText className="w-5 h-5 text-emerald-600 mb-2 group-hover:scale-110 transition" />
            <h4 className="font-bold text-xs text-slate-900">Audit & Stock Count</h4>
            <p className="text-[11px] text-slate-500 mt-0.5">Physical count reconciliation</p>
          </button>
        </div>
      </main>
    </div>
  );
}

