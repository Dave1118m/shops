import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { hashPassword, signToken } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const { name, email, username, password, role } = await req.json();

    if (!name || !username || !password) {
      return NextResponse.json(
        { error: "Name, username, and password are required." },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters." },
        { status: 400 }
      );
    }

    // Check if username already exists
    const existingUser = await prisma.user.findUnique({
      where: { username },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "Username is already taken." },
        { status: 409 }
      );
    }

    // Check if email already exists (if provided)
    if (email) {
      const existingEmail = await prisma.user.findUnique({
        where: { email },
      });
      if (existingEmail) {
        return NextResponse.json(
          { error: "Email is already registered." },
          { status: 409 }
        );
      }
    }

    const passwordHash = await hashPassword(password);

    const validRole = role === "OWNER" ? "OWNER" : "SELLER";

    const user = await prisma.user.create({
      data: {
        name,
        email: email || null,
        username,
        passwordHash,
        role: validRole,
        status: "ACTIVE",
      },
    });

    const sessionRole = user.role as "OWNER" | "SELLER";

    const token = signToken({
      id: user.id,
      name: user.name,
      username: user.username,
      role: sessionRole,
    });

    return NextResponse.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        username: user.username,
        role: sessionRole,
      },
    });
  } catch (error: any) {
    console.error("Register error:", error);
    return NextResponse.json(
      { error: error.message || "Registration failed." },
      { status: 500 }
    );
  }
}

