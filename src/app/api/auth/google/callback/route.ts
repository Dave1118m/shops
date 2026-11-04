import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { signToken, hashPassword } from "@/lib/auth";
import crypto from "crypto";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const errorParam = url.searchParams.get("error");
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  if (errorParam || !code) {
    return NextResponse.redirect(`${appUrl}/login?error=Google authentication was canceled.`);
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = `${appUrl}/api/auth/google/callback`;

  if (!clientId || !clientSecret) {
    return NextResponse.redirect(
      `${appUrl}/login?error=Google OAuth credentials are not configured in .env.`
    );
  }

  try {
    // 1. Exchange authorization code for access token
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
    });

    if (!tokenResponse.ok) {
      const errData = await tokenResponse.text();
      console.error("Google token exchange error:", errData);
      return NextResponse.redirect(`${appUrl}/login?error=Failed to exchange token with Google.`);
    }

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;

    // 2. Fetch user profile from Google UserInfo endpoint
    const profileResponse = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!profileResponse.ok) {
      return NextResponse.redirect(`${appUrl}/login?error=Failed to retrieve Google profile.`);
    }

    const profile = await profileResponse.json();
    const email = profile.email?.toLowerCase();
    const name = profile.name || profile.given_name || "Google User";

    if (!email) {
      return NextResponse.redirect(`${appUrl}/login?error=Google account did not return a verified email.`);
    }

    // 3. Find or create user in SQL Server
    let user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      // First user registered in system becomes OWNER
      const totalUsers = await prisma.user.count();
      const role = totalUsers === 0 ? "OWNER" : "SELLER";

      // Generate a clean unique username based on email
      const baseUsername = email.split("@")[0].replace(/[^a-zA-Z0-9_]/g, "").slice(0, 20);
      let uniqueUsername = baseUsername || `user_${Date.now().toString().slice(-4)}`;
      const existingWithUsername = await prisma.user.findUnique({
        where: { username: uniqueUsername },
      });
      if (existingWithUsername) {
        uniqueUsername = `${uniqueUsername}_${Math.floor(100 + Math.random() * 900)}`;
      }

      // Random secure password hash (since user logs in via Google OAuth)
      const randomSecret = crypto.randomBytes(32).toString("hex");
      const passwordHash = await hashPassword(randomSecret);

      user = await prisma.user.create({
        data: {
          name,
          email,
          username: uniqueUsername,
          passwordHash,
          role,
          status: "ACTIVE",
        },
      });

      // Audit log
      try {
        await prisma.auditLog.create({
          data: {
            userId: user.id,
            action: "GOOGLE_SIGNUP",
            entity: "User",
            entityId: user.id,
            details: JSON.stringify({ email, role, provider: "google" }),
          },
        });
      } catch {}
    } else {
      if (user.status !== "ACTIVE") {
        return NextResponse.redirect(`${appUrl}/login?error=Your account has been deactivated. Please contact your administrator.`);
      }
    }

    const sessionRole = user.role as "OWNER" | "SELLER";

    // 4. Issue Session JWT
    const token = signToken({
      id: user.id,
      name: user.name,
      username: user.username,
      role: sessionRole,
    });

    // 5. Redirect with HTTP-only cookie and redirect destination
    const destination = sessionRole === "OWNER" ? "/dashboard" : "/pos";
    const response = NextResponse.redirect(`${appUrl}${destination}`);

    response.cookies.set("auth-token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 12 * 60 * 60,
      path: "/",
    });

    return response;
  } catch (err: any) {
    console.error("Google auth callback error:", err);
    return NextResponse.redirect(`${appUrl}/login?error=Unexpected error during Google authentication.`);
  }
}

