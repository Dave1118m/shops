"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  TrendingUp,
  Package,
  AlertTriangle,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  ShoppingBag,
  ArrowLeft,
  FileText,
  PlusCircle,
  RefreshCw,
  LogOut,
  X,
  AlertCircle,
  CheckCircle,
} from "lucide-react";

interface DashboardStats {
  totalSales: number;
  cogs: number;
  grossProfit: number;
  operatingExpenses: number;
  writeOffLosses: number;
  netProfit: number;
  marginPercentage: number;
  salesCount: number;
  expectedCashInDrawer: number;
  lastCountedCash: number;
  cashDifference: number;
}

interface LowStockItem {
  id: string;
  name: string;
  category: string;
  stock: number;
  reorderLevel: number;
  variantsCount: number;
}

interface RecentSale {
  id: string;
  receiptNo: string;
  totalAmount: number;
  sellerName: string;
  date: string;
  status: string;
}

export default function OwnerDashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<{ id: string; name: string; username: string; role: string } | null>(null);
  const [token, setToken] = useState<string | null>(null);

  const [selectedPeriod, setSelectedPeriod] = useState<"TODAY" | "WEEK" | "MONTH">("MONTH");
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [lowStockItems, setLowStockItems] = useState<LowStockItem[]>([]);
  const [recentSales, setRecentSales] = useState<RecentSale[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Modals
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [expenseForm, setExpenseForm] = useState({ category: "Rent", amount: "", note: "" });
  const [submittingExpense, setSubmittingExpense] = useState(false);

  const [showClosingModal, setShowClosingModal] = useState(false);
  const [closingForm, setClosingForm] = useState({ countedCash: "", notes: "" });
  const [submittingClosing, setSubmittingClosing] = useState(false);

  // 1. Auth check
  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");

    if (!storedToken || !storedUser) {
      router.push("/login");
      return;
    }

    try {
      const parsedUser = JSON.parse(storedUser);
      if (parsedUser.role !== "OWNER") {
        router.push("/pos");
        return;
      }
      setUser(parsedUser);
      setToken(storedToken);
      fetchDashboardData(storedToken, selectedPeriod);
    } catch {
      router.push("/login");
    }
  }, [router, selectedPeriod]);

  const fetchDashboardData = async (authToken: string, period: string) => {
    try {
      setLoading(true);
      setError("");

      const res = await fetch(`/api/dashboard?period=${period}`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
          router.push("/login");
          return;
        }
        throw new Error("Failed to load financial records from SQL Server.");
      }

      const data = await res.json();
      setStats(data.stats);
      setLowStockItems(data.lowStockItems || []);
      setRecentSales(data.recentSales || []);
    } catch (err: any) {
      setError(err.message || "Failed to load dashboard.");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    router.push("/login");
  };

  const handleRecordExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !expenseForm.amount) return;

    try {
      setSubmittingExpense(true);
      const res = await fetch("/api/expenses", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          category: expenseForm.category,
          amount: parseFloat(expenseForm.amount),
          note: expenseForm.note,
        }),
      });

      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || "Failed to record expense.");
      }

      setShowExpenseModal(false);
      setExpenseForm({ category: "Rent", amount: "", note: "" });
      fetchDashboardData(token, selectedPeriod);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSubmittingExpense(false);
    }
  };

  const handleDayClosing = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !closingForm.countedCash) return;

    try {
      setSubmittingClosing(true);
      const res = await fetch("/api/day-closing", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          openingCash: stats?.lastCountedCash || 0,
          countedCash: parseFloat(closingForm.countedCash),
          notes: closingForm.notes,
        }),
      });

      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || "Failed to perform closing.");
      }

      setShowClosingModal(false);
      setClosingForm({ countedCash: "", notes: "" });
      fetchDashboardData(token, selectedPeriod);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSubmittingClosing(false);
    }
  };

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
            <p className="text-xs text-slate-400">Elegance Boutique • Real-Time SQL Server Ledger</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-semibold">
            {(["TODAY", "WEEK", "MONTH"] as const).map((p) => (
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

          <button
            onClick={() => token && fetchDashboardData(token, selectedPeriod)}
            title="Refresh Ledger Analytics"
            className="p-2 text-slate-400 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>

          <Link
            href="/pos"
            className="flex items-center gap-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold px-3.5 py-2 rounded-xl shadow-sm transition"
          >
            <ShoppingBag className="w-4 h-4" /> Open POS
          </Link>

          <button
            onClick={handleLogout}
            title="Sign out"
            className="p-2 text-slate-400 hover:text-red-600 bg-slate-100 hover:bg-red-50 rounded-xl transition"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Error notification */}
      {error && (
        <div className="bg-red-50 border-b border-red-200 px-6 py-3 flex items-center gap-2 text-xs text-red-700 font-medium">
          <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Content */}
      <main className="p-6 max-w-7xl w-full mx-auto space-y-6 flex-1">
        {loading && !stats ? (
          <div className="py-24 flex flex-col items-center justify-center text-slate-400">
            <RefreshCw className="w-8 h-8 animate-spin text-amber-600 mb-3" />
            <p className="text-sm font-semibold text-slate-700">Calculating real-time financial ledger...</p>
            <p className="text-xs text-slate-400 mt-1">Aggregating StockMovement and MoneyEntry entries</p>
          </div>
        ) : stats ? (
          <>
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
                  <p className="text-xs text-slate-500 mt-1">
                    {stats.salesCount} {stats.salesCount === 1 ? "sale completed" : "sales completed"} ({selectedPeriod.toLowerCase()})
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
                    Expenses: ${stats.operatingExpenses.toFixed(2)} • Loss: ${stats.writeOffLosses.toFixed(2)}
                  </p>
                </div>
              </div>

              {/* Card 4: Net Profit */}
              <div className="bg-emerald-600 text-white p-5 rounded-2xl shadow-sm flex flex-col justify-between">
                <div className="flex justify-between items-start">
                  <span className="text-xs font-semibold text-emerald-100 uppercase tracking-wider">Net Profit</span>
                  <span className="bg-emerald-500/80 text-white text-[11px] font-bold px-2 py-0.5 rounded-full">
                    {stats.marginPercentage.toFixed(1)}% Margin
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
                    <h3 className="font-bold text-slate-900 text-sm">Cash Drawer Status</h3>
                    <span className="text-[11px] font-semibold bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                      Live Reconciliation
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Derived from all incoming & outgoing cash movements in the ledger.
                  </p>
                </div>

                <div className="space-y-2.5 bg-slate-50 p-4 rounded-xl border border-slate-100 text-sm">
                  <div className="flex justify-between text-slate-600">
                    <span>Expected Drawer Cash:</span>
                    <strong className="text-slate-900">${stats.expectedCashInDrawer.toFixed(2)}</strong>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Last Counted Cash:</span>
                    <strong className="text-slate-900">${stats.lastCountedCash.toFixed(2)}</strong>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-slate-200 font-bold">
                    <span>Variance:</span>
                    <span
                      className={`flex items-center gap-0.5 ${
                        stats.cashDifference < 0
                          ? "text-red-600"
                          : stats.cashDifference > 0
                          ? "text-emerald-600"
                          : "text-slate-700"
                      }`}
                    >
                      {stats.cashDifference < 0 ? (
                        <>
                          <ArrowDownRight className="w-4 h-4" /> -${Math.abs(stats.cashDifference).toFixed(2)} (Short)
                        </>
                      ) : stats.cashDifference > 0 ? (
                        <>
                          <ArrowUpRight className="w-4 h-4" /> +${stats.cashDifference.toFixed(2)} (Over)
                        </>
                      ) : (
                        "$0.00 (Balanced)"
                      )}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => setShowClosingModal(true)}
                  className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition"
                >
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
                    {lowStockItems.length} items at or below reorder level
                  </span>
                </div>

                {lowStockItems.length === 0 ? (
                  <div className="py-8 text-center text-slate-400">
                    <CheckCircle className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                    <p className="text-xs font-semibold text-slate-700">All stock levels are healthy</p>
                    <p className="text-[11px] text-slate-400">No items currently below reorder thresholds.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-slate-200 text-slate-400 font-semibold">
                          <th className="pb-2">Item Name</th>
                          <th className="pb-2">Category</th>
                          <th className="pb-2">Current Stock</th>
                          <th className="pb-2">Reorder Level</th>
                          <th className="pb-2 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {lowStockItems.map((item) => (
                          <tr key={item.id} className="hover:bg-slate-50/80">
                            <td className="py-2.5 font-semibold text-slate-800">{item.name}</td>
                            <td className="py-2.5 text-slate-500">{item.category}</td>
                            <td className="py-2.5">
                              <span className="font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded">
                                {item.stock} left
                              </span>
                            </td>
                            <td className="py-2.5 text-slate-500">{item.reorderLevel} units</td>
                            <td className="py-2.5 text-right">
                              <Link
                                href="/pos"
                                className="text-xs font-semibold text-rose-600 hover:text-rose-700 hover:underline"
                              >
                                View Item
                              </Link>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Management Actions */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <Link
                href="/pos"
                className="p-4 bg-white border border-slate-200 hover:border-slate-300 rounded-xl text-left shadow-sm transition group"
              >
                <PlusCircle className="w-5 h-5 text-rose-600 mb-2 group-hover:scale-110 transition" />
                <h4 className="font-bold text-xs text-slate-900">Boutique POS Counter</h4>
                <p className="text-[11px] text-slate-500 mt-0.5">Sell items & print receipts</p>
              </Link>

              <button
                onClick={() => setShowExpenseModal(true)}
                className="p-4 bg-white border border-slate-200 hover:border-slate-300 rounded-xl text-left shadow-sm transition group"
              >
                <DollarSign className="w-5 h-5 text-purple-600 mb-2 group-hover:scale-110 transition" />
                <h4 className="font-bold text-xs text-slate-900">Record Expense</h4>
                <p className="text-[11px] text-slate-500 mt-0.5">Rent, salaries & utilities</p>
              </button>

              <button
                onClick={() => setShowClosingModal(true)}
                className="p-4 bg-white border border-slate-200 hover:border-slate-300 rounded-xl text-left shadow-sm transition group"
              >
                <FileText className="w-5 h-5 text-emerald-600 mb-2 group-hover:scale-110 transition" />
                <h4 className="font-bold text-xs text-slate-900">Daily Cash Closing</h4>
                <p className="text-[11px] text-slate-500 mt-0.5">Physical drawer count reconciliation</p>
              </button>
            </div>
          </>
        ) : null}
      </main>

      {/* Record Expense Modal */}
      {showExpenseModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl relative">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-base text-slate-900">Record Shop Expense</h3>
              <button onClick={() => setShowExpenseModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRecordExpense} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Expense Category</label>
                <select
                  value={expenseForm.category}
                  onChange={(e) => setExpenseForm({ ...expenseForm, category: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm"
                >
                  <option value="Rent">Rent</option>
                  <option value="Salaries">Staff Salaries</option>
                  <option value="Electricity">Electricity & Utilities</option>
                  <option value="Packaging">Bags & Packaging</option>
                  <option value="Marketing">Marketing & Advertising</option>
                  <option value="Maintenance">Maintenance & Repairs</option>
                  <option value="Other">Other Miscellaneous</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Amount ($)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  placeholder="0.00"
                  value={expenseForm.amount}
                  onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Note (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. October boutique rent"
                  value={expenseForm.note}
                  onChange={(e) => setExpenseForm({ ...expenseForm, note: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowExpenseModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingExpense}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl transition"
                >
                  {submittingExpense ? "Recording..." : "Record in Ledger"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Daily Cash Closing Modal */}
      {showClosingModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl relative">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-base text-slate-900">Perform Daily Cash Closing</h3>
              <button onClick={() => setShowClosingModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="my-3 p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-500">Expected in Drawer:</span>
                <span className="font-bold text-slate-900">${stats?.expectedCashInDrawer.toFixed(2)}</span>
              </div>
            </div>

            <form onSubmit={handleDayClosing} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Physical Cash Counted ($)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={closingForm.countedCash}
                  onChange={(e) => setClosingForm({ ...closingForm, countedCash: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm"
                  required
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Closing Notes</label>
                <input
                  type="text"
                  placeholder="e.g. End of day counter reconciliation"
                  value={closingForm.notes}
                  onChange={(e) => setClosingForm({ ...closingForm, notes: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowClosingModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingClosing}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition"
                >
                  {submittingClosing ? "Reconciling..." : "Save Daily Closing"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
