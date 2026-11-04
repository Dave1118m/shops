"use client";

import React, { useState } from "react";
import { Sparkles, CheckCircle2, ShieldCheck, ShoppingBag, Layers, BarChart3, ScanLine } from "lucide-react";

interface ShowcaseItem {
  id: string;
  category: string;
  badge: string;
  badgeColor: string;
  name: string;
  sku: string;
  variants: string;
  metric: string;
  imageUrl: string;
  fallbackGradient: string;
  fallbackIcon: string;
}

const SHOWCASE_ITEMS: ShowcaseItem[] = [
  {
    id: "apparel",
    category: "Apparel & Dresses",
    badge: "Multi-Variant",
    badgeColor: "bg-rose-500/15 text-rose-300 border-rose-500/30",
    name: "Pleated Silk Evening Gown",
    sku: "SKU: DR-904 • Emerald",
    variants: "Sizes: XS, S, M, L, XL",
    metric: "48 units in stock",
    imageUrl: "https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&w=300&h=300&q=80",
    fallbackGradient: "from-rose-900 to-amber-950",
    fallbackIcon: "👗",
  },
  {
    id: "shoes",
    category: "Footwear & Heels",
    badge: "EU Sizing",
    badgeColor: "bg-amber-500/15 text-amber-300 border-amber-500/30",
    name: "Italian Leather Stiletto Heel",
    sku: "SKU: SH-201 • Cobalt Blue",
    variants: "EU Sizes: 36, 37, 38, 39, 40",
    metric: "Box Barcode Synced",
    imageUrl: "https://images.unsplash.com/photo-1543163521-1bf539c55dd2?auto=format&fit=crop&w=300&h=300&q=80",
    fallbackGradient: "from-amber-900 to-stone-950",
    fallbackIcon: "👠",
  },
  {
    id: "bags",
    category: "Bags & Leather Goods",
    badge: "Weighted Cost",
    badgeColor: "bg-purple-500/15 text-purple-300 border-purple-500/30",
    name: "Quilted Chain Crossbody Bag",
    sku: "SKU: BG-550 • Cognac Tan",
    variants: "Calfskin Leather • Brass Hardware",
    metric: "62% Gross Margin",
    imageUrl: "https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=300&h=300&q=80",
    fallbackGradient: "from-purple-900 to-stone-950",
    fallbackIcon: "👜",
  },
];

export function BoutiqueShowcase() {
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});

  return (
    <div className="hidden lg:flex lg:w-[50%] bg-gradient-to-br from-stone-950 via-stone-900 to-black flex-col justify-between p-10 xl:p-14 relative overflow-hidden border-l border-stone-800/60 select-none">
      {/* Background ambient light orbs */}
      <div className="absolute -top-24 -right-24 w-96 h-96 bg-amber-600/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute top-1/2 -left-20 w-80 h-80 bg-rose-700/10 rounded-full blur-[130px] pointer-events-none" />
      <div className="absolute -bottom-24 right-10 w-96 h-96 bg-purple-700/10 rounded-full blur-[140px] pointer-events-none" />

      {/* Subtle grid pattern overlay */}
      <div 
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`,
          backgroundSize: "24px 24px",
        }}
      />

      {/* Top Header */}
      <div className="relative z-10 space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-stone-900/90 border border-amber-600/30 text-amber-300 text-xs font-semibold backdrop-blur-md shadow-lg shadow-black/40">
          <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
          <span>Haute Couture &amp; Footwear Edition</span>
        </div>

        <h2 className="text-3xl xl:text-4xl font-extrabold text-white tracking-tight leading-tight">
          Track Every Garment, <br />
          <span className="bg-gradient-to-r from-amber-300 via-amber-100 to-rose-200 bg-clip-text text-transparent">
            Pair &amp; Dollar Profit.
          </span>
        </h2>

        <p className="text-xs xl:text-sm text-stone-400 max-w-md leading-relaxed">
          Engineered for fashion boutiques, luxury apparel, footwear, and designer leather goods. Real-time POS checkout with double-entry stock integrity.
        </p>
      </div>

      {/* Interactive HD Ecommerce Cards */}
      <div className="relative z-10 space-y-3.5 my-8">
        {SHOWCASE_ITEMS.map((item) => (
          <div
            key={item.id}
            className="group relative bg-stone-900/70 hover:bg-stone-850 backdrop-blur-md border border-stone-800/80 hover:border-amber-500/40 rounded-2xl p-3.5 xl:p-4 transition-all duration-300 shadow-xl shadow-black/30 hover:shadow-amber-950/20 hover:-translate-y-0.5"
          >
            <div className="flex items-center gap-4">
              {/* HD Product Image with Aspect Ratio & Fallback */}
              <div className="relative w-16 h-16 xl:w-20 xl:h-20 rounded-xl overflow-hidden flex-shrink-0 bg-stone-800 border border-stone-700/60 shadow-md group-hover:scale-105 transition-transform duration-300">
                {!imageErrors[item.id] ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={item.imageUrl}
                    alt={item.name}
                    className="w-full h-full object-cover object-center"
                    loading="lazy"
                    onError={() =>
                      setImageErrors((prev) => ({ ...prev, [item.id]: true }))
                    }
                  />
                ) : (
                  <div
                    className={`w-full h-full bg-gradient-to-br ${item.fallbackGradient} flex items-center justify-center text-2xl`}
                  >
                    {item.fallbackIcon}
                  </div>
                )}
                {/* Subtle Image Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />
              </div>

              {/* Product & Variant Details */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider truncate">
                    {item.category}
                  </span>
                  <span
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${item.badgeColor}`}
                  >
                    {item.badge}
                  </span>
                </div>

                <h4 className="text-sm font-bold text-white group-hover:text-amber-200 transition-colors truncate">
                  {item.name}
                </h4>

                <p className="text-xs text-stone-400 truncate mt-0.5">
                  {item.variants}
                </p>

                <div className="flex items-center justify-between mt-2 pt-2 border-t border-stone-800/60 text-[11px]">
                  <span className="text-stone-500 font-mono text-[10px] truncate">
                    {item.sku}
                  </span>
                  <span className="text-emerald-400 font-medium flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    {item.metric}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Feature Micro-Badges / Trust Pillars */}
      <div className="relative z-10 pt-4 border-t border-stone-800/80">
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="bg-stone-900/50 border border-stone-800/60 rounded-xl p-2.5">
            <div className="flex items-center justify-center gap-1.5 text-amber-300 text-xs font-bold">
              <ScanLine className="w-3.5 h-3.5 text-amber-400" />
              <span>Barcode POS</span>
            </div>
            <p className="text-[10px] text-stone-500 mt-0.5">Instant checkout</p>
          </div>

          <div className="bg-stone-900/50 border border-stone-800/60 rounded-xl p-2.5">
            <div className="flex items-center justify-center gap-1.5 text-rose-300 text-xs font-bold">
              <Layers className="w-3.5 h-3.5 text-rose-400" />
              <span>Color &amp; Size Matrix</span>
            </div>
            <p className="text-[10px] text-stone-500 mt-0.5">Stock by variant</p>
          </div>

          <div className="bg-stone-900/50 border border-stone-800/60 rounded-xl p-2.5">
            <div className="flex items-center justify-center gap-1.5 text-emerald-300 text-xs font-bold">
              <BarChart3 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Live P&amp;L Ledger</span>
            </div>
            <p className="text-[10px] text-stone-500 mt-0.5">Accurate margin</p>
          </div>
        </div>
      </div>
    </div>
  );
}
