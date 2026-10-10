import crypto from "crypto";
import { cookies } from "next/headers";
import { db } from "../db/db-client";

const SESSION_COOKIE_NAME = "cloudvault_session";
const SESSION_LIFETIME_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export interface UserSession {
  sessionId: string;
  user: {
    id: string;
    email: string;
    accountStatus: string;
    hasVaultKey: boolean;
  };
}

/**
 * Derives a secure password hash with unique salt using Node's crypto scrypt / Argon2-compatible parameters.
 */
export async function hashAccountPassword(password: string): Promise<string> {
  const salt = crypto.randomBytes(16).toString("hex");
  return new Promise((resolve, reject) => {
    crypto.scrypt(password, salt, 64, { N: 16384, r: 8, p: 1 }, (err, derivedKey) => {
      if (err) return reject(err);
      resolve(`scrypt:v1:${salt}:${derivedKey.toString("hex")}`);
    });
  });
}

/**
 * Constant-time verification of account password against stored hash.
 */
export async function verifyAccountPassword(password: string, storedHash: string): Promise<boolean> {
  const parts = storedHash.split(":");
  if (parts.length !== 4 || parts[0] !== "scrypt" || parts[1] !== "v1") {
    return false;
  }
  const [, , salt, originalKeyHex] = parts;
  return new Promise((resolve) => {
    crypto.scrypt(password, salt, 64, { N: 16384, r: 8, p: 1 }, (err, derivedKey) => {
      if (err) return resolve(false);
      const originalKey = Buffer.from(originalKeyHex, "hex");
      resolve(crypto.timingSafeEqual(derivedKey, originalKey));
    });
  });
}

/**
 * Creates a high-entropy session and sets secure HttpOnly cookie.
 */
export async function createSession(userId: string): Promise<string> {
  const rawToken = crypto.randomBytes(32).toString("hex");
  const sessionTokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");
  const expiresAt = new Date(Date.now() + SESSION_LIFETIME_MS);

  await db.createSession({
    userId,
    sessionTokenHash,
    expiresAt,
  });

  const cookieStore = cookies();
  const isProd = process.env.NODE_ENV === "production";

  cookieStore.set(SESSION_COOKIE_NAME, rawToken, {
    httpOnly: true,
    secure: isProd,
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });

  return rawToken;
}

/**
 * Validates the current session from HttpOnly cookies.
 */
export async function getSessionUser(): Promise<UserSession | null> {
  const cookieStore = cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;

  const sessionTokenHash = crypto.createHash("sha256").update(token).digest("hex");
  const session = await db.findSessionByTokenHash(sessionTokenHash);

  if (!session || !session.user) {
    return null;
  }

  const vaultKey = await db.getVaultKey(session.user.id);

  return {
    sessionId: session.id,
    user: {
      id: session.user.id,
      email: session.user.email,
      accountStatus: session.user.accountStatus,
      hasVaultKey: !!vaultKey,
    },
  };
}

/**
 * Destroys the current session and clears the cookie.
 */
export async function revokeCurrentSession(): Promise<void> {
  const cookieStore = cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (token) {
    const sessionTokenHash = crypto.createHash("sha256").update(token).digest("hex");
    const session = await db.findSessionByTokenHash(sessionTokenHash);
    if (session) {
      await db.revokeSession(session.id, session.userId);
    }
  }

  cookieStore.set(SESSION_COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}
