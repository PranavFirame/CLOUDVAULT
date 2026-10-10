import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/auth-service";
import { db } from "@/lib/db/db-client";

export async function GET() {
  const sessionUser = await getSessionUser();
  if (!sessionUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const vaultKey = await db.getVaultKey(sessionUser.user.id);
  if (!vaultKey) {
    return NextResponse.json({ initialized: false });
  }

  return NextResponse.json({
    initialized: true,
    encryptedMasterKey: vaultKey.encryptedMasterKey,
    keyEncryptionNonce: vaultKey.keyEncryptionNonce,
    kdfSalt: vaultKey.kdfSalt,
    kdfParams: vaultKey.kdfParams,
    formatVersion: vaultKey.formatVersion,
    encryptedRecoveryKey: vaultKey.encryptedRecoveryKey,
    recoveryNonce: vaultKey.recoveryNonce,
  });
}
