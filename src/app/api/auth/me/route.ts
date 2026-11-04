import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(req: Request) {
  try {
    let token: string | undefined;

    // Check Authorization header
    const authHeader = req.headers.get("authorization");
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.substring(7);
    }

    // Fallback to HTTP-only cookie
    if (!token) {
      const cookieStore = await cookies();
      token = cookieStore.get("auth-token")?.value;
    }

    if (!token) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    const session = verifyToken(token);
    if (!session) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    // Verify user is still active in database
    const dbUser = await prisma.user.findUnique({
      where: { id: session.id },
      select: {
        id: true,
        name: true,
        email: true,
        username: true,
        role: true,
        status: true,
      },
    });

    if (!dbUser || dbUser.status !== "ACTIVE") {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    return NextResponse.json({
      authenticated: true,
      user: dbUser,
    });
  } catch (error: any) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }
}
