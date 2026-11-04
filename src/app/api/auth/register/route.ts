import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { hashPassword, signToken } from "@/lib/auth";
import {
  checkRateLimit,
  validateUsername,
  validateEmail,
  validatePassword,
  sanitizeString,
} from "@/lib/security";

/**
 * GET /api/auth/register - Check if initial shop owner setup is pending or already completed
 */
export async function GET() {
  try {
    const ownerCount = await prisma.user.count({
      where: { role: "OWNER" },
    });

    return NextResponse.json({
      initialized: ownerCount > 0,
      canRegisterOwner: ownerCount === 0,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Failed to check workspace registration status." },
      { status: 500 }
    );
  }
}

/**
 * POST /api/auth/register - First-time Shop Owner Account Creation
 */
export async function POST(req: Request) {
  try {
    // 1. Client IP / rate limit identifier
    const clientIp =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      "unknown-ip";

    // Rate Limit: Max 5 registration attempts per 15 min per IP
    const rateCheck = checkRateLimit(`register:${clientIp}`, 5, 15 * 60 * 1000);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        {
          error: `Too many registration attempts. Please wait ${Math.ceil(
            rateCheck.retryAfterSec / 60
          )} minutes before trying again.`,
        },
        { status: 429 }
      );
    }

    // 2. Real-Market Security Check: Is the shop already claimed by an Owner?
    const existingOwner = await prisma.user.findFirst({
      where: { role: "OWNER" },
    });

    if (existingOwner) {
      return NextResponse.json(
        {
          error:
            "This boutique workspace already has an active Owner. Counter sellers and staff accounts must be created by the Owner inside the dashboard.",
        },
        { status: 403 }
      );
    }

    const body = await req.json();
    const rawName = body.name || "";
    const rawEmail = body.email || "";
    const rawUsername = body.username || "";
    const rawPassword = body.password || "";

    // 3. Strict Input Validations
    const name = sanitizeString(rawName);
    if (!name || name.length < 2 || name.length > 100) {
      return NextResponse.json(
        { error: "Owner full name must be between 2 and 100 characters." },
        { status: 400 }
      );
    }

    const username = sanitizeString(rawUsername);
    const usernameValidation = validateUsername(username);
    if (!usernameValidation.valid) {
      return NextResponse.json(
        { error: usernameValidation.error },
        { status: 400 }
      );
    }

    let email: string | null = null;
    if (rawEmail && rawEmail.trim() !== "") {
      const trimmedEmail = sanitizeString(rawEmail).toLowerCase();
      const emailValidation = validateEmail(trimmedEmail);
      if (!emailValidation.valid) {
        return NextResponse.json(
          { error: emailValidation.error },
          { status: 400 }
        );
      }
      email = trimmedEmail;
    }

    const passwordValidation = validatePassword(rawPassword);
    if (!passwordValidation.valid) {
      return NextResponse.json(
        { error: passwordValidation.error },
        { status: 400 }
      );
    }

    // 4. Uniqueness Checks
    const existingUsername = await prisma.user.findUnique({
      where: { username },
    });
    if (existingUsername) {
      return NextResponse.json(
        { error: "This username is already taken. Please choose another." },
        { status: 409 }
      );
    }

    if (email) {
      const existingEmail = await prisma.user.findUnique({
        where: { email },
      });
      if (existingEmail) {
        return NextResponse.json(
          { error: "An account with this email address already exists." },
          { status: 409 }
        );
      }
    }

    // 5. Secure Password Hashing (bcrypt with 12 salt rounds)
    const passwordHash = await hashPassword(rawPassword);

    // 6. Create Primary Shop Owner
    const newOwner = await prisma.user.create({
      data: {
        name,
        email,
        username,
        passwordHash,
        role: "OWNER",
        status: "ACTIVE",
      },
    });

    // 7. Audit Log
    try {
      await prisma.auditLog.create({
        data: {
          userId: newOwner.id,
          action: "SHOP_INITIALIZED",
          entity: "User",
          entityId: newOwner.id,
          details: JSON.stringify({
            username: newOwner.username,
            role: "OWNER",
            ip: clientIp,
          }),
        },
      });
    } catch {
      // Non-blocking
    }

    // 8. Sign JWT
    const token = signToken({
      id: newOwner.id,
      name: newOwner.name,
      username: newOwner.username,
      role: "OWNER",
    });

    // 9. Response with HTTP-Only Cookie + JSON
    const response = NextResponse.json({
      success: true,
      token,
      user: {
        id: newOwner.id,
        name: newOwner.name,
        email: newOwner.email,
        username: newOwner.username,
        role: "OWNER",
      },
    });

    response.cookies.set("auth-token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 12 * 60 * 60,
      path: "/",
    });

    return response;
  } catch (error: any) {
    console.error("Register security error:", error);
    return NextResponse.json(
      { error: "Account registration failed. Please try again." },
      { status: 500 }
    );
  }
}
