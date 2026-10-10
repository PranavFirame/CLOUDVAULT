import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/auth-service";
import { db } from "@/lib/db/db-client";

const MAX_STORAGE_LIMIT = parseInt(process.env.MAX_STORAGE_BYTES || "5368709120", 10);

export async function GET() {
  const sessionUser = await getSessionUser();
  if (!sessionUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const usedBytes = await db.getUserStorageUsed(sessionUser.user.id);
  const files = await db.listFiles(sessionUser.user.id);

  return NextResponse.json({
    usedBytes,
    quotaBytes: MAX_STORAGE_LIMIT,
    fileCount: files.length,
    percentageUsed: Number(((usedBytes / MAX_STORAGE_LIMIT) * 100).toFixed(2)),
  });
}
