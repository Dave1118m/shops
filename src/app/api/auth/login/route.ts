import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyPassword, signToken } from "@/lib/auth";
import {
  checkRateLimit,
  resetRateLimit,
  DUMMY_HASH,
  sanitizeString,
} from "@/lib/security";

export async function POST(req: Request) {
  try {
    // 1. Client IP / rate limit identifier
    const clientIp =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      "unknown-ip";

    const body = await req.json();
    const rawIdentifier = body.username || "";
    const rawPassword = body.password || "";

    const identifier = sanitizeString(rawIdentifier);
    const password = rawPassword;

    if (!identifier || !password) {
      return NextResponse.json(
        { error: "Please provide both username/email and password." },
        { status: 400 }
      );
    }

    // 2. Rate Limiting Check (Max 5 failed attempts per 15 min per IP/account)
    const rateLimitKey = `login:${clientIp}:${identifier.toLowerCase()}`;
    const rateCheck = checkRateLimit(rateLimitKey, 5, 15 * 60 * 1000);

    if (!rateCheck.allowed) {
      return NextResponse.json(
        {
          error: `Too many failed login attempts. For security, please try again in ${Math.ceil(
            rateCheck.retryAfterSec / 60
          )} minutes.`,
        },
        {
          status: 429,
          headers: { "Retry-After": rateCheck.retryAfterSec.toString() },
        }
      );
    }

    // 3. User lookup by username OR email
    const user = await prisma.user.findFirst({
      where: {
        OR: [{ username: identifier }, { email: identifier }],
      },
    });

    // 4. Constant-Time verification (mitigates timing attacks)
    const hashToCompare = user ? user.passwordHash : DUMMY_HASH;
    const isPasswordValid = await verifyPassword(password, hashToCompare);

    if (!user || !isPasswordValid || user.status !== "ACTIVE") {
      return NextResponse.json(
        { error: "Invalid username/email or password." },
        { status: 401 }
      );
    }

    // Reset rate limiter on successful authentication
    resetRateLimit(rateLimitKey);

    const role = user.role as "OWNER" | "SELLER";

    // 5. Issue JWT
    const token = signToken({
      id: user.id,
      name: user.name,
      username: user.username,
      role,
    });

    // 6. Security Audit Log
    try {
      await prisma.auditLog.create({
        data: {
          userId: user.id,
          action: "USER_LOGIN",
          entity: "User",
          entityId: user.id,
          details: JSON.stringify({
            ip: clientIp,
            timestamp: new Date().toISOString(),
          }),
        },
      });
    } catch {
      // Non-blocking audit log
    }

    // 7. Secure Response with HTTP-Only Cookie + JSON
    const response = NextResponse.json({
      success: true,
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        username: user.username,
        role,
      },
    });

    // Set HTTP-Only Cookie
    response.cookies.set("auth-token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 12 * 60 * 60, // 12 hours
      path: "/",
    });

    return response;
  } catch (error: any) {
    console.error("Login security error:", error);
    return NextResponse.json(
      { error: "An unexpected authentication error occurred." },
      { status: 500 }
    );
  }
}
