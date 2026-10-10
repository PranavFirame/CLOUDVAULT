import { NextRequest, NextResponse } from "next/server";
import { getSessionUser, verifyAccountPassword, hashAccountPassword } from "@/lib/auth/auth-service";
import { db } from "@/lib/db/db-client";
import { ChangePasswordSchema } from "@/lib/validation/schemas";

export async function POST(req: NextRequest) {
  const sessionUser = await getSessionUser();
  if (!sessionUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = ChangePasswordSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.errors[0]?.message || "Invalid input" },
      { status: 400 }
    );
  }

  const { currentPassword, newPassword } = parsed.data;
  const user = await db.findUserById(sessionUser.user.id);
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const valid = await verifyAccountPassword(currentPassword, user.passwordHash);
  if (!valid) {
    return NextResponse.json({ error: "Current password is incorrect" }, { status: 400 });
  }

  const newHash = await hashAccountPassword(newPassword);
  await db.updateUserPassword(user.id, newHash);

  await db.createAuditEvent({
    userId: user.id,
    eventType: "ACCOUNT_PASSWORD_CHANGED",
    details: {},
  });

  return NextResponse.json({ success: true });
}
