"use client";

import React, { useState, useEffect, useMemo, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  Check,
  Lock,
  RefreshCw,
  Database,
  Shield,
  CheckCircle2,
} from "lucide-react";

function RegisterContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    username: "",
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Shop workspace initialization check
  const [checkingStatus, setCheckingStatus] = useState(true);
  const [isShopInitialized, setIsShopInitialized] = useState(false);

  useEffect(() => {
    const errorParam = searchParams.get("error");
    if (errorParam) {
      setError(errorParam);
    }

    fetch("/api/auth/register")
      .then((res) => res.json())
      .then((data) => {
        setIsShopInitialized(!!data.initialized);
      })
      .catch(() => {})
      .finally(() => {
        setCheckingStatus(false);
      });
  }, [searchParams]);

  // Live password strength calculation
  const passwordCriteria = useMemo(() => {
    const pw = formData.password;
    return {
      length: pw.length >= 8,
      hasLetter: /[a-zA-Z]/.test(pw),
      hasDigitOrSpecial: /[\d!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(pw),
    };
  }, [formData.password]);

  const passwordScore = useMemo(() => {
    let score = 0;
    if (passwordCriteria.length) score += 1;
    if (passwordCriteria.hasLetter) score += 1;
    if (passwordCriteria.hasDigitOrSpecial) score += 1;
    return score;
  }, [passwordCriteria]);

  const passwordsMatch =
    formData.confirmPassword.length > 0 &&
    formData.password === formData.confirmPassword;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const trimmedName = formData.name.trim();
    const trimmedUsername = formData.username.trim();
    const trimmedEmail = formData.email.trim();

    if (!trimmedName || !trimmedUsername || !formData.password) {
      setError("Please complete all required fields.");
      return;
    }

    if (trimmedUsername.length < 3 || trimmedUsername.length > 30) {
      setError("Username must be between 3 and 30 characters.");
      return;
    }

    if (!/^[a-zA-Z0-9_-]+$/.test(trimmedUsername)) {
      setError("Username may only contain letters, numbers, hyphens, and underscores.");
      return;
    }

    if (formData.password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }

    if (!passwordCriteria.hasLetter || !passwordCriteria.hasDigitOrSpecial) {
      setError("Password must contain at least one letter and one number or symbol.");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: trimmedName,
          email: trimmedEmail || undefined,
          username: trimmedUsername,
          password: formData.password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Registration failed. Please verify your details.");
        setLoading(false);
        return;
      }

      if (data.token) {
        localStorage.setItem("token", data.token);
      }
      if (data.user) {
        localStorage.setItem("user", JSON.stringify(data.user));
      }

      router.push("/dashboard");
    } catch {
      setError("Network error. Unable to connect to the authentication server.");
      setLoading(false);
    }
  };

  const handleGoogleSignUp = () => {
    window.location.href = "/api/auth/google";
  };

  return (
    <div className="flex min-h-screen">
      {/* Left Side - Register Form */}
      <div className="w-full lg:w-[52%] bg-white flex flex-col justify-between">
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
            Shop Management System
          </span>
        </header>

        {/* Content Area */}
        <div className="flex-1 flex items-center justify-center px-8 lg:px-16 xl:px-24 py-8">
          <div className="w-full max-w-md space-y-6">
            {checkingStatus ? (
              <div className="py-12 flex flex-col items-center justify-center text-slate-400">
                <RefreshCw className="w-6 h-6 animate-spin text-amber-700 mb-2" />
                <p className="text-xs">Checking workspace status...</p>
              </div>
            ) : isShopInitialized ? (
              /* Public Registration Locked - Shop Already Has an Owner */
              <div className="bg-stone-50 border border-stone-200 rounded-2xl p-6 text-center space-y-5">
                <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center mx-auto">
                  <Lock className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">
                    Boutique Workspace Active
                  </h3>
                  <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                    This boutique shop has already been initialized with an Owner account.
                  </p>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    Counter sellers and staff accounts are created directly by the Owner inside the dashboard.
                  </p>
                </div>

                <Link
                  href="/login"
                  className="w-full py-3.5 bg-gradient-to-r from-amber-700 to-amber-800 hover:from-amber-800 hover:to-amber-900 text-white font-bold text-sm rounded-xl shadow-lg shadow-amber-900/20 flex items-center justify-center gap-2 transition"
                >
                  Sign in to workspace <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            ) : (
              /* Initial Shop Owner Account Setup */
              <>
                <div>
                  <p className="text-xs font-bold text-amber-700 tracking-[0.2em] uppercase mb-2">
                    Initial Setup
                  </p>
                  <h2 className="text-3xl lg:text-4xl font-extrabold text-slate-900 tracking-tight">
                    Create Owner Account
                  </h2>
                  <p className="text-sm text-slate-500 mt-1.5 leading-relaxed">
                    Register the primary Owner account to access your boutique inventory and cash drawer.
                  </p>
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 text-xs px-4 py-3 rounded-xl flex items-start gap-2.5">
                    <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                    <span className="leading-snug">{error}</span>
                  </div>
                )}

                {/* Google Sign Up Button */}
                <button
                  type="button"
                  onClick={handleGoogleSignUp}
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
                  <span>Sign up with Google</span>
                </button>

                {/* Divider */}
                <div className="relative flex items-center justify-center">
                  <div className="border-t border-slate-200 w-full" />
                  <span className="bg-white px-3 text-xs text-slate-400 uppercase tracking-wider font-medium">
                    or create with email
                  </span>
                  <div className="border-t border-slate-200 w-full" />
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Full Name
                    </label>
                    <input
                      type="text"
                      placeholder="Enter full name"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-600/40 focus:border-amber-600 transition"
                      required
                      autoFocus
                      autoComplete="name"
                      disabled={loading}
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Username
                      </label>
                      <input
                        type="text"
                        placeholder="Choose a username"
                        value={formData.username}
                        onChange={(e) =>
                          setFormData({ ...formData, username: e.target.value })
                        }
                        className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-600/40 focus:border-amber-600 transition"
                        required
                        autoComplete="username"
                        disabled={loading}
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Email address <span className="text-slate-400 font-normal">(optional)</span>
                      </label>
                      <input
                        type="email"
                        placeholder="Enter email address"
                        value={formData.email}
                        onChange={(e) =>
                          setFormData({ ...formData, email: e.target.value })
                        }
                        className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-600/40 focus:border-amber-600 transition"
                        autoComplete="email"
                        disabled={loading}
                      />
                    </div>
                  </div>

                  {/* Password Fields */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Password <span className="text-slate-400">(min 8)</span>
                      </label>
                      <div className="relative">
                        <input
                          type={showPassword ? "text" : "password"}
                          placeholder="Min 8 characters"
                          value={formData.password}
                          onChange={(e) =>
                            setFormData({ ...formData, password: e.target.value })
                          }
                          className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-600/40 focus:border-amber-600 transition pr-10"
                          required
                          autoComplete="new-password"
                          disabled={loading}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition p-1"
                          aria-label={showPassword ? "Hide password" : "Show password"}
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
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Confirm password
                      </label>
                      <input
                        type="password"
                        placeholder="Re-enter password"
                        value={formData.confirmPassword}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            confirmPassword: e.target.value,
                          })
                        }
                        className={`w-full px-4 py-2.5 bg-white border rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none transition ${
                          passwordsMatch
                            ? "border-emerald-500 focus:ring-2 focus:ring-emerald-500/30"
                            : "border-slate-300 focus:ring-2 focus:ring-amber-600/40 focus:border-amber-600"
                        }`}
                        required
                        autoComplete="new-password"
                        disabled={loading}
                      />
                    </div>
                  </div>

                  {/* Password Strength Indicator */}
                  {formData.password.length > 0 && (
                    <div className="space-y-1.5 bg-slate-50 p-3 rounded-xl border border-slate-100 text-[11px]">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500 font-medium">Password strength:</span>
                        <span
                          className={`font-bold ${
                            passwordScore === 3
                              ? "text-emerald-600"
                              : passwordScore === 2
                              ? "text-amber-600"
                              : "text-red-500"
                          }`}
                        >
                          {passwordScore === 3
                            ? "Strong"
                            : passwordScore === 2
                            ? "Moderate"
                            : "Weak"}
                        </span>
                      </div>
                      <div className="flex gap-1 h-1 w-full bg-slate-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all ${
                            passwordScore === 3
                              ? "w-full bg-emerald-500"
                              : passwordScore === 2
                              ? "w-2/3 bg-amber-500"
                              : "w-1/3 bg-red-500"
                          }`}
                        />
                      </div>
                      <div className="flex flex-wrap gap-x-3 gap-y-1 text-slate-400 pt-0.5">
                        <span className={passwordCriteria.length ? "text-emerald-600 flex items-center gap-0.5" : ""}>
                          {passwordCriteria.length && <Check className="w-3 h-3 inline" />} 8+ chars
                        </span>
                        <span className={passwordCriteria.hasLetter ? "text-emerald-600 flex items-center gap-0.5" : ""}>
                          {passwordCriteria.hasLetter && <Check className="w-3 h-3 inline" />} Letters
                        </span>
                        <span className={passwordCriteria.hasDigitOrSpecial ? "text-emerald-600 flex items-center gap-0.5" : ""}>
                          {passwordCriteria.hasDigitOrSpecial && <Check className="w-3 h-3 inline" />} Numbers or symbols
                        </span>
                      </div>
                    </div>
                  )}

                  <div className="p-3 bg-amber-50 border border-amber-200/60 rounded-xl text-xs text-amber-900 flex items-start gap-2">
                    <ShieldCheck className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                    <span>
                      This creates the primary <strong>Shop Owner (Admin)</strong> account. Counter sellers are added from your dashboard.
                    </span>
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
                        Initializing workspace...
                      </span>
                    ) : (
                      <>
                        Create Owner Account <ArrowRight className="w-4 h-4" />
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
              </>
            )}
          </div>
        </div>

        {/* Footer */}
        <footer className="px-8 py-5 flex items-center justify-center gap-2 text-[11px] text-slate-400">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>Protected by enterprise-grade encryption &amp; audit ledger</span>
        </footer>
      </div>

      {/* Right Side - Dark Branded Clean Panel */}
      <div className="hidden lg:flex lg:w-[48%] bg-gradient-to-br from-stone-900 via-stone-950 to-black flex-col items-center justify-center p-12 relative overflow-hidden">
        {/* Background accent */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-900/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-amber-800/10 rounded-full blur-[100px]" />

        <div className="relative z-10 text-center space-y-8 max-w-md w-full">
          <div className="bg-stone-800/50 backdrop-blur-sm border border-stone-700/50 rounded-2xl p-6 text-left space-y-4 shadow-2xl">
            <div className="flex items-center gap-2 pb-3 border-b border-stone-700/50">
              <Shield className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-bold text-white uppercase tracking-wider">
                Enterprise Shop Security
              </span>
            </div>

            <div className="space-y-3 text-xs text-stone-300">
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>Single Master Owner account setup per boutique shop.</span>
              </div>
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>Google OAuth 2.0 and encrypted password credentials supported.</span>
              </div>
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>Sellers managed and activated directly by the shop owner.</span>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-100 to-amber-300">
              Money &amp; Stock Control
            </h3>
            <p className="text-xs text-stone-500 font-medium tracking-wider uppercase">
              Boutique Commerce Engine
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-50 flex items-center justify-center text-xs text-slate-400">Loading...</div>}>
      <RegisterContent />
    </Suspense>
  );
}
