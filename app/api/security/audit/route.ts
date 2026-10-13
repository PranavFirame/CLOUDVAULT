import { NextResponse } from "next/server";
import { getSessionUser } from "../../../../lib/auth/auth-service";
import { db } from "../../../../lib/db/db-client";

export async function GET() {
  const sessionUser = await getSessionUser();
  if (!sessionUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const events = await db.listAuditEvents(sessionUser.user.id);
  return NextResponse.json({
    events: events.map((e) => ({
      id: e.id,
      eventType: e.eventType,
      details: typeof e.details === "string" ? JSON.parse(e.details) : e.details,
      createdAt: e.createdAt,
    })),
  });
}
