"use client";

import React, { useState } from "react";
import { Sparkles, ArrowUpRight } from "lucide-react";

interface FashionCard {
  id: string;
  title: string;
  tag: string;
  meta: string;
  imageUrl: string;
  fallbackGradient: string;
}

const FASHION_CARDS: FashionCard[] = [
  {
    id: "apparel",
    title: "Apparel & Dresses",
    tag: "Sizes XS – XL",
    meta: "Multi-variant matrix",
    imageUrl:
      "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=600&q=80",
    fallbackGradient: "from-stone-800 to-amber-950",
  },
  {
    id: "shoes",
    title: "Footwear & Heels",
    tag: "EU 36 – 43",
    meta: "Box barcode synced",
    imageUrl:
      "https://images.unsplash.com/photo-1543163521-1bf539c55dd2?auto=format&fit=crop&w=600&q=80",
    fallbackGradient: "from-blue-950 to-stone-900",
  },
  {
    id: "bags",
    title: "Leather Goods",
    tag: "Handcrafted Bags",
    meta: "Weighted cost basis",
    imageUrl:
      "https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=600&q=80",
    fallbackGradient: "from-amber-950 to-stone-900",
  },
  {
    id: "accessories",
    title: "Jewelry & Accs",
    tag: "Curated Sets",
    meta: "Fast counter scan",
    imageUrl:
      "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=600&q=80",
    fallbackGradient: "from-stone-900 to-yellow-950",
  },
];

export function BoutiqueShowcase() {
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});

  return (
    <div className="hidden lg:flex lg:w-[50%] bg-gradient-to-br from-stone-950 via-stone-900 to-black flex-col justify-between p-8 xl:p-12 relative overflow-hidden border-l border-stone-800/60 select-none">
      {/* Ambient background glows */}
      <div className="absolute -top-32 -right-32 w-96 h-96 bg-amber-600/10 rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-rose-900/10 rounded-full blur-[150px] pointer-events-none" />

      {/* Top Header - Minimal & Punchy */}
      <div className="relative z-10 space-y-2 mb-6">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-stone-900/90 border border-amber-600/30 text-amber-300 text-xs font-semibold backdrop-blur-md">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>Boutique Inventory &amp; POS</span>
        </div>

        <h2 className="text-2xl xl:text-3xl font-extrabold text-white tracking-tight">
          Curated Fashion.{" "}
          <span className="bg-gradient-to-r from-amber-200 to-amber-400 bg-clip-text text-transparent">
            Precision Stock.
          </span>
        </h2>

        <p className="text-xs text-stone-400 max-w-sm leading-relaxed">
          Real-time multi-variant control for garments, footwear, and luxury accessories.
        </p>
      </div>

      {/* 2x2 Large Editorial Fashion Grid */}
      <div className="relative z-10 grid grid-cols-2 gap-3 xl:gap-4 my-auto">
        {FASHION_CARDS.map((card) => (
          <div
            key={card.id}
            className="group relative h-48 xl:h-56 rounded-2xl overflow-hidden border border-stone-800/80 hover:border-amber-500/50 transition-all duration-300 shadow-xl bg-stone-900"
          >
            {/* Large HD Image */}
            {!imageErrors[card.id] ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={card.imageUrl}
                alt={card.title}
                className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500 ease-out"
                loading="lazy"
                onError={() =>
                  setImageErrors((prev) => ({ ...prev, [card.id]: true }))
                }
              />
            ) : (
              <div
                className={`w-full h-full bg-gradient-to-br ${card.fallbackGradient} flex items-center justify-center`}
              >
                <span className="text-stone-400 text-sm font-semibold">{card.title}</span>
              </div>
            )}

            {/* Gradient Scrim Overlay for contrast */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/10 group-hover:via-black/30 transition-colors pointer-events-none" />

            {/* Top Pill: Category tag */}
            <div className="absolute top-2.5 left-2.5">
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-black/60 backdrop-blur-md text-amber-200 border border-white/10">
                {card.tag}
              </span>
            </div>

            {/* Arrow icon */}
            <div className="absolute top-2.5 right-2.5 w-6 h-6 rounded-full bg-black/50 backdrop-blur-md border border-white/10 flex items-center justify-center text-stone-400 group-hover:text-amber-300 group-hover:border-amber-400/30 transition-colors">
              <ArrowUpRight className="w-3.5 h-3.5" />
            </div>

            {/* Bottom Content */}
            <div className="absolute bottom-3 left-3 right-3 text-left">
              <h4 className="text-sm font-bold text-white group-hover:text-amber-200 transition-colors leading-tight">
                {card.title}
              </h4>
              <p className="text-[11px] text-stone-300/80 mt-0.5 font-medium flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                {card.meta}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Footer Minimal Badge */}
      <div className="relative z-10 pt-4 mt-6 border-t border-stone-800/80 flex items-center justify-between text-[11px] text-stone-400">
        <span className="flex items-center gap-1.5 text-stone-300 font-medium">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          Live Ledger Synced
        </span>
        <span className="text-stone-500">POS • Matrix • Inventory</span>
      </div>
    </div>
  );
}
