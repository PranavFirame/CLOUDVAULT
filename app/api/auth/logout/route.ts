import { NextResponse } from "next/server";
import { revokeCurrentSession, getSessionUser } from "../../../../lib/auth/auth-service";
import { db } from "../../../../lib/db/db-client";

export async function POST() {
  const sessionUser = await getSessionUser();
  if (sessionUser) {
    await db.createAuditEvent({
      userId: sessionUser.user.id,
      eventType: "USER_LOGGED_OUT",
      details: {},
    });
  }
  await revokeCurrentSession();
  return NextResponse.json({ success: true });
}
