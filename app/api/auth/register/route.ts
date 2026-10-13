import { NextRequest, NextResponse } from "next/server";
import { RegisterSchema } from "../../../../lib/validation/schemas";
import { hashAccountPassword, createSession } from "../../../../lib/auth/auth-service";
import { db } from "../../../../lib/db/db-client";
import { checkRateLimit } from "../../../../lib/redis/redis-client";

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get("x-forwarded-for") || "127.0.0.1";
    const rate = await checkRateLimit(`register:${ip}`, 5, 60);
    if (!rate.allowed) {
      return NextResponse.json(
        { error: "Too many registration attempts. Please wait." },
        { status: 429 }
      );
    }

    const body = await req.json();
    const parsed = RegisterSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message || "Invalid input" },
        { status: 400 }
      );
    }

    const { email, password } = parsed.data;
    const existing = await db.findUserByEmail(email);
    if (existing) {
      return NextResponse.json(
        { error: "An account with this email already exists." },
        { status: 409 }
      );
    }

    const passwordHash = await hashAccountPassword(password);
    const user = await db.createUser({
      email,
      passwordHash,
    });

    await db.createAuditEvent({
      userId: user.id,
      eventType: "USER_REGISTERED",
      details: { email: user.email },
      ipAddress: ip,
    });

    await createSession(user.id);

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        hasVaultKey: false,
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
