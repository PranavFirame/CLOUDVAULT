import { NextRequest, NextResponse } from "next/server";
import { LoginSchema } from "@/lib/validation/schemas";
import { verifyAccountPassword, createSession } from "@/lib/auth/auth-service";
import { db } from "@/lib/db/db-client";
import { checkRateLimit } from "@/lib/redis/redis-client";

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get("x-forwarded-for") || "127.0.0.1";
    const body = await req.json();
    const parsed = LoginSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message || "Invalid input" },
        { status: 400 }
      );
    }

    const { email, password } = parsed.data;

    // Rate limiting per IP and per email
    const ipRate = await checkRateLimit(`login-ip:${ip}`, 10, 60);
    const emailRate = await checkRateLimit(`login-user:${email.toLowerCase()}`, 5, 60);

    if (!ipRate.allowed || !emailRate.allowed) {
      return NextResponse.json(
        { error: "Too many login attempts. Please try again later." },
        { status: 429 }
      );
    }

    const user = await db.findUserByEmail(email);
    if (!user) {
      return NextResponse.json(
        { error: "Invalid email or account password." },
        { status: 401 }
      );
    }

    const validPassword = await verifyAccountPassword(password, user.passwordHash);
    if (!validPassword) {
      await db.createAuditEvent({
        userId: user.id,
        eventType: "FAILED_LOGIN_ATTEMPT",
        details: { email },
        ipAddress: ip,
      });
      return NextResponse.json(
        { error: "Invalid email or account password." },
        { status: 401 }
      );
    }

    const vaultKey = await db.getVaultKey(user.id);
    await createSession(user.id);

    await db.createAuditEvent({
      userId: user.id,
      eventType: "USER_LOGGED_IN",
      details: { email },
      ipAddress: ip,
    });

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        hasVaultKey: !!vaultKey,
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
