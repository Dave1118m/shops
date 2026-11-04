import { NextResponse } from "next/server";
import { SalesService } from "@/services/sales.service";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { sellerId, lines, discountAmount } = body;

    if (!sellerId || !lines || lines.length === 0) {
      return NextResponse.json({ error: "Missing seller or empty cart lines." }, { status: 400 });
    }

    const completedSale = await SalesService.processSale({
      sellerId,
      lines,
      discountAmount,
    });

    return NextResponse.json({
      success: true,
      sale: completedSale,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Checkout failed" }, { status: 400 });
  }
}

