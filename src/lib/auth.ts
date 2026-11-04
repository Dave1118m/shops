import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "soleil-boutique-enterprise-secret-key-2026-production";

export interface SessionUser {
  id: string;
  name: string;
  username: string;
  role: "OWNER" | "SELLER";
}

/**
 * Enterprise standard: 12 bcrypt salt rounds
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(12);
  return bcrypt.hash(password, salt);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function signToken(user: SessionUser): string {
  return jwt.sign(
    {
      sub: user.id,
      name: user.name,
      username: user.username,
      role: user.role,
    },
    JWT_SECRET,
    {
      expiresIn: "12h",
      algorithm: "HS256",
    }
  );
}

export function verifyToken(token: string): SessionUser | null {
  try {
    const payload = jwt.verify(token, JWT_SECRET) as any;
    return {
      id: payload.sub || payload.id,
      name: payload.name,
      username: payload.username,
      role: payload.role,
    };
  } catch {
    return null;
  }
}
