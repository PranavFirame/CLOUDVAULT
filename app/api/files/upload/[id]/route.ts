import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "../../../../../lib/auth/auth-service";
import { db } from "../../../../../lib/db/db-client";
import { defaultLocalStorageProvider } from "../../../../../lib/storage/local-storage-provider";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const fileId = params.id;
    const fileRecord = await db.getFileById(fileId, sessionUser.user.id);
    if (!fileRecord) {
      return NextResponse.json({ error: "File record not found" }, { status: 404 });
    }

    if (fileRecord.uploadStatus === "COMPLETED") {
      return NextResponse.json({ error: "File upload has already completed." }, { status: 409 });
    }

    // Read ciphertext bytes from incoming request body
    const arrayBuffer = await req.arrayBuffer();
    const dataBuffer = Buffer.from(arrayBuffer);

    if (dataBuffer.length === 0) {
      return NextResponse.json({ error: "Uploaded payload is empty." }, { status: 400 });
    }

    // Write ciphertext atomically to local filesystem
    const { size } = await defaultLocalStorageProvider.putEncryptedObject(
      fileRecord.opaqueObjectId,
      dataBuffer
    );

    // Finalize status in database
    await db.updateFileStatus(fileId, sessionUser.user.id, "COMPLETED", size);

    await db.createAuditEvent({
      userId: sessionUser.user.id,
      eventType: "ENCRYPTED_FILE_UPLOADED",
      details: {
        fileId,
        opaqueObjectId: fileRecord.opaqueObjectId,
        ciphertextSizeBytes: size,
      },
    });

    return NextResponse.json({
      success: true,
      fileId,
      ciphertextSizeBytes: size,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Upload processing failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
