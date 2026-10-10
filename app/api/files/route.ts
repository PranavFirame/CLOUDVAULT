import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/auth-service";
import { db } from "@/lib/db/db-client";

export async function GET(req: NextRequest) {
  const sessionUser = await getSessionUser();
  if (!sessionUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const folderIdParam = searchParams.get("folderId");
  const folderId = folderIdParam === "root" ? null : folderIdParam;

  const files = await db.listFiles(
    sessionUser.user.id,
    folderId === null ? null : folderId || undefined
  );

  return NextResponse.json({ files });
}
