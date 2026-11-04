import { NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { FinanceService, RecordPurchaseInput } from "@/services/finance.service";

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const session = verifyToken(authHeader.substring(7));
    if (!session || session.role !== "OWNER") {
      return NextResponse.json({ error: "Forbidden: Owner access required." }, { status: 403 });
    }

    const body = await req.json();
    const { supplier, extraCost, notes, lines } = body;

    if (!lines || !Array.isArray(lines) || lines.length === 0) {
      return NextResponse.json(
        { error: "Purchase must contain at least one item line." },
        { status: 400 }
      );
    }

    const purchase = await FinanceService.recordPurchase({
      userId: session.id,
      supplier,
      extraCost: Number(extraCost || 0),
      notes,
      lines: lines.map((l: any) => ({
        itemId: l.itemId,
        variantId: l.variantId || null,
        quantity: Number(l.quantity),
        unitCost: Number(l.unitCost),
      })),
    });

    return NextResponse.json({ success: true, purchase });
  } catch (error: any) {
    console.error("POST /api/purchases error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to record purchase." },
      { status: 500 }
    );
  }
}

