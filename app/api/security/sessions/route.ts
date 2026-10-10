import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/auth-service";
import { db } from "@/lib/db/db-client";

export async function GET() {
  const sessionUser = await getSessionUser();
  if (!sessionUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sessions = await db.listUserSessions(sessionUser.user.id);
  return NextResponse.json({
    sessions: sessions.map((s) => ({
      id: s.id,
      createdAt: s.createdAt,
      expiresAt: s.expiresAt,
      isCurrent: s.id === sessionUser.sessionId,
    })),
  });
}

export async function DELETE(req: NextRequest) {
  const sessionUser = await getSessionUser();
  if (!sessionUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const sessionId = searchParams.get("id");
  if (!sessionId) {
    return NextResponse.json({ error: "Session ID required" }, { status: 400 });
  }

  await db.revokeSession(sessionId, sessionUser.user.id);

  return NextResponse.json({ success: true });
}
