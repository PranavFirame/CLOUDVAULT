import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { getSessionUser } from "@/lib/auth/auth-service";
import { db } from "@/lib/db/db-client";
import { InitiateUploadSchema } from "@/lib/validation/schemas";

const MAX_UPLOAD_SIZE = parseInt(process.env.MAX_UPLOAD_SIZE_BYTES || "104857600", 10);
const MAX_STORAGE_LIMIT = parseInt(process.env.MAX_STORAGE_BYTES || "5368709120", 10);

export async function POST(req: NextRequest) {
  const sessionUser = await getSessionUser();
  if (!sessionUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = InitiateUploadSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.errors[0]?.message || "Invalid upload parameters" },
      { status: 400 }
    );
  }

  const {
    fileId,
    declaredCiphertextSize,
    encryptedFileKey,
    fileKeyWrappingNonce,
    fileEncryptionNonce,
    encryptedMetadata,
    metadataNonce,
    folderId,
  } = parsed.data;

  if (declaredCiphertextSize > MAX_UPLOAD_SIZE) {
    return NextResponse.json(
      { error: `File size exceeds the maximum limit of ${MAX_UPLOAD_SIZE / 1024 / 1024} MiB` },
      { status: 400 }
    );
  }

  // Quota enforcement
  const currentUsed = await db.getUserStorageUsed(sessionUser.user.id);
  if (currentUsed + declaredCiphertextSize > MAX_STORAGE_LIMIT) {
    return NextResponse.json(
      { error: "Storage quota exceeded. Please delete existing files to free up space." },
      { status: 400 }
    );
  }

  // Verify folder ownership if specified
  if (folderId) {
    const folder = await db.getFolderById(folderId, sessionUser.user.id);
    if (!folder) {
      return NextResponse.json({ error: "Target folder not found" }, { status: 404 });
    }
  }

  // Generate opaque server-side object ID (never derived from client filename)
  const opaqueObjectId = `obj_${crypto.randomBytes(16).toString("hex")}`;

  const createdFile = await db.createFile({
    id: fileId,
    ownerId: sessionUser.user.id,
    opaqueObjectId,
    encryptedFileKey,
    fileKeyWrappingNonce,
    fileEncryptionNonce,
    encryptedMetadata,
    metadataNonce,
    ciphertextSizeBytes: declaredCiphertextSize,
    folderId: folderId || null,
  });

  return NextResponse.json({
    success: true,
    fileId: createdFile.id,
    opaqueObjectId,
  });
}
