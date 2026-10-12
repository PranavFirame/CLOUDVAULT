"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { KeyRound, ShieldAlert, CheckCircle2, ArrowLeft, Sun, Moon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { useVault } from "@/lib/crypto/vault-context";
import { useTheme } from "@/components/theme-provider";

export default function RecoverPage() {
  const router = useRouter();
  const { recoverVault } = useVault();
  const { resolvedTheme, setTheme } = useTheme();

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

  return (
    <div className="min-h-screen bg-background flex flex-col justify-between p-4 selection:bg-brand-500 selection:text-white">
      {/* Top Header */}
      <div className="max-w-7xl w-full mx-auto flex items-center justify-between p-2">
        <Link href="/unlock" className="flex items-center gap-2 text-xs text-slate-500 hover:text-foreground">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Vault Unlock
        </Link>
        <button
          onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
          className="p-2 rounded-lg text-slate-500 hover:text-foreground hover:bg-surface-raised transition-colors"
          title="Toggle theme"
        >
          {resolvedTheme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>
      </div>

      {/* Main Card */}
      <div className="flex items-center justify-center py-8">
        {success ? (
          <Card className="max-w-md w-full p-8 space-y-6 text-center shadow-xl">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 mx-auto flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-bold text-foreground">Vault Successfully Recovered!</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Your Master Key has been re-encrypted with your new passphrase. All previously uploaded encrypted files remain 100% accessible.
            </p>
            <div className="text-xs font-mono text-brand-500">Redirecting to Dashboard...</div>
          </Card>
        ) : (
          <Card className="max-w-md w-full p-8 space-y-6 shadow-xl">
            <div className="text-center space-y-1.5">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-500 mx-auto flex items-center justify-center">
                <KeyRound className="w-5 h-5" />
              </div>
              <h1 className="text-xl font-bold text-foreground tracking-tight">Recover Encrypted Vault</h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Restore your Master Key using your Emergency Recovery Secret
              </p>
            </div>

            <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg text-xs text-amber-600 dark:text-amber-400 flex items-start gap-2.5">
              <ShieldAlert className="w-4 h-4 shrink-0 text-amber-500 mt-0.5" />
              <span>
                Recovery decrypts the master key envelope locally and resets your vault passphrase without data loss.
              </span>
            </div>

            {error && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-lg text-xs text-rose-600 dark:text-rose-400">
                {error}
              </div>
            )}

            <form onSubmit={handleRecover} className="space-y-4">
              <Input
                label="Emergency Recovery Secret"
                type="text"
                required
                autoFocus
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
                className="w-full mt-2"
                isLoading={isLoading}
              >
                Recover & Reset Passphrase
              </Button>
            </form>

            <div className="text-center text-xs text-slate-500 dark:text-slate-400 pt-3 border-t border-surface-border">
              <Link
                href="/unlock"
                className="text-brand-500 hover:underline font-medium inline-flex items-center gap-1"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Back to Vault Unlock
              </Link>
            </div>
          </Card>
        )}
      </div>

      {/* Footer */}
      <div className="text-center text-xs text-slate-400 py-3">
        Zero-Knowledge Encrypted • Client-Side Recovery Engine
      </div>
    </div>
  );
}
