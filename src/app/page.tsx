import Link from "next/link";
import { Store, ShieldCheck, ShoppingBag, ArrowRight } from "lucide-react";

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-6 bg-gradient-to-br from-slate-100 via-rose-50 to-slate-200">
      <div className="w-full max-w-3xl text-center space-y-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-100 text-rose-700 text-sm font-medium">
          <Store className="w-4 h-4" />
          Boutique Stock & Money Control System
        </div>

        <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 tracking-tight">
          Total Control Over Your <span className="text-rose-600">Goods</span> &{" "}
          <span className="text-emerald-600">Money</span>
        </h1>

        <p className="text-lg text-slate-600 max-w-xl mx-auto">
          Know your exact remaining boutique inventory and real-time profit at any moment. Built with bulletproof audit trails and zero manual stock overrides.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-lg mx-auto pt-4">
          <Link
            href="/pos"
            className="flex flex-col items-center p-6 bg-white rounded-2xl shadow-sm border border-slate-200 hover:border-rose-400 hover:shadow-md transition group text-left"
          >
            <div className="w-12 h-12 rounded-xl bg-rose-100 flex items-center justify-center text-rose-600 mb-3 group-hover:scale-110 transition">
              <ShoppingBag className="w-6 h-6" />
            </div>
            <h2 className="font-bold text-lg text-slate-900 flex items-center gap-1">
              Seller POS Screen <ArrowRight className="w-4 h-4 text-rose-500 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition" />
            </h2>
            <p className="text-sm text-slate-500 text-center mt-1">
              Fast counter sales, instant stock check, sizes & colors, receipts.
            </p>
          </Link>

          <Link
            href="/dashboard"
            className="flex flex-col items-center p-6 bg-white rounded-2xl shadow-sm border border-slate-200 hover:border-emerald-400 hover:shadow-md transition group text-left"
          >
            <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-600 mb-3 group-hover:scale-110 transition">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h2 className="font-bold text-lg text-slate-900 flex items-center gap-1">
              Owner Backoffice <ArrowRight className="w-4 h-4 text-emerald-500 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition" />
            </h2>
            <p className="text-sm text-slate-500 text-center mt-1">
              P&L reports, weighted average costs, expenses, daily cash drawer closing.
            </p>
          </Link>
        </div>
      </div>
    </div>
  );
}
