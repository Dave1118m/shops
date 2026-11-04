import bcrypt from "bcryptjs";

// Dummy hash for constant-time comparisons when a user is not found (mitigates timing attacks)
export const DUMMY_HASH = "$2a$12$e8kZ1qK9yRkF8EaB3P0yzeE8l4v5M6z7m8n9o0p1q2r3s4t5u6v7w";

/**
 * In-memory sliding window rate limiter
 */
interface RateLimitRecord {
  attempts: number;
  resetAt: number;
}

const rateLimitStore = new Map<string, RateLimitRecord>();

// Clean up expired rate limit entries every 5 minutes
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [key, record] of rateLimitStore.entries()) {
      if (now > record.resetAt) {
        rateLimitStore.delete(key);
      }
    }
  }, 5 * 60 * 1000);
}

export function checkRateLimit(
  identifier: string,
  maxAttempts: number = 5,
  windowMs: number = 15 * 60 * 1000
): { allowed: boolean; remaining: number; retryAfterSec: number } {
  const now = Date.now();
  const record = rateLimitStore.get(identifier);

  if (!record || now > record.resetAt) {
    rateLimitStore.set(identifier, { attempts: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: maxAttempts - 1, retryAfterSec: 0 };
  }

  if (record.attempts >= maxAttempts) {
    const retryAfterSec = Math.ceil((record.resetAt - now) / 1000);
    return { allowed: false, remaining: 0, retryAfterSec };
  }

  record.attempts += 1;
  return { allowed: true, remaining: maxAttempts - record.attempts, retryAfterSec: 0 };
}

export function resetRateLimit(identifier: string): void {
  rateLimitStore.delete(identifier);
}

/**
 * High-security input validators
 */
export function validateUsername(username: string): { valid: boolean; error?: string } {
  const trimmed = username.trim();
  if (trimmed.length < 3 || trimmed.length > 30) {
    return { valid: false, error: "Username must be between 3 and 30 characters." };
  }
  if (!/^[a-zA-Z0-9_-]+$/.test(trimmed)) {
    return { valid: false, error: "Username may only contain letters, numbers, underscores, and hyphens." };
  }
  return { valid: true };
}

export function validateEmail(email: string): { valid: boolean; error?: string } {
  const trimmed = email.trim();
  if (trimmed.length > 254) {
    return { valid: false, error: "Email address is too long." };
  }
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
  if (!emailRegex.test(trimmed)) {
    return { valid: false, error: "Please enter a valid email address." };
  }
  return { valid: true };
}

export function validatePassword(password: string): { valid: boolean; error?: string } {
  if (password.length < 8) {
    return { valid: false, error: "Password must be at least 8 characters long." };
  }
  if (password.length > 128) {
    return { valid: false, error: "Password cannot exceed 128 characters." };
  }
  // Must contain at least one letter and at least one number or special symbol
  const hasLetter = /[a-zA-Z]/.test(password);
  const hasDigitOrSpecial = /[\d!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password);

  if (!hasLetter || !hasDigitOrSpecial) {
    return { valid: false, error: "Password must contain at least one letter and one number or symbol." };
  }

  return { valid: true };
}

export function sanitizeString(input: string): string {
  return input
    .replace(/[<>]/g, "") // Strip dangerous HTML brackets
    .trim();
}
