import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "../../../../lib/auth/auth-service";
import { db } from "../../../../lib/db/db-client";
import { defaultLocalStorageProvider } from "../../../../lib/storage/local-storage-provider";
import { UpdateFileMetadataSchema } from "../../../../lib/validation/schemas";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const sessionUser = await getSessionUser();
  if (!sessionUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const file = await db.getFileById(params.id, sessionUser.user.id);
  if (!file) {
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }

  return NextResponse.json({ file });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const sessionUser = await getSessionUser();
  if (!sessionUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const file = await db.getFileById(params.id, sessionUser.user.id);
  if (!file) {
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }

  const body = await req.json();
  const parsed = UpdateFileMetadataSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.errors[0]?.message || "Invalid update data" },
      { status: 400 }
    );
  }

  // If moving folder, verify destination folder
  if (parsed.data.folderId) {
    const folder = await db.getFolderById(parsed.data.folderId, sessionUser.user.id);
    if (!folder) {
      return NextResponse.json({ error: "Target folder not found" }, { status: 404 });
    }
  }

  await db.updateFileMetadata(params.id, sessionUser.user.id, {
    encryptedMetadata: parsed.data.encryptedMetadata,
    metadataNonce: parsed.data.metadataNonce,
    folderId: parsed.data.folderId,
  });

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

  const file = await db.getFileById(params.id, sessionUser.user.id);
  if (!file) {
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }

  // Delete physical object from disk
  try {
    await defaultLocalStorageProvider.deleteEncryptedObject(file.opaqueObjectId);
  } catch {
    // If missing on disk, still proceed with DB deletion
  }

  await db.deleteFile(params.id, sessionUser.user.id);

  await db.createAuditEvent({
    userId: sessionUser.user.id,
    eventType: "ENCRYPTED_FILE_DELETED",
    details: { fileId: params.id, opaqueObjectId: file.opaqueObjectId },
  });

  return NextResponse.json({ success: true });
}
