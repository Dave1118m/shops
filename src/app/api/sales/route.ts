import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyToken } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get("authorization");
    let session = null;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      session = verifyToken(authHeader.substring(7));
    }

    const sales = await prisma.sale.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
      include: {
        seller: {
          select: { id: true, name: true, username: true },
        },
        lines: {
          include: {
            item: { select: { id: true, name: true, code: true } },
            variant: { select: { id: true, size: true, color: true } },
          },
        },
      },
    });

    return NextResponse.json({
      sales: sales.map((s) => ({
        id: s.id,
        receiptNo: s.receiptNo,
        status: s.status,
        date: s.date.toISOString(),
        totalAmount: Number(s.totalAmount),
        discountAmount: Number(s.discountAmount),
        sellerName: s.seller.name,
        lines: s.lines.map((l) => ({
          id: l.id,
          itemName: l.item.name,
          variant: l.variant ? `${l.variant.size} - ${l.variant.color}` : null,
          quantity: Number(l.quantity),
          unitPrice: Number(l.unitPrice),
          subtotal: Number(l.subtotal),
        })),
      })),
    });
  } catch (error: any) {
    console.error("GET /api/sales error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch sales." },
      { status: 500 }
    );
  }
}

