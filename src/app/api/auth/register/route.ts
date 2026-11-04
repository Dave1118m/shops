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

    const body = await req.json();
    const rawName = body.name || "";
    const rawEmail = body.email || "";
    const rawUsername = body.username || "";
    const rawPassword = body.password || "";
    const requestedRole = body.role || "OWNER";

    // 2. Strict Input Validations
    const name = sanitizeString(rawName);
    if (!name || name.length < 2 || name.length > 100) {
      return NextResponse.json(
        { error: "Full name must be between 2 and 100 characters." },
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

    // 3. Uniqueness Checks
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

    // 4. Role Authorization Rule:
    // If this is the first user ever registered, they are always granted OWNER.
    const totalUsers = await prisma.user.count();
    let finalRole: "OWNER" | "SELLER" = "SELLER";

    if (totalUsers === 0) {
      finalRole = "OWNER";
    } else {
      finalRole = requestedRole === "OWNER" ? "OWNER" : "SELLER";
    }

    // 5. Secure Password Hashing (bcrypt with 12 salt rounds)
    const passwordHash = await hashPassword(rawPassword);

    // 6. Create User in Database
    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        username,
        passwordHash,
        role: finalRole,
        status: "ACTIVE",
      },
    });

    // 7. Audit Log
    try {
      await prisma.auditLog.create({
        data: {
          userId: newUser.id,
          action: "USER_REGISTERED",
          entity: "User",
          entityId: newUser.id,
          details: JSON.stringify({
            username: newUser.username,
            role: finalRole,
            ip: clientIp,
          }),
        },
      });
    } catch {
      // Non-blocking audit log
    }

    // 8. Sign JWT
    const token = signToken({
      id: newUser.id,
      name: newUser.name,
      username: newUser.username,
      role: finalRole,
    });

    // 9. Response with HTTP-Only Cookie + JSON
    const response = NextResponse.json({
      success: true,
      token,
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        username: newUser.username,
        role: finalRole,
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
