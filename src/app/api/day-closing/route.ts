import { NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { FinanceService } from "@/services/finance.service";

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
    const { openingCash, countedCash, notes, date } = body;

    if (countedCash === undefined || isNaN(Number(countedCash))) {
      return NextResponse.json(
        { error: "Counted physical cash is required." },
        { status: 400 }
      );
    }

    const dayClosing = await FinanceService.performDailyClosing({
      openingCash: Number(openingCash || 0),
      countedCash: Number(countedCash),
      notes,
      closedById: session.id,
      date: date ? new Date(date) : new Date(),
    });

    return NextResponse.json({ success: true, dayClosing });
  } catch (error: any) {
    console.error("POST /api/day-closing error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to perform day closing." },
      { status: 500 }
    );
  }
}

