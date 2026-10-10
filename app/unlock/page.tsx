"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Lock, KeyRound, Eye, EyeOff, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { VaultProvider, useVault } from "@/lib/crypto/vault-context";

function UnlockForm() {
  const router = useRouter();
  const { unlockVault } = useVault();
  const [passphrase, setPassphrase] = useState("");
  const [showPassphrase, setShowPassphrase] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      await unlockVault(passphrase);
      router.push("/dashboard");
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : "Vault unlocking failed: Incorrect passphrase or corrupted envelope.";
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="max-w-md w-full p-8 space-y-6">
      <div className="text-center space-y-2">
        <div className="w-12 h-12 rounded-xl bg-brand-500/10 border border-brand-500/30 text-brand-400 mx-auto flex items-center justify-center shadow-[0_0_12px_rgba(56,189,248,0.2)]">
          <Lock className="w-6 h-6" />
        </div>
        <h1 className="text-xl font-bold text-white tracking-tight">Unlock Your Vault</h1>
        <p className="text-xs text-slate-400">
          Enter your client-side vault passphrase to decrypt your master key in memory
        </p>
      </div>

      <div className="p-3 bg-slate-900 border border-surface-border rounded-lg text-xs text-slate-400 flex items-center gap-2 font-mono">
        <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
        <span>Argon2id KDF derivation runs locally in your browser.</span>
      </div>

      {error && (
        <div className="p-3.5 bg-red-500/10 border border-red-500/30 rounded-lg text-xs text-red-400">
          {error}
        </div>
      )}

      <form onSubmit={handleUnlock} className="space-y-4">
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-medium text-slate-300">
              Vault Passphrase
            </label>
            <button
              type="button"
              onClick={() => setShowPassphrase(!showPassphrase)}
              className="text-[11px] text-slate-400 hover:text-slate-200 flex items-center gap-1"
            >
              {showPassphrase ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
              {showPassphrase ? "Hide" : "Show"}
            </button>
          </div>
          <Input
            type={showPassphrase ? "text" : "password"}
            required
            autoFocus
            placeholder="Enter your vault passphrase"
            value={passphrase}
            onChange={(e) => setPassphrase(e.target.value)}
          />
        </div>

        <Button
          type="submit"
          variant="primary"
          size="lg"
          className="w-full mt-4"
          isLoading={isLoading}
        >
          Unlock Encrypted Vault
        </Button>
      </form>

      <div className="flex items-center justify-between text-xs text-slate-400 pt-3 border-t border-surface-border/60">
        <Link
          href="/recover"
          className="text-brand-400 hover:text-brand-300 flex items-center gap-1 font-medium"
        >
          <KeyRound className="w-3.5 h-3.5" /> Forgot Passphrase? Use Recovery Secret
        </Link>
      </div>
    </Card>
  );
}

export default function UnlockPage() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <VaultProvider>
        <UnlockForm />
      </VaultProvider>
    </div>
  );
}
