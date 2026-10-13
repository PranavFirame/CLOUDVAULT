import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "../../../lib/auth/auth-service";
import { db } from "../../../lib/db/db-client";
import { CreateFolderSchema } from "../../../lib/validation/schemas";

export async function GET(req: NextRequest) {
  const sessionUser = await getSessionUser();
  if (!sessionUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const parentFolderId = searchParams.get("parentFolderId");

  const folders = await db.listFolders(
    sessionUser.user.id,
    parentFolderId === "root" ? null : parentFolderId || undefined
  );

  return NextResponse.json({ folders });
}

export async function POST(req: NextRequest) {
  const sessionUser = await getSessionUser();
  if (!sessionUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = CreateFolderSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.errors[0]?.message || "Invalid folder data" },
      { status: 400 }
    );
  }

  const { encryptedFolderName, nameNonce, parentFolderId } = parsed.data;

  if (parentFolderId) {
    const parent = await db.getFolderById(parentFolderId, sessionUser.user.id);
    if (!parent) {
      return NextResponse.json({ error: "Parent folder not found" }, { status: 404 });
    }
  }

  const folder = await db.createFolder({
    ownerId: sessionUser.user.id,
    encryptedFolderName,
    nameNonce,
    parentFolderId: parentFolderId || null,
  });

  await db.createAuditEvent({
    userId: sessionUser.user.id,
    eventType: "FOLDER_CREATED",
    details: { folderId: folder.id },
  });

  return NextResponse.json({ success: true, folder });
}
