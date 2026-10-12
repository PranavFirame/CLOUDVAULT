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
    <Card className="max-w-md w-full p-8 space-y-6 border-slate-800 bg-[#0a0f1d]/90 shadow-2xl relative">
      <div className="text-center space-y-2">
        <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-sky-500/20 to-blue-600/10 border border-sky-400/30 text-sky-400 mx-auto flex items-center justify-center shadow-[0_0_15px_rgba(56,189,248,0.2)]">
          <Lock className="w-6 h-6" />
        </div>
        <h1 className="text-lg font-bold text-white tracking-tight">Unlock Your Vault</h1>
        <p className="text-xs text-slate-400">
          Enter your client-side vault passphrase to decrypt your master key in memory
        </p>
      </div>

      <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-xl text-xs text-slate-300 flex items-center gap-2.5 font-mono">
        <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
        <span className="text-[11px]">Argon2id derivation runs locally in browser RAM</span>
      </div>

      {error && (
        <div className="p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-400 font-medium">
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
              className="text-[11px] text-slate-400 hover:text-sky-400 transition-colors flex items-center gap-1 font-mono"
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
          className="w-full mt-2"
          isLoading={isLoading}
        >
          Unlock Encrypted Vault
        </Button>
      </form>

      <div className="flex items-center justify-center text-xs text-slate-400 pt-3 border-t border-slate-800">
        <Link
          href="/recover"
          className="text-sky-400 hover:text-sky-300 flex items-center gap-1.5 font-semibold transition-colors"
        >
          <KeyRound className="w-3.5 h-3.5" /> Forgot Passphrase? Use Recovery Secret
        </Link>
      </div>
    </Card>
  );
}

export default function UnlockPage() {
  return (
    <div className="min-h-screen bg-[#080c14] cyber-grid-bg flex items-center justify-center p-4">
      <UnlockForm />
    </div>
  );
}
