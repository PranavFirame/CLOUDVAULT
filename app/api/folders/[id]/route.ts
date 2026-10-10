import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/auth-service";
import { db } from "@/lib/db/db-client";
import { RenameFolderSchema } from "@/lib/validation/schemas";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const sessionUser = await getSessionUser();
  if (!sessionUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const folder = await db.getFolderById(params.id, sessionUser.user.id);
  if (!folder) {
    return NextResponse.json({ error: "Folder not found" }, { status: 404 });
  }

  const body = await req.json();
  const parsed = RenameFolderSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.errors[0]?.message || "Invalid rename payload" },
      { status: 400 }
    );
  }

  await db.renameFolder(
    params.id,
    sessionUser.user.id,
    parsed.data.encryptedFolderName,
    parsed.data.nameNonce
  );

  return NextResponse.json({ success: true });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const sessionUser = await getSessionUser();
  if (!sessionUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const folder = await db.getFolderById(params.id, sessionUser.user.id);
  if (!folder) {
    return NextResponse.json({ error: "Folder not found" }, { status: 404 });
  }

  await db.deleteFolder(params.id, sessionUser.user.id);

  await db.createAuditEvent({
    userId: sessionUser.user.id,
    eventType: "FOLDER_DELETED",
    details: { folderId: params.id },
  });

  return NextResponse.json({ success: true });
}
