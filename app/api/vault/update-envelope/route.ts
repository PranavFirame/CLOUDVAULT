import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "../../../../lib/auth/auth-service";
import { db } from "../../../../lib/db/db-client";
import { VaultUpdateSchema } from "../../../../lib/validation/schemas";

export async function POST(req: NextRequest) {
  const sessionUser = await getSessionUser();
  if (!sessionUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const existing = await db.getVaultKey(sessionUser.user.id);
  if (!existing) {
    return NextResponse.json({ error: "Vault not initialized" }, { status: 404 });
  }

  const body = await req.json();
  const parsed = VaultUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.errors[0]?.message || "Invalid payload" },
      { status: 400 }
    );
  }

  await db.saveVaultKey({
    userId: sessionUser.user.id,
    encryptedMasterKey: parsed.data.encryptedMasterKey,
    keyEncryptionNonce: parsed.data.keyEncryptionNonce,
    kdfSalt: parsed.data.kdfSalt,
    kdfParams: parsed.data.kdfParams,
    encryptedRecoveryKey: existing.encryptedRecoveryKey,
    recoveryNonce: existing.recoveryNonce,
  });

  await db.createAuditEvent({
    userId: sessionUser.user.id,
    eventType: "VAULT_PASSPHRASE_OR_RECOVERY_UPDATED",
    details: {},
  });

  return NextResponse.json({ success: true });
}
