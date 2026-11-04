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
  Users,
  UserCheck,
  UserX,
  KeyRound,
  ShieldAlert,
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

interface StaffMember {
  id: string;
  name: string;
  username: string;
  email: string | null;
  role: string;
  status: string;
  createdAt: string;
  totalSales: number;
}

export default function OwnerDashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<{ id: string; name: string; username: string; role: string } | null>(null);
  const [token, setToken] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<"FINANCIALS" | "STAFF">("FINANCIALS");
  const [selectedPeriod, setSelectedPeriod] = useState<"TODAY" | "WEEK" | "MONTH">("MONTH");
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [lowStockItems, setLowStockItems] = useState<LowStockItem[]>([]);
  const [recentSales, setRecentSales] = useState<RecentSale[]>([]);
  const [staffList, setStaffList] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Expense Modal
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [expenseForm, setExpenseForm] = useState({ category: "Rent", amount: "", note: "" });
  const [submittingExpense, setSubmittingExpense] = useState(false);

  // Day Closing Modal
  const [showClosingModal, setShowClosingModal] = useState(false);
  const [closingForm, setClosingForm] = useState({ countedCash: "", notes: "" });
  const [submittingClosing, setSubmittingClosing] = useState(false);

  // Add Seller Modal
  const [showAddSellerModal, setShowAddSellerModal] = useState(false);
  const [sellerForm, setSellerForm] = useState({
    name: "",
    username: "",
    email: "",
    password: "",
  });
  const [submittingSeller, setSubmittingSeller] = useState(false);
  const [sellerModalError, setSellerModalError] = useState("");

  // Reset Password Modal
  const [showResetPasswordModal, setShowResetPasswordModal] = useState(false);
  const [resetTargetUser, setResetTargetUser] = useState<StaffMember | null>(null);
  const [newPasswordInput, setNewPasswordInput] = useState("");
  const [submittingReset, setSubmittingReset] = useState(false);

  // 1. Auth check & Load data
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
      fetchStaffList(storedToken);
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

  const fetchStaffList = async (authToken: string) => {
    try {
      const res = await fetch("/api/sellers", {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (res.ok) {
        const data = await res.json();
        setStaffList(data.staff || []);
      }
    } catch {
      // Non-blocking
    }
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {}
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

  // Add staff seller
  const handleCreateSeller = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setSellerModalError("");
    setSubmittingSeller(true);

    try {
      const res = await fetch("/api/sellers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: sellerForm.name,
          username: sellerForm.username,
          email: sellerForm.email || undefined,
          password: sellerForm.password,
          role: "SELLER",
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to create seller account.");
      }

      setShowAddSellerModal(false);
      setSellerForm({ name: "", username: "", email: "", password: "" });
      fetchStaffList(token);
    } catch (err: any) {
      setSellerModalError(err.message);
    } finally {
      setSubmittingSeller(false);
    }
  };

  // Toggle staff member active/disabled
  const handleToggleStaffStatus = async (staffMember: StaffMember) => {
    if (!token) return;
    const newStatus = staffMember.status === "ACTIVE" ? "DISABLED" : "ACTIVE";
    const confirmMsg =
      newStatus === "DISABLED"
        ? `Are you sure you want to deactivate ${staffMember.name}? They will immediately lose access to the POS counter.`
        : `Reactivate ${staffMember.name}? They will be able to log in to the POS counter again.`;

    if (!confirm(confirmMsg)) return;

    try {
      const res = await fetch(`/api/sellers/${staffMember.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!res.ok) {
        const d = await res.json();
        alert(d.error || "Failed to update staff status.");
        return;
      }

      fetchStaffList(token);
    } catch {
      alert("Network error.");
    }
  };

  // Owner resets staff password
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !resetTargetUser || !newPasswordInput) return;
    setSubmittingReset(true);

    try {
      const res = await fetch(`/api/sellers/${resetTargetUser.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ newPassword: newPasswordInput }),
      });

      const d = await res.json();
      if (!res.ok) {
        alert(d.error || "Failed to reset password.");
        return;
      }

      alert(`Password successfully updated for ${resetTargetUser.name}!`);
      setShowResetPasswordModal(false);
      setResetTargetUser(null);
      setNewPasswordInput("");
    } catch {
      alert("Network error.");
    } finally {
      setSubmittingReset(false);
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
            <h1 className="text-xl font-bold text-slate-900">Owner Financial &amp; Staff Backoffice</h1>
            <p className="text-xs text-slate-400">
              Elegance Boutique • Real-Time SQL Server Ledger • {user ? `Signed in as ${user.name}` : ""}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Main Navigation Tabs */}
          <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-semibold">
            <button
              onClick={() => setActiveTab("FINANCIALS")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition ${
                activeTab === "FINANCIALS"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5 text-emerald-600" /> Financials &amp; Stock
            </button>
            <button
              onClick={() => setActiveTab("STAFF")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition ${
                activeTab === "STAFF"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              <Users className="w-3.5 h-3.5 text-blue-600" /> Staff &amp; Sellers ({staffList.length})
            </button>
          </div>

          {activeTab === "FINANCIALS" && (
            <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-semibold">
              {(["TODAY", "WEEK", "MONTH"] as const).map((p) => (
                <button
                  key={p}
                  onClick={() => setSelectedPeriod(p)}
                  className={`px-3 py-1.5 rounded-lg transition ${
                    selectedPeriod === p
                      ? "bg-white text-slate-900 shadow-sm"
                      : "text-slate-500 hover:text-slate-900"
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          )}

          <button
            onClick={() => {
              if (token) {
                fetchDashboardData(token, selectedPeriod);
                fetchStaffList(token);
              }
            }}
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
        {/* ================= TAB 1: FINANCIALS & STOCK ================= */}
        {activeTab === "FINANCIALS" && (
          <>
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
                      <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Expenses &amp; Write-offs</span>
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
                        Derived from all incoming &amp; outgoing cash movements in the ledger.
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
                        <h3 className="font-bold text-slate-900 text-sm">Low-Stock &amp; Reorder Alerts</h3>
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
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <Link
                    href="/pos"
                    className="p-4 bg-white border border-slate-200 hover:border-slate-300 rounded-xl text-left shadow-sm transition group"
                  >
                    <PlusCircle className="w-5 h-5 text-rose-600 mb-2 group-hover:scale-110 transition" />
                    <h4 className="font-bold text-xs text-slate-900">Boutique POS Counter</h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">Sell items &amp; print receipts</p>
                  </Link>

                  <button
                    onClick={() => setShowExpenseModal(true)}
                    className="p-4 bg-white border border-slate-200 hover:border-slate-300 rounded-xl text-left shadow-sm transition group"
                  >
                    <DollarSign className="w-5 h-5 text-purple-600 mb-2 group-hover:scale-110 transition" />
                    <h4 className="font-bold text-xs text-slate-900">Record Expense</h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">Rent, salaries &amp; utilities</p>
                  </button>

                  <button
                    onClick={() => setShowClosingModal(true)}
                    className="p-4 bg-white border border-slate-200 hover:border-slate-300 rounded-xl text-left shadow-sm transition group"
                  >
                    <FileText className="w-5 h-5 text-emerald-600 mb-2 group-hover:scale-110 transition" />
                    <h4 className="font-bold text-xs text-slate-900">Daily Cash Closing</h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">Physical drawer count reconciliation</p>
                  </button>

                  <button
                    onClick={() => setActiveTab("STAFF")}
                    className="p-4 bg-white border border-slate-200 hover:border-slate-300 rounded-xl text-left shadow-sm transition group"
                  >
                    <Users className="w-5 h-5 text-blue-600 mb-2 group-hover:scale-110 transition" />
                    <h4 className="font-bold text-xs text-slate-900">Manage Staff / Sellers</h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">Add, deactivate &amp; reset PINs</p>
                  </button>
                </div>
              </>
            ) : null}
          </>
        )}

        {/* ================= TAB 2: STAFF & SELLERS MANAGEMENT ================= */}
        {activeTab === "STAFF" && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Users className="w-5 h-5 text-blue-600" /> Boutique Staff &amp; Cashiers
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Create accounts for counter sellers, toggle access permissions, or reset staff passwords. Sellers can only access the POS counter and have zero visibility into buying prices or profits.
                </p>
              </div>

              <button
                onClick={() => {
                  setSellerModalError("");
                  setShowAddSellerModal(true);
                }}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-sm transition shrink-0"
              >
                <PlusCircle className="w-4 h-4" /> + Add New Seller
              </button>
            </div>

            {/* Staff Members Table */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold">
                      <th className="py-3 px-4">Staff Member</th>
                      <th className="py-3 px-4">Username / Email</th>
                      <th className="py-3 px-4">Role</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Completed Sales</th>
                      <th className="py-3 px-4">Date Added</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {staffList.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-8 text-center text-slate-400">
                          No staff accounts found. Click &quot;+ Add New Seller&quot; above to create counter credentials.
                        </td>
                      </tr>
                    ) : (
                      staffList.map((member) => (
                        <tr key={member.id} className="hover:bg-slate-50/70 transition">
                          <td className="py-3 px-4">
                            <span className="font-bold text-slate-900">{member.name}</span>
                            {member.id === user?.id && (
                              <span className="ml-2 text-[10px] font-semibold bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded">
                                You (Owner)
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 font-mono text-slate-600">
                            <div>{member.username}</div>
                            {member.email && <div className="text-[11px] text-slate-400">{member.email}</div>}
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                                member.role === "OWNER"
                                  ? "bg-amber-50 text-amber-800 border border-amber-200"
                                  : "bg-blue-50 text-blue-800 border border-blue-200"
                              }`}
                            >
                              {member.role === "OWNER" ? "👑 Owner" : "🏷️ Seller"}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold ${
                                member.status === "ACTIVE"
                                  ? "bg-emerald-50 text-emerald-700"
                                  : "bg-red-50 text-red-700"
                              }`}
                            >
                              <span
                                className={`w-1.5 h-1.5 rounded-full ${
                                  member.status === "ACTIVE" ? "bg-emerald-500" : "bg-red-500"
                                }`}
                              />
                              {member.status === "ACTIVE" ? "Active" : "Disabled"}
                            </span>
                          </td>
                          <td className="py-3 px-4 font-semibold text-slate-700">
                            {member.totalSales} sales
                          </td>
                          <td className="py-3 px-4 text-slate-400">
                            {new Date(member.createdAt).toLocaleDateString()}
                          </td>
                          <td className="py-3 px-4 text-right">
                            {member.id !== user?.id ? (
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  onClick={() => {
                                    setResetTargetUser(member);
                                    setNewPasswordInput("");
                                    setShowResetPasswordModal(true);
                                  }}
                                  className="text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-2.5 py-1 rounded-lg transition flex items-center gap-1"
                                >
                                  <KeyRound className="w-3 h-3" /> Reset Password
                                </button>

                                <button
                                  onClick={() => handleToggleStaffStatus(member)}
                                  className={`text-xs font-semibold px-2.5 py-1 rounded-lg transition flex items-center gap-1 ${
                                    member.status === "ACTIVE"
                                      ? "text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100"
                                      : "text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100"
                                  }`}
                                >
                                  {member.status === "ACTIVE" ? (
                                    <>
                                      <UserX className="w-3 h-3" /> Deactivate
                                    </>
                                  ) : (
                                    <>
                                      <UserCheck className="w-3 h-3" /> Activate
                                    </>
                                  )}
                                </button>
                              </div>
                            ) : (
                              <span className="text-[11px] text-slate-400 italic">Primary Account</span>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* ================= MODAL: ADD NEW SELLER ================= */}
      {showAddSellerModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl relative">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-600" /> Add Counter Seller
              </h3>
              <button
                onClick={() => setShowAddSellerModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {sellerModalError && (
              <div className="mt-3 bg-red-50 border border-red-200 text-red-700 text-xs px-3 py-2 rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                <span>{sellerModalError}</span>
              </div>
            )}

            <form onSubmit={handleCreateSeller} className="mt-4 space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Seller Full Name</label>
                <input
                  type="text"
                  placeholder="e.g. Sarah Jenkins"
                  value={sellerForm.name}
                  onChange={(e) => setSellerForm({ ...sellerForm, name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm"
                  required
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Username (for sign in)</label>
                <input
                  type="text"
                  placeholder="e.g. sarah_counter1"
                  value={sellerForm.username}
                  onChange={(e) => setSellerForm({ ...sellerForm, username: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Email <span className="text-slate-400 font-normal">(optional)</span>
                </label>
                <input
                  type="email"
                  placeholder="sarah@example.com"
                  value={sellerForm.email}
                  onChange={(e) => setSellerForm({ ...sellerForm, email: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Temporary Password / PIN <span className="text-slate-400">(min 8 chars)</span>
                </label>
                <input
                  type="password"
                  placeholder="At least 8 chars with letters & numbers"
                  value={sellerForm.password}
                  onChange={(e) => setSellerForm({ ...sellerForm, password: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm"
                  required
                />
              </div>

              <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl text-[11px] text-blue-900 leading-snug">
                🔒 <strong>Restricted Access:</strong> Sellers can only operate counter sales and look up items at the POS screen. They will never see buying prices, expenses, or profit calculations.
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddSellerModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingSeller}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition"
                >
                  {submittingSeller ? "Creating account..." : "Create Seller Account"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: RESET STAFF PASSWORD ================= */}
      {showResetPasswordModal && resetTargetUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-xl relative">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-amber-600" /> Reset Password
              </h3>
              <button
                onClick={() => setShowResetPasswordModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-500 mt-3">
              Set a new password for <strong>{resetTargetUser.name}</strong> ({resetTargetUser.username}).
            </p>

            <form onSubmit={handleResetPassword} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">New Password</label>
                <input
                  type="password"
                  placeholder="Min 8 characters"
                  value={newPasswordInput}
                  onChange={(e) => setNewPasswordInput(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm"
                  required
                  autoFocus
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowResetPasswordModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingReset}
                  className="px-4 py-2 bg-amber-700 hover:bg-amber-800 text-white text-xs font-bold rounded-xl transition"
                >
                  {submittingReset ? "Updating..." : "Update Password"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: RECORD EXPENSE ================= */}
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
                  <option value="Electricity">Electricity &amp; Utilities</option>
                  <option value="Packaging">Bags &amp; Packaging</option>
                  <option value="Marketing">Marketing &amp; Advertising</option>
                  <option value="Maintenance">Maintenance &amp; Repairs</option>
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

      {/* ================= MODAL: DAILY CASH CLOSING ================= */}
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
