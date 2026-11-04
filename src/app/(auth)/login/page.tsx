"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, ArrowRight, ShieldCheck } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    keepSignedIn: false,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: formData.username,
          password: formData.password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Login failed.");
        setLoading(false);
        return;
      }

      // Store token and user data
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));

      // Redirect based on role
      if (data.user.role === "OWNER") {
        router.push("/dashboard");
      } else {
        router.push("/pos");
      }
    } catch (err) {
      setError("Network error. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen">
      {/* Left Side - Login Form */}
      <div className="w-full lg:w-[52%] bg-white flex flex-col">
        {/* Top Header */}
        <header className="px-8 py-6 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-amber-700 to-amber-900 flex items-center justify-center text-white font-bold text-sm shadow-sm">
              S
            </div>
            <div>
              <h1 className="text-sm font-bold text-slate-900 tracking-tight leading-none">
                SOLEIL
              </h1>
              <span className="text-[10px] font-medium text-slate-400 tracking-[0.2em] uppercase">
                Commerce
              </span>
            </div>
          </div>
          <span className="text-xs text-slate-400 font-medium">
            Secure shop management
          </span>
        </header>

        {/* Form Area */}
        <div className="flex-1 flex items-center justify-center px-8 lg:px-16 xl:px-24">
          <div className="w-full max-w-md space-y-8">
            <div>
              <p className="text-xs font-bold text-amber-700 tracking-[0.2em] uppercase mb-3">
                Control. Clarity. Growth.
              </p>
              <h2 className="text-4xl font-extrabold text-slate-900 tracking-tight">
                Welcome back.
              </h2>
              <p className="text-sm text-slate-500 mt-2 leading-relaxed">
                Sign in to see exactly where your stock and money stand today.
              </p>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Email address
                </label>
                <input
                  type="text"
                  placeholder="owner@soleil.shop"
                  value={formData.username}
                  onChange={(e) =>
                    setFormData({ ...formData, username: e.target.value })
                  }
                  className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-600/40 focus:border-amber-600 transition"
                  required
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••••"
                    value={formData.password}
                    onChange={(e) =>
                      setFormData({ ...formData, password: e.target.value })
                    }
                    className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-600/40 focus:border-amber-600 transition pr-12"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition"
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
                <button
                  type="button"
                  className="text-xs text-amber-700 hover:text-amber-800 font-semibold transition"
                >
                  Forgot password?
                </button>
              </div>

              <button
                type="submit"
                disabled={loading}
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
              New to Soleil?{" "}
              <Link
                href="/register"
                className="text-amber-700 hover:text-amber-800 font-bold transition"
              >
                Create an account
              </Link>
            </p>
          </div>
        </div>

        {/* Footer */}
        <footer className="px-8 py-5 flex items-center justify-center gap-2 text-[11px] text-slate-400">
          <ShieldCheck className="w-3 h-3" />
          <span>Protected by enterprise-grade encryption</span>
          <span className="mx-1">·</span>
          <span>v2.0</span>
        </footer>
      </div>

      {/* Right Side - Dark Branded Panel */}
      <div className="hidden lg:flex lg:w-[48%] bg-gradient-to-br from-stone-900 via-stone-950 to-black flex-col items-center justify-center p-12 relative overflow-hidden">
        {/* Background accent */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-900/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-amber-800/10 rounded-full blur-[100px]" />

        <div className="relative z-10 text-center space-y-10 max-w-lg">
          {/* Live Profit Card */}
          <div className="bg-stone-800/60 backdrop-blur-sm border border-stone-700/50 rounded-2xl p-6 shadow-2xl max-w-xs mx-auto">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs text-stone-400 font-medium">
                Today&apos;s net profit
              </span>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[11px] text-emerald-400 font-semibold">
                  Live
                </span>
              </div>
            </div>
            <p className="text-3xl font-extrabold text-white tracking-tight">
              $2,480.50
            </p>
            <div className="flex items-center gap-1.5 mt-2">
              <svg
                className="w-3.5 h-3.5 text-emerald-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M2 20l5.5-5.5L11 18l9-11"
                />
              </svg>
              <span className="text-xs text-emerald-400 font-semibold">
                18.4% from yesterday
              </span>
            </div>

            {/* Mini bar chart */}
            <div className="flex items-end gap-1.5 mt-6 h-16 justify-center">
              {[35, 45, 30, 55, 40, 65, 50, 80, 70, 95].map((h, i) => (
                <div
                  key={i}
                  className="w-3 rounded-sm"
                  style={{
                    height: `${h}%`,
                    backgroundColor:
                      i >= 7
                        ? "rgb(180, 140, 80)"
                        : "rgba(180, 140, 80, 0.35)",
                  }}
                />
              ))}
            </div>
          </div>

          {/* Motivational Quote */}
          <div className="space-y-4">
            <h3 className="text-3xl lg:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-100 to-amber-300 leading-tight">
              &ldquo;What gets measured,
              <br />
              gets mastered.&rdquo;
            </h3>
            <p className="text-xs font-bold text-stone-500 tracking-[0.25em] uppercase">
              Every product. Every sale. Every cent.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

