"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  ShoppingBag,
  Sparkles,
  Tag,
} from "lucide-react";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [formData, setFormData] = useState({
    username: "",
    password: "",
    keepSignedIn: false,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [isLockedOut, setIsLockedOut] = useState(false);

  useEffect(() => {
    const errorFromQuery = searchParams.get("error");
    if (errorFromQuery) {
      setError(errorFromQuery);
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLockedOut) return;

    setError("");

    const identifier = formData.username.trim();
    if (!identifier || !formData.password) {
      setError("Please enter your email or username, and password.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: identifier,
          password: formData.password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 429) {
          setIsLockedOut(true);
        }
        setError(data.error || "Invalid username/email or password.");
        setLoading(false);
        return;
      }

      if (data.token) {
        localStorage.setItem("token", data.token);
      }
      if (data.user) {
        localStorage.setItem("user", JSON.stringify(data.user));
      }

      if (data.user.role === "OWNER") {
        router.push("/dashboard");
      } else {
        router.push("/pos");
      }
    } catch {
      setError("Network error. Unable to connect to the authentication service.");
      setLoading(false);
    }
  };

  const handleGoogleSignIn = () => {
    window.location.href = "/api/auth/google";
  };

  return (
    <div className="flex min-h-screen">
      {/* Left Side - Clean Form */}
      <div className="w-full lg:w-[50%] bg-white flex flex-col justify-between">
        {/* Top Header */}
        <header className="px-8 py-6 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-700 to-amber-900 flex items-center justify-center text-white shadow-sm">
              <ShoppingBag className="w-5 h-5 text-amber-100" />
            </div>
            <div>
              <h1 className="text-base font-extrabold text-slate-900 tracking-tight leading-none">
                Boutique POS &amp; Stock
              </h1>
              <span className="text-[11px] font-medium text-slate-400">
                Money &amp; Inventory Control
              </span>
            </div>
          </div>
        </header>

        {/* Form Area */}
        <div className="flex-1 flex items-center justify-center px-8 lg:px-16 xl:px-20 py-8">
          <div className="w-full max-w-md space-y-6">
            <div>
              <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
                Sign in to your shop
              </h2>
              <p className="text-sm text-slate-500 mt-1.5 leading-relaxed">
                Access your boutique counter sales and financial ledger.
              </p>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-xs px-4 py-3 rounded-xl flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                <span className="leading-snug">{error}</span>
              </div>
            )}

            {/* Google Single Sign-On Button */}
            <button
              type="button"
              onClick={handleGoogleSignIn}
              className="w-full py-3 px-4 bg-white border border-slate-300 hover:border-slate-400 hover:bg-slate-50 text-slate-700 font-semibold text-sm rounded-xl shadow-sm transition flex items-center justify-center gap-3"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.26v3.15C3.25 21.37 7.34 24 12 24z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.26C.46 8.17 0 9.97 0 12s.46 3.83 1.26 5.42l4.02-3.15z"
                />
                <path
                  fill="#EA4335"
                  d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.25 2.63 1.26 6.58l4.02 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                />
              </svg>
              <span>Continue with Google</span>
            </button>

            {/* Divider */}
            <div className="relative flex items-center justify-center">
              <div className="border-t border-slate-200 w-full" />
              <span className="bg-white px-3 text-xs text-slate-400 uppercase tracking-wider font-medium">
                or sign in with password
              </span>
              <div className="border-t border-slate-200 w-full" />
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Email or Username
                </label>
                <input
                  type="text"
                  placeholder="Enter email or username"
                  value={formData.username}
                  onChange={(e) =>
                    setFormData({ ...formData, username: e.target.value })
                  }
                  className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-600/40 focus:border-amber-600 transition"
                  required
                  autoFocus
                  autoComplete="username"
                  disabled={loading || isLockedOut}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter password"
                    value={formData.password}
                    onChange={(e) =>
                      setFormData({ ...formData, password: e.target.value })
                    }
                    className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-600/40 focus:border-amber-600 transition pr-12"
                    required
                    autoComplete="current-password"
                    disabled={loading || isLockedOut}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition p-1"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.keepSignedIn}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        keepSignedIn: e.target.checked,
                      })
                    }
                    className="w-4 h-4 rounded border-slate-300 text-amber-700 focus:ring-amber-600"
                  />
                  <span className="text-xs text-slate-600 font-medium">
                    Keep me signed in
                  </span>
                </label>
              </div>

              <button
                type="submit"
                disabled={loading || isLockedOut}
                className="w-full py-3.5 bg-gradient-to-r from-amber-700 to-amber-800 hover:from-amber-800 hover:to-amber-900 text-white font-bold text-sm rounded-xl shadow-lg shadow-amber-900/20 flex items-center justify-center gap-2 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <svg
                      className="animate-spin w-4 h-4"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                      />
                    </svg>
                    Signing in...
                  </span>
                ) : (
                  <>
                    Sign in to workspace <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            <p className="text-center text-sm text-slate-500">
              New boutique setup?{" "}
              <Link
                href="/register"
                className="text-amber-700 hover:text-amber-800 font-bold transition"
              >
                Create Owner account
              </Link>
            </p>
          </div>
        </div>

        {/* Footer */}
        <footer className="px-8 py-5 flex items-center justify-center gap-2 text-[11px] text-slate-400">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>Protected by enterprise-grade encryption &amp; audit ledger</span>
        </footer>
      </div>

      {/* Right Side - Dark Boutique Showcase Panel */}
      <div className="hidden lg:flex lg:w-[50%] bg-gradient-to-br from-stone-900 via-stone-950 to-black flex-col items-center justify-center p-10 relative overflow-hidden">
        {/* Ambient glow */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-900/15 rounded-full blur-[130px]" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-rose-900/10 rounded-full blur-[110px]" />

        <div className="relative z-10 max-w-md w-full space-y-6">
          {/* Header */}
          <div className="text-left space-y-1.5">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-950/80 border border-amber-800/40 text-amber-300 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Boutique Inventory &amp; POS
            </div>
            <h3 className="text-2xl font-extrabold text-white tracking-tight">
              Track Every Garment, Pair &amp; Cent.
            </h3>
            <p className="text-xs text-stone-400 leading-relaxed">
              Purpose-built for clothing boutiques, luxury apparel, footwear, and accessory stores.
            </p>
          </div>

          {/* Boutique Material Cards */}
          <div className="space-y-3">
            {/* Card 1: Dresses & Apparel */}
            <div className="bg-stone-800/60 backdrop-blur-sm border border-stone-700/50 rounded-2xl p-4 flex items-center justify-between shadow-xl">
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-xl bg-rose-950/80 border border-rose-800/40 flex items-center justify-center text-xl shadow-inner">
                  👗
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-xs font-bold text-white">Apparel &amp; Dresses</h4>
                    <span className="text-[10px] font-semibold text-rose-300 bg-rose-950/80 px-1.5 py-0.5 rounded">
                      Sizes &amp; Colors
                    </span>
                  </div>
                  <p className="text-[11px] text-stone-400 mt-0.5">
                    Multi-variant stock: XS, S, M, L, XL with colorways
                  </p>
                </div>
              </div>
              <Tag className="w-4 h-4 text-stone-500" />
            </div>

            {/* Card 2: Footwear & Shoes */}
            <div className="bg-stone-800/60 backdrop-blur-sm border border-stone-700/50 rounded-2xl p-4 flex items-center justify-between shadow-xl">
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-xl bg-amber-950/80 border border-amber-800/40 flex items-center justify-center text-xl shadow-inner">
                  👠
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-xs font-bold text-white">Footwear &amp; Heels</h4>
                    <span className="text-[10px] font-semibold text-amber-300 bg-amber-950/80 px-1.5 py-0.5 rounded">
                      Shoe Sizes
                    </span>
                  </div>
                  <p className="text-[11px] text-stone-400 mt-0.5">
                    EU sizes 36 to 43, heel heights, and box barcode tracking
                  </p>
                </div>
              </div>
              <Tag className="w-4 h-4 text-stone-500" />
            </div>

            {/* Card 3: Bags & Accessories */}
            <div className="bg-stone-800/60 backdrop-blur-sm border border-stone-700/50 rounded-2xl p-4 flex items-center justify-between shadow-xl">
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-xl bg-purple-950/80 border border-purple-800/40 flex items-center justify-center text-xl shadow-inner">
                  👜
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-xs font-bold text-white">Bags &amp; Leather Goods</h4>
                    <span className="text-[10px] font-semibold text-purple-300 bg-purple-950/80 px-1.5 py-0.5 rounded">
                      Weighted Cost
                    </span>
                  </div>
                  <p className="text-[11px] text-stone-400 mt-0.5">
                    Handcrafted accessories, unit costs, and profit margin analysis
                  </p>
                </div>
              </div>
              <Tag className="w-4 h-4 text-stone-500" />
            </div>
          </div>

          {/* Footer Highlights */}
          <div className="pt-2 border-t border-stone-800/80 flex items-center justify-between text-[11px] text-stone-400 font-medium">
            <span>✓ Fast Counter POS Sales</span>
            <span>✓ Real-time P&amp;L Statements</span>
            <span>✓ Zero Manual Overrides</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-50 flex items-center justify-center text-xs text-slate-400">Loading...</div>}>
      <LoginForm />
    </Suspense>
  );
}
