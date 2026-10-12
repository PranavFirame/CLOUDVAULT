"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { KeyRound, ShieldAlert, CheckCircle2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { VaultProvider, useVault } from "@/lib/crypto/vault-context";

function RecoveryForm() {
  const router = useRouter();
  const { recoverVault } = useVault();

  const [recoverySecret, setRecoverySecret] = useState("");
  const [newPassphrase, setNewPassphrase] = useState("");
  const [confirmPassphrase, setConfirmPassphrase] = useState("");

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleRecover = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!recoverySecret.trim()) {
      setError("Please enter your emergency recovery secret.");
      return;
    }

    if (newPassphrase.length < 12) {
      setError("New vault passphrase must be at least 12 characters.");
      return;
    }

    if (newPassphrase !== confirmPassphrase) {
      setError("New passphrases do not match.");
      return;
    }

    setIsLoading(true);

    try {
      await recoverVault(recoverySecret.trim(), newPassphrase);
      setSuccess(true);
      setTimeout(() => {
        router.push("/dashboard");
      }, 1500);
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : "Recovery failed: Invalid recovery secret or corrupted envelope.";
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <Card className="max-w-md w-full p-8 space-y-6 text-center">
        <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 mx-auto flex items-center justify-center">
          <CheckCircle2 className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold text-white">Vault Successfully Recovered!</h2>
        <p className="text-xs text-slate-400">
          Your Master Key has been re-encrypted with your new passphrase. All previously uploaded encrypted files remain 100% accessible.
        </p>
        <div className="text-xs font-mono text-brand-400">Redirecting to Dashboard...</div>
      </Card>
    );
  }

  return (
    <Card className="max-w-md w-full p-8 space-y-6">
      <div className="text-center space-y-2">
        <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 mx-auto flex items-center justify-center shadow-[0_0_12px_rgba(245,158,11,0.2)]">
          <KeyRound className="w-6 h-6" />
        </div>
        <h1 className="text-xl font-bold text-white tracking-tight">Recover Encrypted Vault</h1>
        <p className="text-xs text-slate-400">
          Restore your Master Key using your Emergency Recovery Secret
        </p>
      </div>

      <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg text-xs text-amber-300 flex items-start gap-2.5">
        <ShieldAlert className="w-4 h-4 shrink-0 text-amber-400 mt-0.5" />
        <span>
          Recovery decrypts the master key envelope locally and resets your vault passphrase without data loss.
        </span>
      </div>

      {error && (
        <div className="p-3.5 bg-red-500/10 border border-red-500/30 rounded-lg text-xs text-red-400">
          {error}
        </div>
      )}

      <form onSubmit={handleRecover} className="space-y-4">
        <Input
          label="Emergency Recovery Secret"
          type="text"
          required
          placeholder="CV-XXXX-XXXX-XXXX-XXXX..."
          value={recoverySecret}
          onChange={(e) => setRecoverySecret(e.target.value)}
          className="font-mono text-xs uppercase"
        />

        <Input
          label="New Vault Passphrase"
          type="password"
          required
          placeholder="Min. 12 characters"
          value={newPassphrase}
          onChange={(e) => setNewPassphrase(e.target.value)}
        />

        <Input
          label="Confirm New Vault Passphrase"
          type="password"
          required
          placeholder="Repeat new vault passphrase"
          value={confirmPassphrase}
          onChange={(e) => setConfirmPassphrase(e.target.value)}
        />

        <Button
          type="submit"
          variant="primary"
          size="lg"
          className="w-full mt-4"
          isLoading={isLoading}
        >
          Recover & Rotate Passphrase
        </Button>
      </form>

      <div className="text-center text-xs text-slate-400 pt-2 border-t border-surface-border/60">
        <Link
          href="/unlock"
          className="text-slate-400 hover:text-slate-200 inline-flex items-center gap-1.5"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Vault Unlock
        </Link>
      </div>
    </Card>
  );
}

export default function RecoverPage() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <RecoveryForm />
    </div>
  );
}
