"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ShoppingBag,
  Search,
  Plus,
  Minus,
  Trash2,
  Printer,
  CheckCircle2,
  ArrowLeft,
  DollarSign,
  LogOut,
  RefreshCw,
  AlertCircle,
} from "lucide-react";

interface Variant {
  id: string;
  size: string;
  color: string;
  additionalPrice: number;
  stock: number;
}

interface BoutiqueProduct {
  id: string;
  name: string;
  category: string;
  code: string;
  sellingPrice: number;
  stock: number;
  variants: Variant[];
}

interface CartLine {
  productId: string;
  variantId?: string;
  name: string;
  variantDesc?: string;
  price: number;
  qty: number;
  maxStock: number;
}

interface CompletedSaleData {
  receiptNo: string;
  total: number;
  date: string;
  sellerName: string;
  lines: CartLine[];
}

export default function PosPage() {
  const router = useRouter();
  const [user, setUser] = useState<{ id: string; name: string; username: string; role: string } | null>(null);
  const [token, setToken] = useState<string | null>(null);

  const [products, setProducts] = useState<BoutiqueProduct[]>([]);
  const [categories, setCategories] = useState<string[]>(["ALL"]);
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const [cart, setCart] = useState<CartLine[]>([]);
  const [completedSale, setCompletedSale] = useState<CompletedSaleData | null>(null);

  // 1. Authenticate user & load products
  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");

    if (!storedToken || !storedUser) {
      router.push("/login");
      return;
    }

    try {
      const parsedUser = JSON.parse(storedUser);
      setUser(parsedUser);
      setToken(storedToken);
      loadCatalog(storedToken);
    } catch {
      router.push("/login");
    }
  }, [router]);

  const loadCatalog = async (authToken: string) => {
    try {
      setLoading(true);
      setErrorMessage("");

      const res = await fetch("/api/items", {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      if (!res.ok) {
        if (res.status === 401) {
          router.push("/login");
          return;
        }
        throw new Error("Failed to load inventory from database.");
      }

      const data = await res.json();
      const items: BoutiqueProduct[] = data.items || [];
      setProducts(items);

      // Extract unique categories
      const uniqueCats = ["ALL", ...Array.from(new Set(items.map((i) => i.category).filter(Boolean)))];
      setCategories(uniqueCats);
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to connect to database.");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    router.push("/login");
  };

  const filteredProducts = products.filter((p) => {
    const matchesCat = selectedCategory === "ALL" || p.category === selectedCategory;
    const matchesSearch =
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.code && p.code.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesCat && matchesSearch;
  });

  const addToCart = (product: BoutiqueProduct, variant?: Variant) => {
    const maxStock = variant ? variant.stock : product.stock;
    if (maxStock <= 0) return;

    const existingIndex = cart.findIndex(
      (c) => c.productId === product.id && c.variantId === variant?.id
    );

    if (existingIndex > -1) {
      if (cart[existingIndex].qty >= maxStock) return; // Cannot exceed stock
      const updated = [...cart];
      updated[existingIndex].qty += 1;
      setCart(updated);
    } else {
      setCart([
        ...cart,
        {
          productId: product.id,
          variantId: variant?.id,
          name: product.name,
          variantDesc: variant ? `Size: ${variant.size} • Color: ${variant.color}` : undefined,
          price: product.sellingPrice + (variant?.additionalPrice || 0),
          qty: 1,
          maxStock,
        },
      ]);
    }
  };

  const updateQty = (index: number, delta: number) => {
    const updated = [...cart];
    const newQty = updated[index].qty + delta;
    if (newQty <= 0) {
      updated.splice(index, 1);
    } else if (newQty <= updated[index].maxStock) {
      updated[index].qty = newQty;
    }
    setCart(updated);
  };

  const removeLine = (index: number) => {
    setCart(cart.filter((_, i) => i !== index));
  };

  const totalAmount = cart.reduce((sum, item) => sum + item.price * item.qty, 0);

  const handleCheckout = async () => {
    if (cart.length === 0 || !user || !token) return;

    try {
      setCheckoutLoading(true);
      setErrorMessage("");

      const payload = {
        sellerId: user.id,
        lines: cart.map((line) => ({
          itemId: line.productId,
          variantId: line.variantId || null,
          quantity: line.qty,
        })),
        discountAmount: 0,
      };

      const res = await fetch("/api/sales/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Sale checkout failed.");
      }

      // Record completed sale for receipt
      setCompletedSale({
        receiptNo: data.sale.receiptNo,
        total: Number(data.sale.totalAmount),
        date: new Date(data.sale.date || Date.now()).toLocaleString(),
        sellerName: user.name,
        lines: [...cart],
      });

      // Clear cart
      setCart([]);

      // Reload real inventory stock immediately from DB
      await loadCatalog(token);
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to process checkout transaction.");
    } finally {
      setCheckoutLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-slate-100 overflow-hidden">
      {/* Top Header */}
      <header className="bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between no-print">
        <div className="flex items-center gap-4">
          <Link
            href="/"
            className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back
          </Link>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-rose-600 text-white flex items-center justify-center font-bold">
              <ShoppingBag className="w-4 h-4" />
            </div>
            <div>
              <h1 className="text-base font-bold text-slate-900">Elegance Boutique POS</h1>
              <p className="text-xs text-slate-400">Seller Terminal • Live SQL Server Ledger</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={() => token && loadCatalog(token)}
            title="Refresh Stock"
            className="p-2 text-slate-400 hover:text-slate-700 bg-slate-50 hover:bg-slate-100 rounded-lg transition"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>

          <div className="text-right">
            <span className="text-xs text-slate-400 block">Logged in as</span>
            <span className="text-sm font-semibold text-slate-800">
              {user ? `${user.name} (${user.role})` : "Loading..."}
            </span>
          </div>

          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />

          <button
            onClick={handleLogout}
            title="Sign out"
            className="p-2 text-slate-400 hover:text-red-600 bg-slate-50 hover:bg-red-50 rounded-lg transition"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Error banner if any */}
      {errorMessage && (
        <div className="bg-red-50 border-b border-red-200 px-6 py-2 flex items-center gap-2 text-xs text-red-700 font-medium">
          <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Main Workspace */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left: Product Catalog */}
        <section className="flex-1 flex flex-col p-4 overflow-hidden border-r border-slate-200">
          {/* Search & Categories */}
          <div className="flex flex-col gap-3 mb-4">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                placeholder="Search items by name or SKU / barcode..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 transition"
              />
            </div>

            <div className="flex gap-2 overflow-x-auto pb-1">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${selectedCategory === cat
                      ? "bg-rose-600 text-white shadow-sm"
                      : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
                    }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Product Grid */}
          {loading ? (
            <div className="flex-1 flex items-center justify-center text-slate-400">
              <RefreshCw className="w-6 h-6 animate-spin mr-2 text-rose-500" />
              <span className="text-sm font-medium">Loading live boutique inventory...</span>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
              <ShoppingBag className="w-12 h-12 stroke-[1.5] mb-2 text-slate-300" />
              <p className="text-sm font-semibold text-slate-600">No products found</p>
              <p className="text-xs text-slate-400 mt-1">Check search term or select another category.</p>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pr-1">
              {filteredProducts.map((product) => (
                <div
                  key={product.id}
                  className="bg-white border border-slate-200 rounded-xl p-3.5 flex flex-col justify-between hover:border-slate-300 transition shadow-sm"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <span className="text-[11px] font-bold text-rose-600 uppercase tracking-wider">
                        {product.category}
                      </span>
                      {product.code && (
                        <span className="text-[11px] font-mono text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                          {product.code}
                        </span>
                      )}
                    </div>
                    <h3 className="font-semibold text-slate-900 text-sm leading-snug">{product.name}</h3>
                    <div className="mt-2 flex items-baseline justify-between">
                      <span className="text-base font-bold text-slate-900">
                        ${product.sellingPrice.toFixed(2)}
                      </span>
                      <span className="text-xs text-slate-500">
                        Total Stock:{" "}
                        <strong
                          className={
                            product.stock <= 3
                              ? "text-red-600 font-bold"
                              : "text-slate-800"
                          }
                        >
                          {product.stock}
                        </strong>
                      </span>
                    </div>
                  </div>

                  {/* Variants Selection */}
                  <div className="mt-3 pt-3 border-t border-slate-100 space-y-1.5">
                    <span className="text-[11px] font-semibold text-slate-400 block">
                      {product.variants.length > 0 ? "Select Variant:" : "Standard Item:"}
                    </span>
                    <div className="grid grid-cols-1 gap-1">
                      {product.variants.length > 0 ? (
                        product.variants.map((v) => (
                          <button
                            key={v.id}
                            disabled={v.stock <= 0}
                            onClick={() => addToCart(product, v)}
                            className={`w-full flex items-center justify-between text-xs px-2.5 py-1.5 rounded-lg border transition ${v.stock <= 0
                                ? "bg-slate-50 text-slate-300 border-slate-100 cursor-not-allowed"
                                : "bg-slate-50 hover:bg-rose-50 text-slate-700 hover:text-rose-700 border-slate-200 hover:border-rose-300 font-medium"
                              }`}
                          >
                            <span>
                              {v.size} ({v.color})
                              {v.additionalPrice > 0 && ` +$${v.additionalPrice.toFixed(2)}`}
                            </span>
                            <span className="text-[11px] text-slate-500">
                              {v.stock > 0 ? `${v.stock} in stock` : "Out of stock"}
                            </span>
                          </button>
                        ))
                      ) : (
                        <button
                          disabled={product.stock <= 0}
                          onClick={() => addToCart(product)}
                          className={`w-full flex items-center justify-between text-xs px-2.5 py-1.5 rounded-lg border transition ${product.stock <= 0
                              ? "bg-slate-50 text-slate-300 border-slate-100 cursor-not-allowed"
                              : "bg-slate-50 hover:bg-rose-50 text-slate-700 hover:text-rose-700 border-slate-200 hover:border-rose-300 font-medium"
                            }`}
                        >
                          <span>Standard</span>
                          <span className="text-[11px] text-slate-500">
                            {product.stock > 0 ? `${product.stock} in stock` : "Out of stock"}
                          </span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Right: Cart & Fast Checkout */}
        <aside className="w-96 bg-white flex flex-col justify-between border-l border-slate-200">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="font-bold text-slate-900 flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-rose-600" /> Current Sale Cart
            </h2>
            <span className="text-xs bg-rose-100 text-rose-700 font-bold px-2 py-0.5 rounded-full">
              {cart.reduce((s, i) => s + i.qty, 0)} items
            </span>
          </div>

          {/* Cart Item Lines */}
          <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-300 space-y-2">
                <ShoppingBag className="w-12 h-12 stroke-[1.5]" />
                <p className="text-sm font-medium text-slate-400">Cart is empty</p>
                <p className="text-xs text-slate-400 text-center max-w-[200px]">
                  Click an item variant on the left to add it to the sale.
                </p>
              </div>
            ) : (
              cart.map((line, index) => (
                <div
                  key={`${line.productId}-${line.variantId || "std"}`}
                  className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex flex-col gap-2"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-semibold text-xs text-slate-900 leading-snug">{line.name}</h4>
                      {line.variantDesc && (
                        <p className="text-[11px] text-slate-500 mt-0.5">{line.variantDesc}</p>
                      )}
                    </div>
                    <button
                      onClick={() => removeLine(index)}
                      className="text-slate-400 hover:text-red-500 p-1 transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="flex items-center justify-between pt-1 border-t border-slate-200/60">
                    <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-lg p-0.5">
                      <button
                        onClick={() => updateQty(index, -1)}
                        className="w-6 h-6 flex items-center justify-center rounded hover:bg-slate-100 text-slate-600"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-7 text-center font-bold text-xs text-slate-800">
                        {line.qty}
                      </span>
                      <button
                        onClick={() => updateQty(index, 1)}
                        disabled={line.qty >= line.maxStock}
                        className={`w-6 h-6 flex items-center justify-center rounded ${line.qty >= line.maxStock
                            ? "text-slate-300 cursor-not-allowed"
                            : "hover:bg-slate-100 text-slate-600"
                          }`}
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>

                    <div className="text-right">
                      <span className="text-[11px] text-slate-400 block">
                        ${line.price.toFixed(2)} x {line.qty}
                      </span>
                      <span className="font-bold text-sm text-slate-900">
                        ${(line.price * line.qty).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Checkout Bar */}
          <div className="p-4 border-t border-slate-200 bg-slate-50 space-y-3">
            <div className="space-y-1 text-sm">
              <div className="flex justify-between text-slate-500">
                <span>Subtotal</span>
                <span>${totalAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-bold text-base text-slate-900 pt-1 border-t border-slate-200">
                <span>Total Due</span>
                <span className="text-rose-600">${totalAmount.toFixed(2)}</span>
              </div>
            </div>

            <button
              disabled={cart.length === 0 || checkoutLoading}
              onClick={handleCheckout}
              className={`w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 shadow-sm transition ${cart.length === 0 || checkoutLoading
                  ? "bg-slate-200 text-slate-400 cursor-not-allowed"
                  : "bg-rose-600 hover:bg-rose-700 text-white shadow-rose-200 active:scale-[0.99]"
                }`}
            >
              {checkoutLoading ? (
                <span className="flex items-center gap-2">
                  <RefreshCw className="w-4 h-4 animate-spin" /> Recording Sale in Ledger...
                </span>
              ) : (
                <>
                  <DollarSign className="w-5 h-5" /> Complete Sale & Print Receipt
                </>
              )}
            </button>
          </div>
        </aside>
      </div>

      {/* Printable Receipt Modal */}
      {completedSale && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl relative">
            <div className="text-center pb-4 border-b border-dashed border-slate-300">
              <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
              <h3 className="font-bold text-lg text-slate-900">Elegance Boutique</h3>
              <p className="text-xs text-slate-500">100 Fashion Blvd, Suite 4B</p>
              <p className="text-xs text-slate-500">Tel: +1 234 567 890</p>
              <div className="mt-3 text-left text-[11px] text-slate-500 space-y-0.5">
                <p>
                  Receipt No: <strong className="text-slate-800">{completedSale.receiptNo}</strong>
                </p>
                <p>Date: {completedSale.date}</p>
                <p>Seller: {completedSale.sellerName}</p>
              </div>
            </div>

            <div className="py-4 space-y-2 border-b border-dashed border-slate-300 max-h-48 overflow-y-auto">
              {completedSale.lines.map((l, i) => (
                <div key={i} className="flex justify-between text-xs">
                  <div>
                    <span className="font-medium text-slate-800">{l.name}</span>
                    {l.variantDesc && (
                      <span className="text-[10px] text-slate-400 block">{l.variantDesc}</span>
                    )}
                    <span className="text-[11px] text-slate-500">
                      {l.qty} @ ${l.price.toFixed(2)}
                    </span>
                  </div>
                  <span className="font-semibold text-slate-800">
                    ${(l.qty * l.price).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>

            <div className="py-3 flex justify-between items-baseline font-bold text-base text-slate-900">
              <span>TOTAL PAID</span>
              <span className="text-lg text-rose-600">${completedSale.total.toFixed(2)}</span>
            </div>

            <p className="text-[10px] text-center text-slate-400 pt-2 border-t border-slate-100">
              Thank you for visiting Elegance Boutique! Goods once sold cannot be returned without receipt.
            </p>

            <div className="mt-5 grid grid-cols-2 gap-2 no-print">
              <button
                onClick={() => window.print()}
                className="py-2.5 px-3 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded-xl flex items-center justify-center gap-1.5 transition"
              >
                <Printer className="w-3.5 h-3.5" /> Print
              </button>
              <button
                onClick={() => setCompletedSale(null)}
                className="py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition"
              >
                New Sale
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
