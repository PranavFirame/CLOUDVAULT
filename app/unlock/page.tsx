"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Lock, Eye, EyeOff, ShieldCheck, Sun, Moon, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { useVault } from "@/lib/crypto/vault-context";
import { useTheme } from "@/components/theme-provider";

export default function UnlockPage() {
  const router = useRouter();
  const { unlockVault } = useVault();
  const { resolvedTheme, setTheme } = useTheme();
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
    <div className="min-h-screen bg-background flex flex-col justify-between p-4 selection:bg-brand-500 selection:text-white">
      {/* Top Header */}
      <div className="max-w-7xl w-full mx-auto flex items-center justify-between p-2">
        <Link href="/dashboard" className="flex items-center gap-2 text-xs text-slate-500 hover:text-foreground">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Dashboard
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
        <Card className="max-w-md w-full p-8 space-y-6 shadow-xl">
          <div className="text-center space-y-1.5">
            <div className="w-10 h-10 rounded-xl bg-brand-500/10 border border-brand-500/20 text-brand-500 mx-auto flex items-center justify-center">
              <Lock className="w-5 h-5" />
            </div>
            <h1 className="text-xl font-bold text-foreground tracking-tight">Unlock Your Vault</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Enter your vault passphrase to decrypt your keys in transient memory
            </p>
          </div>

          <div className="p-3 bg-surface-raised border border-surface-border rounded-lg text-xs text-slate-600 dark:text-slate-400 flex items-center gap-2 font-mono">
            <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
            <span>Argon2id derivation runs strictly in your browser.</span>
          </div>

          {error && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-lg text-xs text-rose-600 dark:text-rose-400">
              {error}
            </div>
          )}

          <form onSubmit={handleUnlock} className="space-y-4">
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                  Vault Passphrase
                </label>
                <button
                  type="button"
                  onClick={() => setShowPassphrase(!showPassphrase)}
                  className="text-[11px] text-slate-500 hover:text-foreground flex items-center gap-1"
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
              Unlock Vault Keys
            </Button>
          </form>

          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-3 border-t border-surface-border">
            <Link
              href="/recover"
              className="text-brand-500 hover:underline font-medium"
            >
              Forgot passphrase? Use Recovery Secret
            </Link>
          </div>
        </Card>
      </div>

      {/* Footer */}
      <div className="text-center text-xs text-slate-400 py-3">
        Zero-Knowledge Encrypted • Keys Never Leave Your Device
      </div>
    </div>
  );
}
