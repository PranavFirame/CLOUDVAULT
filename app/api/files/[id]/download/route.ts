import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/auth-service";
import { db } from "@/lib/db/db-client";
import { defaultLocalStorageProvider } from "@/lib/storage/local-storage-provider";

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

  if (file.uploadStatus !== "COMPLETED") {
    return NextResponse.json({ error: "File is not ready for download" }, { status: 400 });
  }

  const ciphertext = await defaultLocalStorageProvider.getEncryptedObject(file.opaqueObjectId);
  if (!ciphertext) {
    return NextResponse.json({ error: "Encrypted object missing from local storage" }, { status: 404 });
  }

  await db.createAuditEvent({
    userId: sessionUser.user.id,
    eventType: "ENCRYPTED_FILE_DOWNLOADED",
    details: { fileId: file.id, opaqueObjectId: file.opaqueObjectId },
  });

  // Return binary response with metadata headers for client-side decryption
  const headers = new Headers();
  headers.set("Content-Type", "application/octet-stream");
  headers.set("Content-Disposition", `attachment; filename="${file.id}.enc"`);
  headers.set("X-File-Id", file.id);
  headers.set("X-Encrypted-File-Key", file.encryptedFileKey);
  headers.set("X-File-Key-Wrapping-Nonce", file.fileKeyWrappingNonce);
  headers.set("X-File-Encryption-Nonce", file.fileEncryptionNonce);
  headers.set("X-Encrypted-Metadata", file.encryptedMetadata);
  headers.set("X-Metadata-Nonce", file.metadataNonce);
  headers.set("X-Ciphertext-Size", file.ciphertextSizeBytes.toString());

  return new NextResponse(new Uint8Array(ciphertext), {
    status: 200,
    headers,
  });
}
