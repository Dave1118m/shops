"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, ArrowRight, ShieldCheck, UserPlus } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    username: "",
    password: "",
    confirmPassword: "",
    role: "OWNER",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email || undefined,
          username: formData.username,
          password: formData.password,
          role: formData.role,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Registration failed.");
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
      {/* Left Side - Register Form */}
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
          <div className="w-full max-w-md space-y-6">
            <div>
              <p className="text-xs font-bold text-amber-700 tracking-[0.2em] uppercase mb-3">
                Get Started
              </p>
              <h2 className="text-4xl font-extrabold text-slate-900 tracking-tight">
                Create account.
              </h2>
              <p className="text-sm text-slate-500 mt-2 leading-relaxed">
                Set up your shop workspace and start tracking every product and
                cent.
              </p>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Full name
                </label>
                <input
                  type="text"
                  placeholder="John Doe"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-600/40 focus:border-amber-600 transition"
                  required
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Email address{" "}
                  <span className="text-slate-400 font-normal">(optional)</span>
                </label>
                <input
                  type="email"
                  placeholder="you@example.com"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-600/40 focus:border-amber-600 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Username
                </label>
                <input
                  type="text"
                  placeholder="shopowner"
                  value={formData.username}
                  onChange={(e) =>
                    setFormData({ ...formData, username: e.target.value })
                  }
                  className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-600/40 focus:border-amber-600 transition"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder="Min 6 chars"
                      value={formData.password}
                      onChange={(e) =>
                        setFormData({ ...formData, password: e.target.value })
                      }
                      className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-600/40 focus:border-amber-600 transition pr-10"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition"
                    >
                      {showPassword ? (
                        <EyeOff className="w-3.5 h-3.5" />
                      ) : (
                        <Eye className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Confirm password
                  </label>
                  <input
                    type="password"
                    placeholder="Re-enter"
                    value={formData.confirmPassword}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        confirmPassword: e.target.value,
                      })
                    }
                    className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-600/40 focus:border-amber-600 transition"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Account type
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() =>
                      setFormData({ ...formData, role: "OWNER" })
                    }
                    className={`py-3 px-4 rounded-xl border text-sm font-semibold transition ${
                      formData.role === "OWNER"
                        ? "bg-amber-50 border-amber-600 text-amber-800 ring-2 ring-amber-600/20"
                        : "bg-white border-slate-300 text-slate-600 hover:border-slate-400"
                    }`}
                  >
                    👑 Shop Owner
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setFormData({ ...formData, role: "SELLER" })
                    }
                    className={`py-3 px-4 rounded-xl border text-sm font-semibold transition ${
                      formData.role === "SELLER"
                        ? "bg-amber-50 border-amber-600 text-amber-800 ring-2 ring-amber-600/20"
                        : "bg-white border-slate-300 text-slate-600 hover:border-slate-400"
                    }`}
                  >
                    🏷️ Seller
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 bg-gradient-to-r from-amber-700 to-amber-800 hover:from-amber-800 hover:to-amber-900 text-white font-bold text-sm rounded-xl shadow-lg shadow-amber-900/20 flex items-center justify-center gap-2 transition disabled:opacity-50 disabled:cursor-not-allowed mt-2"
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
                    Creating account...
                  </span>
                ) : (
                  <>
                    Create account <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            <p className="text-center text-sm text-slate-500">
              Already have an account?{" "}
              <Link
                href="/login"
                className="text-amber-700 hover:text-amber-800 font-bold transition"
              >
                Sign in
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
          {/* Feature card */}
          <div className="bg-stone-800/60 backdrop-blur-sm border border-stone-700/50 rounded-2xl p-6 shadow-2xl max-w-xs mx-auto">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-amber-900/40 flex items-center justify-center">
                <UserPlus className="w-5 h-5 text-amber-400" />
              </div>
              <div className="text-left">
                <p className="text-sm font-bold text-white">Ready in 60 seconds</p>
                <p className="text-xs text-stone-400">
                  Add products & start selling
                </p>
              </div>
            </div>

            <div className="space-y-2.5 mt-4">
              {[
                { step: "1", text: "Create your account" },
                { step: "2", text: "Add your boutique products" },
                { step: "3", text: "Know your profit in real-time" },
              ].map((item) => (
                <div
                  key={item.step}
                  className="flex items-center gap-3 bg-stone-700/30 rounded-lg px-3 py-2"
                >
                  <span className="w-5 h-5 rounded-full bg-amber-800/60 text-amber-300 text-[10px] font-bold flex items-center justify-center shrink-0">
                    {item.step}
                  </span>
                  <span className="text-xs text-stone-300 font-medium">
                    {item.text}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Motivational Quote */}
          <div className="space-y-4">
            <h3 className="text-3xl lg:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-100 to-amber-300 leading-tight">
              &ldquo;You can&apos;t manage
              <br />
              what you don&apos;t measure.&rdquo;
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

