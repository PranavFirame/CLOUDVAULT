"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Shield,
  Lock,
  Key,
  Download,
  AlertTriangle,
  CheckCircle2,
  Eye,
  EyeOff,
  Sun,
  Moon,
} from "lucide-react";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Card } from "../../components/ui/card";
import { useVault } from "../../lib/crypto/vault-context";
import { useTheme } from "../../components/theme-provider";

export default function RegisterPage() {
  const router = useRouter();
  const { initializeVault } = useVault();
  const { resolvedTheme, setTheme } = useTheme();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [vaultPassphrase, setVaultPassphrase] = useState("");
  const [confirmVaultPassphrase, setConfirmVaultPassphrase] = useState("");
  const [showPasswords, setShowPasswords] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Recovery modal step
  const [recoverySecret, setRecoverySecret] = useState<string | null>(null);
  const [hasSavedRecovery, setHasSavedRecovery] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password.length < 10) {
      setError("Account password must be at least 10 characters.");
      return;
    }

    if (vaultPassphrase.length < 12) {
      setError("Vault passphrase must be at least 12 characters for secure key derivation.");
      return;
    }

    if (vaultPassphrase !== confirmVaultPassphrase) {
      setError("Vault passphrases do not match.");
      return;
    }

    setIsLoading(true);

    try {
      // 1. Register account with server
      const regRes = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const regData = await regRes.json();
      if (!regRes.ok) {
        throw new Error(regData.error || "Failed to create account.");
      }

      // 2. Client-side Vault Initialization
      const initResult = await initializeVault(vaultPassphrase);
      setRecoverySecret(initResult.recoverySecret);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Registration failed.";
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const downloadRecoveryFile = () => {
    if (!recoverySecret) return;
    const content = `CLOUDVAULT RECOVERY SECRET DOCUMENT
=========================================
Generated for: ${email}
Date: ${new Date().toISOString()}

RECOVERY SECRET:
${recoverySecret}

SECURITY WARNING:
- Store this code offline in a secure location (e.g. password manager, safe deposit).
- This secret can restore your master encryption key if you forget your vault passphrase.
- CloudVault server NEVER possesses this recovery key or your vault passphrase.
- If you lose both your vault passphrase and this recovery secret, your encrypted files CANNOT be recovered by anyone.
=========================================`;

    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `cloudvault-recovery-${email.replace(/[^a-z0-9]/gi, "_")}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setHasSavedRecovery(true);
  };

  const handleFinishSetup = () => {
    router.replace("/dashboard");
  };

  return (
    <div className="min-h-screen bg-background flex flex-col justify-between p-4 selection:bg-brand-500 selection:text-white">
      {/* Top Header */}
      <div className="max-w-7xl w-full mx-auto flex items-center justify-between p-2">
        <Link href="/" className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-[rgba(240,158,79,0.1)] border border-[rgba(240,158,79,0.3)] flex items-center justify-center text-[rgb(240_158_79)] shadow-[0_0_12px_rgba(240,158,79,0.2)]">
            <Shield className="w-4 h-4" />
          </div>
          <span className="font-bold text-base tracking-tight text-foreground">
            CLOUD<span className="text-[rgb(240_158_79)]">VAULT</span>
          </span>
        </Link>
        <button
          onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
          className="p-2 rounded-lg text-slate-500 hover:text-foreground hover:bg-surface-raised transition-colors"
          title="Toggle theme"
        >
          {resolvedTheme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>
      </div>

      {/* Main Content */}
      <div className="flex items-center justify-center py-8">
        {recoverySecret ? (
          <Card className="max-w-lg w-full p-8 space-y-6 shadow-2xl">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-500 mx-auto flex items-center justify-center">
                <Key className="w-6 h-6" />
              </div>
              <h2 className="text-xl font-bold text-foreground">Save Your Recovery Secret</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                This is the <strong className="text-foreground">only time</strong> your recovery secret will be displayed.
              </p>
            </div>

            <div className="p-4 bg-surface-raised border border-surface-border rounded-xl space-y-1.5">
              <div className="text-[10px] font-mono uppercase tracking-wider text-slate-500">
                Emergency Master Recovery Secret
              </div>
              <div className="font-mono text-base font-bold text-brand-500 tracking-wider break-all select-all py-1">
                {recoverySecret}
              </div>
            </div>

            <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-start gap-3 text-xs text-amber-600 dark:text-amber-400">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <p>
                Our server has <strong>no copy</strong> of this key. If you lose both your vault passphrase and this secret, files cannot be recovered.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <Button
                type="button"
                variant="secondary"
                onClick={downloadRecoveryFile}
                className="flex-1"
              >
                <Download className="w-4 h-4 mr-2" /> Download File (.txt)
              </Button>

              <Button
                type="button"
                variant="primary"
                disabled={!hasSavedRecovery}
                onClick={handleFinishSetup}
                className="flex-1"
              >
                <CheckCircle2 className="w-4 h-4 mr-2" /> Proceed to Vault
              </Button>
            </div>

            {!hasSavedRecovery && (
              <p className="text-center text-[11px] text-slate-400">
                Please download your recovery file to unlock the &ldquo;Proceed&rdquo; button.
              </p>
            )}
          </Card>
        ) : (
          <Card className="max-w-md w-full p-8 space-y-6 shadow-xl">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 rounded-xl bg-[rgba(240,158,79,0.1)] border border-[rgba(240,158,79,0.3)] text-[rgb(240_158_79)] mx-auto flex items-center justify-center shadow-[0_0_12px_rgba(240,158,79,0.2)]">
                <Shield className="w-6 h-6" />
              </div>
              <h1 className="text-xl font-bold text-foreground tracking-tight">Create CloudVault Account</h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Two-tier zero-knowledge credential setup
              </p>
            </div>

            {error && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-lg text-xs text-rose-600 dark:text-rose-400">
                {error}
              </div>
            )}

            <form onSubmit={handleRegister} className="space-y-4">
              <Input
                label="Email Address"
                type="email"
                required
                autoFocus
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                    Account Password (Login)
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowPasswords(!showPasswords)}
                    className="text-[11px] text-slate-500 hover:text-foreground flex items-center gap-1"
                  >
                    {showPasswords ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                    {showPasswords ? "Hide" : "Show"}
                  </button>
                </div>
                <Input
                  type={showPasswords ? "text" : "password"}
                  required
                  placeholder="Min. 10 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  helperText="Hashed on server with Argon2id"
                />
              </div>

              <div className="pt-2 border-t border-surface-border space-y-3">
                <div className="flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-brand-500" />
                  <span className="text-xs font-semibold text-foreground uppercase tracking-wide">
                    Vault Encryption Passphrase
                  </span>
                </div>

                <Input
                  label="Vault Passphrase (Never sent to server)"
                  type={showPasswords ? "text" : "password"}
                  required
                  placeholder="Min. 12 characters"
                  value={vaultPassphrase}
                  onChange={(e) => setVaultPassphrase(e.target.value)}
                  helperText="Derives your Master Encryption Key client-side"
                />

                <Input
                  label="Confirm Vault Passphrase"
                  type={showPasswords ? "text" : "password"}
                  required
                  placeholder="Repeat vault passphrase"
                  value={confirmVaultPassphrase}
                  onChange={(e) => setConfirmVaultPassphrase(e.target.value)}
                />
              </div>

              <Button
                type="submit"
                variant="primary"
                size="lg"
                className="w-full mt-2"
                isLoading={isLoading}
              >
                Create Account & Initialize Vault
              </Button>
            </form>

            <div className="text-center text-xs text-slate-500 dark:text-slate-400 pt-3 border-t border-surface-border">
              Already have an account?{" "}
              <Link href="/login" className="text-brand-500 hover:underline font-semibold">
                Sign In
              </Link>
            </div>
          </Card>
        )}
      </div>

      {/* Footer */}
      <div className="text-center text-xs text-slate-400 py-3">
        Zero-Knowledge Encrypted • Separate Account & Encryption Credentials
      </div>
    </div>
  );
}
