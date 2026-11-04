import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyToken } from "@/lib/auth";
import { hashPassword } from "@/lib/auth";
import {
  validateUsername,
  validateEmail,
  validatePassword,
  sanitizeString,
} from "@/lib/security";

/**
 * GET /api/sellers - List all staff members (Owner only)
 */
export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const session = verifyToken(authHeader.substring(7));
    if (!session || session.role !== "OWNER") {
      return NextResponse.json(
        { error: "Forbidden: Only the shop owner can manage staff accounts." },
        { status: 403 }
      );
    }

    const staff = await prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        username: true,
        email: true,
        role: true,
        status: true,
        createdAt: true,
        _count: {
          select: { sales: true },
        },
      },
    });

    return NextResponse.json({
      staff: staff.map((s) => ({
        id: s.id,
        name: s.name,
        username: s.username,
        email: s.email,
        role: s.role,
        status: s.status,
        createdAt: s.createdAt.toISOString(),
        totalSales: s._count.sales,
      })),
    });
  } catch (error: any) {
    console.error("GET /api/sellers error:", error);
    return NextResponse.json(
      { error: "Failed to fetch staff members." },
      { status: 500 }
    );
  }
}

/**
 * POST /api/sellers - Owner creates a new staff / seller account
 */
export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const session = verifyToken(authHeader.substring(7));
    if (!session || session.role !== "OWNER") {
      return NextResponse.json(
        { error: "Forbidden: Only the shop owner can create staff accounts." },
        { status: 403 }
      );
    }

    const body = await req.json();
    const rawName = body.name || "";
    const rawUsername = body.username || "";
    const rawEmail = body.email || "";
    const rawPassword = body.password || "";
    const role = body.role === "OWNER" ? "OWNER" : "SELLER";

    // 1. Validations
    const name = sanitizeString(rawName);
    if (!name || name.length < 2 || name.length > 100) {
      return NextResponse.json(
        { error: "Staff member's full name must be between 2 and 100 characters." },
        { status: 400 }
      );
    }

    const username = sanitizeString(rawUsername);
    const usernameVal = validateUsername(username);
    if (!usernameVal.valid) {
      return NextResponse.json({ error: usernameVal.error }, { status: 400 });
    }

    let email: string | null = null;
    if (rawEmail && rawEmail.trim() !== "") {
      const trimmedEmail = sanitizeString(rawEmail).toLowerCase();
      const emailVal = validateEmail(trimmedEmail);
      if (!emailVal.valid) {
        return NextResponse.json({ error: emailVal.error }, { status: 400 });
      }
      email = trimmedEmail;
    }

    const passwordVal = validatePassword(rawPassword);
    if (!passwordVal.valid) {
      return NextResponse.json({ error: passwordVal.error }, { status: 400 });
    }

    // 2. Uniqueness check
    const existing = await prisma.user.findFirst({
      where: {
        OR: [{ username }, ...(email ? [{ email }] : [])],
      },
    });

    if (existing) {
      if (existing.username === username) {
        return NextResponse.json(
          { error: "Username is already assigned to another staff member." },
          { status: 409 }
        );
      }
      return NextResponse.json(
        { error: "Email is already assigned to another staff member." },
        { status: 409 }
      );
    }

    // 3. Hash password (12 salt rounds)
    const passwordHash = await hashPassword(rawPassword);

    // 4. Create user
    const newUser = await prisma.user.create({
      data: {
        name,
        username,
        email,
        passwordHash,
        role,
        status: "ACTIVE",
      },
      select: {
        id: true,
        name: true,
        username: true,
        email: true,
        role: true,
        status: true,
        createdAt: true,
      },
    });

    // 5. Audit Log
    try {
      await prisma.auditLog.create({
        data: {
          userId: session.id,
          action: "STAFF_CREATED",
          entity: "User",
          entityId: newUser.id,
          details: JSON.stringify({
            createdUsername: newUser.username,
            role,
            createdBy: session.username,
          }),
        },
      });
    } catch {
      // Non-blocking
    }

    return NextResponse.json({
      success: true,
      staff: newUser,
    });
  } catch (error: any) {
    console.error("POST /api/sellers error:", error);
    return NextResponse.json(
      { error: "Failed to create staff member." },
      { status: 500 }
    );
  }
}

