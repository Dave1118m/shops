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
    const { category, amount, note, date } = body;

    if (!category || !amount || Number(amount) <= 0) {
      return NextResponse.json(
        { error: "Category and a positive amount are required." },
        { status: 400 }
      );
    }

    const expense = await FinanceService.recordExpense({
      category,
      amount: Number(amount),
      note,
      userId: session.id,
      date: date ? new Date(date) : new Date(),
    });

    return NextResponse.json({ success: true, expense });
  } catch (error: any) {
    console.error("POST /api/expenses error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to record expense." },
      { status: 500 }
    );
  }
}

