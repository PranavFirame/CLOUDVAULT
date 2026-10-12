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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { VaultProvider, useVault } from "@/lib/crypto/vault-context";

function RegisterForm() {
  const router = useRouter();
  const { initializeVault } = useVault();

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

      // 2. Client-side Vault Initialization:
      // Derives KEK via Argon2id, generates Master Key, encrypts envelope, derives Recovery Secret
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
- Store this code offline in a secure location (e.g., password manager, safe deposit).
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

  if (recoverySecret) {
    return (
      <Card className="max-w-xl w-full p-8 space-y-6 border-sky-500/40 bg-[#0a0f1d]/95 shadow-2xl relative">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 mx-auto flex items-center justify-center shadow-[0_0_15px_rgba(245,158,11,0.2)]">
            <Key className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold text-white tracking-tight">Save Your Emergency Recovery Secret</h2>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            This is the <strong className="text-slate-200">only time</strong> your recovery secret will be displayed. You will need it if you ever forget your vault passphrase.
          </p>
        </div>

        <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
          <div className="text-[10px] font-mono uppercase tracking-widest text-slate-400">
            Emergency Master Recovery Secret
          </div>
          <div className="font-mono text-sm sm:text-base font-bold text-sky-400 tracking-wider break-all select-all py-1">
            {recoverySecret}
          </div>
        </div>

        <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-start gap-3 text-xs text-amber-300">
          <AlertTriangle className="w-5 h-5 shrink-0 text-amber-400 mt-0.5" />
          <p className="leading-relaxed">
            CloudVault uses zero-knowledge cryptography. Our local server has <strong>no copy</strong> of this recovery key. If you lose both your vault passphrase and this secret, your files will be permanently lost.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <Button
            type="button"
            variant="secondary"
            onClick={downloadRecoveryFile}
            className="flex-1"
          >
            <Download className="w-4 h-4 mr-2 text-sky-400" /> Download Key File (.txt)
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
          <p className="text-center text-[11px] text-slate-400 font-mono">
            Click &ldquo;Download Key File&rdquo; to enable proceeding.
          </p>
        )}
      </Card>
    );
  }

  return (
    <Card className="max-w-md w-full p-8 space-y-6 border-slate-800 bg-[#0a0f1d]/90 shadow-2xl relative">
      <div className="text-center space-y-2">
        <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-sky-500/20 to-blue-600/10 border border-sky-400/30 text-sky-400 mx-auto flex items-center justify-center shadow-[0_0_15px_rgba(56,189,248,0.2)]">
          <Shield className="w-6 h-6" />
        </div>
        <h1 className="text-lg font-bold text-white tracking-tight">Create CloudVault Account</h1>
        <p className="text-xs text-slate-400">
          Setup your local account & zero-knowledge client encryption
        </p>
      </div>

      {error && (
        <div className="p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-400 font-medium">
          {error}
        </div>
      )}

      <form onSubmit={handleRegister} className="space-y-4">
        <Input
          label="Email Address"
          type="email"
          required
          placeholder="developer@local"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-medium text-slate-300">
              Account Password (Server Login)
            </label>
            <button
              type="button"
              onClick={() => setShowPasswords(!showPasswords)}
              className="text-[11px] text-slate-400 hover:text-sky-400 transition-colors flex items-center gap-1 font-mono"
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
            helperText="Hashed on server with Argon2id / scrypt"
          />
        </div>

        <div className="pt-2 border-t border-slate-800 space-y-3">
          <div className="flex items-center gap-2">
            <Lock className="w-3.5 h-3.5 text-sky-400" />
            <span className="text-[11px] font-semibold text-slate-200 uppercase tracking-wider font-mono">
              Client-Side Encryption Passphrase
            </span>
          </div>

          <Input
            label="Vault Passphrase (Never leaves your browser)"
            type={showPasswords ? "text" : "password"}
            required
            placeholder="Min. 12 characters (keep memorable)"
            value={vaultPassphrase}
            onChange={(e) => setVaultPassphrase(e.target.value)}
            helperText="Derives 256-bit Master Key in browser memory"
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
          Initialize Encrypted Vault
        </Button>
      </form>

      <div className="text-center text-xs text-slate-400 pt-2 border-t border-slate-800">
        Already have a vault?{" "}
        <Link href="/login" className="text-sky-400 hover:text-sky-300 font-semibold transition-colors">
          Sign In
        </Link>
      </div>
    </Card>
  );
}

export default function RegisterPage() {
  return (
    <div className="min-h-screen bg-[#080c14] cyber-grid-bg flex items-center justify-center p-4">
      <RegisterForm />
    </div>
  );
}
