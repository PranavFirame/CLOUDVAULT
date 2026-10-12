"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  ShieldCheck,
  Lock,
  Unlock,
  RotateCw,
  Laptop,
  CheckCircle2,
  History,
  FileKey,
  RefreshCw,
} from "lucide-react";
import { Card, CardTitle, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useVault } from "@/lib/crypto/vault-context";

export default function SecurityCenterPage() {
  const { isUnlocked, lockVault, changePassphrase } = useVault();

  // Change passphrase state
  const [currentPassphrase, setCurrentPassphrase] = useState("");
  const [newPassphrase, setNewPassphrase] = useState("");
  const [confirmNewPassphrase, setConfirmNewPassphrase] = useState("");
  const [passphraseStatus, setPassphraseStatus] = useState<{
    success?: string;
    error?: string;
    loading?: boolean;
  }>({});

  // Sessions state
  const [sessions, setSessions] = useState<
    Array<{ id: string; createdAt: string; expiresAt: string; isCurrent: boolean }>
  >([]);

  // Audit events state
  const [auditEvents, setAuditEvents] = useState<
    Array<{ id: string; eventType: string; createdAt: string; details: any }>
  >([]);

  const fetchSecurityData = useCallback(async () => {
    try {
      const [sessRes, auditRes] = await Promise.all([
        fetch("/api/security/sessions"),
        fetch("/api/security/audit"),
      ]);

      if (sessRes.ok) {
        const sData = await sessRes.json();
        setSessions(sData.sessions || []);
      }

      if (auditRes.ok) {
        const aData = await auditRes.json();
        setAuditEvents(aData.events || []);
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    fetchSecurityData();
  }, [fetchSecurityData]);

  const handleChangePassphrase = async (e: React.FormEvent) => {
    e.preventDefault();
    setPassphraseStatus({ loading: true });

    if (newPassphrase.length < 12) {
      setPassphraseStatus({ error: "New passphrase must be at least 12 characters" });
      return;
    }

    if (newPassphrase !== confirmNewPassphrase) {
      setPassphraseStatus({ error: "New passphrases do not match" });
      return;
    }

    try {
      const ok = await changePassphrase(currentPassphrase, newPassphrase);
      if (ok) {
        setPassphraseStatus({ success: "Vault passphrase updated successfully!" });
        setCurrentPassphrase("");
        setNewPassphrase("");
        setConfirmNewPassphrase("");
        await fetchSecurityData();
      } else {
        setPassphraseStatus({ error: "Failed to update vault passphrase." });
      }
    } catch (err: unknown) {
      setPassphraseStatus({
        error: err instanceof Error ? err.message : "Passphrase rotation failed",
      });
    }
  };

  const handleRevokeSession = async (sessionId: string) => {
    try {
      const res = await fetch(`/api/security/sessions?id=${sessionId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        await fetchSecurityData();
      }
    } catch {
      // ignore
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl md:text-2xl font-bold tracking-tight text-foreground">
          Security Center
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Cryptographic status, memory key lifecycle, and session governance
        </p>
      </div>

      {/* Master Key Lifecycle Status Card */}
      <Card className="p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3 sm:gap-3.5 min-w-0">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                isUnlocked
                  ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-500"
                  : "bg-rose-500/10 border border-rose-500/20 text-rose-500"
              }`}
            >
              {isUnlocked ? <Unlock className="w-5 h-5" /> : <Lock className="w-5 h-5" />}
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-sm sm:text-base font-semibold text-foreground">
                  Master Key: {isUnlocked ? "Unlocked in Memory" : "Locked"}
                </h2>
                <Badge variant={isUnlocked ? "success" : "danger"}>
                  {isUnlocked ? "ACTIVE" : "PROTECTED"}
                </Badge>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 break-words">
                {isUnlocked
                  ? "Your 256-bit Master Key is currently held in transient browser RAM."
                  : "No decryption key is present in memory. Filenames and content remain encrypted."}
              </p>
            </div>
          </div>

          <div className="shrink-0 w-full sm:w-auto">
            {isUnlocked ? (
              <Button variant="danger" size="sm" onClick={lockVault} className="w-full sm:w-auto">
                <Lock className="w-3.5 h-3.5 mr-1.5" /> Lock Vault Now
              </Button>
            ) : (
              <Link href="/unlock" className="block sm:inline-block w-full sm:w-auto">
                <Button variant="primary" size="sm" className="w-full sm:w-auto">
                  <Unlock className="w-3.5 h-3.5 mr-1.5" /> Unlock Vault
                </Button>
              </Link>
            )}
          </div>
        </div>
      </Card>

      {/* Cryptographic Specifications Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <Card className="p-5 space-y-3">
          <CardHeader className="mb-0">
            <CardTitle className="flex items-center gap-1.5">
              <FileKey className="w-4 h-4 text-brand-500" /> Cryptographic Parameters
            </CardTitle>
          </CardHeader>
          <div className="space-y-2 text-xs font-mono">
            <div className="p-2.5 bg-surface-raised rounded-lg border border-surface-border flex justify-between">
              <span className="text-slate-500">Payload Cipher:</span>
              <span className="text-foreground font-semibold">AES-256-GCM (128-bit tag)</span>
            </div>
            <div className="p-2.5 bg-surface-raised rounded-lg border border-surface-border flex justify-between">
              <span className="text-slate-500">Passphrase KDF:</span>
              <span className="text-foreground font-semibold">Argon2id (m=64MB, t=3, p=4)</span>
            </div>
            <div className="p-2.5 bg-surface-raised rounded-lg border border-surface-border flex justify-between">
              <span className="text-slate-500">Key Derivation / Wrap:</span>
              <span className="text-foreground font-semibold">HKDF-SHA256 (Context-bound)</span>
            </div>
            <div className="p-2.5 bg-surface-raised rounded-lg border border-surface-border flex justify-between">
              <span className="text-slate-500">Nonce Generation:</span>
              <span className="text-foreground font-semibold">96-bit CSPRNG (Web Crypto)</span>
            </div>
            <div className="p-2.5 bg-surface-raised rounded-lg border border-surface-border flex justify-between">
              <span className="text-slate-500">Format Version:</span>
              <span className="text-foreground font-semibold">CloudVault Envelope v1</span>
            </div>
          </div>
        </Card>

        {/* Change Vault Passphrase Form */}
        <Card className="p-5 space-y-3">
          <CardHeader className="mb-0">
            <CardTitle className="flex items-center gap-1.5">
              <RotateCw className="w-4 h-4 text-emerald-500" /> Rotate Vault Passphrase
            </CardTitle>
          </CardHeader>

          {passphraseStatus.success && (
            <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{passphraseStatus.success}</span>
            </div>
          )}

          {passphraseStatus.error && (
            <div className="p-2.5 bg-rose-500/10 border border-rose-500/20 rounded-lg text-xs text-rose-600 dark:text-rose-400">
              {passphraseStatus.error}
            </div>
          )}

          <form onSubmit={handleChangePassphrase} className="space-y-2.5">
            <Input
              label="Current Vault Passphrase"
              type="password"
              required
              disabled={!isUnlocked}
              placeholder="Verify current passphrase"
              value={currentPassphrase}
              onChange={(e) => setCurrentPassphrase(e.target.value)}
            />
            <Input
              label="New Vault Passphrase"
              type="password"
              required
              disabled={!isUnlocked}
              placeholder="Min. 12 characters"
              value={newPassphrase}
              onChange={(e) => setNewPassphrase(e.target.value)}
            />
            <Input
              label="Confirm New Passphrase"
              type="password"
              required
              disabled={!isUnlocked}
              placeholder="Repeat new passphrase"
              value={confirmNewPassphrase}
              onChange={(e) => setConfirmNewPassphrase(e.target.value)}
            />
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={!isUnlocked}
              isLoading={passphraseStatus.loading}
              className="w-full mt-1"
            >
              Re-encrypt Master Key Envelope
            </Button>
          </form>
        </Card>
      </div>

      {/* Active Sessions Management */}
      <Card className="p-5 space-y-3">
        <CardHeader className="mb-0">
          <div>
            <CardTitle className="flex items-center gap-1.5">
              <Laptop className="w-4 h-4 text-brand-500" /> Active Local Sessions
            </CardTitle>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Cryptographically hashed session tokens managed in PostgreSQL
            </p>
          </div>
        </CardHeader>

        <div className="divide-y divide-surface-border text-xs">
          {sessions.map((sess) => (
            <div
              key={sess.id}
              className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-4 font-mono"
            >
              <div className="flex items-start sm:items-center gap-2.5 min-w-0">
                <Laptop className="w-4 h-4 text-slate-400 shrink-0 mt-0.5 sm:mt-0" />
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2 text-foreground font-medium">
                    <span className="truncate">Session: {sess.id.slice(0, 12)}...</span>
                    {sess.isCurrent && <Badge variant="info">CURRENT</Badge>}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5 break-words">
                    Created: {new Date(sess.createdAt).toLocaleString()} • Expires:{" "}
                    {new Date(sess.expiresAt).toLocaleDateString()}
                  </div>
                </div>
              </div>

              {!sess.isCurrent && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRevokeSession(sess.id)}
                  className="self-end sm:self-auto text-slate-500 hover:text-rose-600 text-xs px-2 py-1"
                >
                  Revoke Session
                </Button>
              )}
            </div>
          ))}
        </div>
      </Card>

      {/* Security Audit Events */}
      <Card className="p-4 sm:p-5 space-y-3">
        <CardHeader className="mb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-1.5">
              <History className="w-4 h-4 text-brand-500" /> Safe Audit Trail
            </CardTitle>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Nonsensitive operational security logs (never contains plaintext keys)
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchSecurityData}
            className="self-start sm:self-auto text-xs gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5 text-brand-500" /> Refresh Audit Trail
          </Button>
        </CardHeader>

        {auditEvents.length === 0 ? (
          <p className="text-xs text-slate-500 py-3 text-center">No audit events recorded yet.</p>
        ) : (
          <div className="divide-y divide-surface-border text-xs font-mono">
            {auditEvents.slice(0, 8).map((evt) => (
              <div key={evt.id} className="py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-4">
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-brand-500 shrink-0" />
                  <span className="text-foreground font-medium break-all">{evt.eventType}</span>
                </div>
                <div className="text-[11px] text-slate-500 pl-3.5 sm:pl-0">
                  {new Date(evt.createdAt).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
