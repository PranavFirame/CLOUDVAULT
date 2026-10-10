import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/auth-service";
import { db } from "@/lib/db/db-client";
import { VaultInitializeSchema } from "@/lib/validation/schemas";

export async function POST(req: NextRequest) {
  const sessionUser = await getSessionUser();
  if (!sessionUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const existing = await db.getVaultKey(sessionUser.user.id);
  if (existing) {
    return NextResponse.json({ error: "Vault is already initialized." }, { status: 400 });
  }

  const body = await req.json();
  const parsed = VaultInitializeSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.errors[0]?.message || "Invalid envelope payload" },
      { status: 400 }
    );
  }

  await db.saveVaultKey({
    userId: sessionUser.user.id,
    encryptedMasterKey: parsed.data.encryptedMasterKey,
    keyEncryptionNonce: parsed.data.keyEncryptionNonce,
    kdfSalt: parsed.data.kdfSalt,
    kdfParams: parsed.data.kdfParams,
    formatVersion: parsed.data.formatVersion,
    encryptedRecoveryKey: parsed.data.encryptedRecoveryKey,
    recoveryNonce: parsed.data.recoveryNonce,
  });

  await db.createAuditEvent({
    userId: sessionUser.user.id,
    eventType: "VAULT_INITIALIZED",
    details: { formatVersion: parsed.data.formatVersion },
  });

  return NextResponse.json({ success: true });
}
