"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  ShieldCheck,
  Lock,
  Unlock,
  KeyRound,
  RotateCw,
  Clock,
  Laptop,
  CheckCircle2,
  AlertTriangle,
  History,
  FileKey,
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
    <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Security Center</h1>
          <p className="text-xs text-slate-400 mt-1">
            Cryptographic status, memory key lifecycle, and session governance
          </p>
        </div>

        {/* Master Key Lifecycle Status Card */}
        <Card className="p-6 border-brand-500/30">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div
                className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                  isUnlocked
                    ? "bg-emerald-500/10 border border-emerald-500/30 text-emerald-400"
                    : "bg-rose-500/10 border border-rose-500/30 text-rose-400"
                }`}
              >
                {isUnlocked ? <Unlock className="w-6 h-6" /> : <Lock className="w-6 h-6" />}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold text-white">
                    Master Key Status: {isUnlocked ? "Unlocked in Memory" : "Locked"}
                  </h2>
                  <Badge variant={isUnlocked ? "success" : "danger"}>
                    {isUnlocked ? "ACTIVE" : "PROTECTED"}
                  </Badge>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  {isUnlocked
                    ? "Your 256-bit Master Key is currently held in transient browser memory."
                    : "No decryption key is present in memory. Filenames and content remain encrypted."}
                </p>
              </div>
            </div>

            <div>
              {isUnlocked ? (
                <Button variant="danger" size="sm" onClick={lockVault}>
                  <Lock className="w-4 h-4 mr-1.5" /> Lock Vault Now
                </Button>
              ) : (
                <Link href="/unlock">
                  <Button variant="primary" size="sm">
                    <Unlock className="w-4 h-4 mr-1.5" /> Unlock Vault
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </Card>

        {/* Cryptographic Specifications Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="p-6 space-y-4">
            <CardHeader className="mb-0">
              <CardTitle className="flex items-center gap-2">
                <FileKey className="w-4 h-4 text-brand-400" /> Cryptographic Parameters
              </CardTitle>
            </CardHeader>
            <div className="space-y-2.5 text-xs font-mono">
              <div className="p-2.5 bg-slate-900 rounded-lg border border-surface-border flex justify-between">
                <span className="text-slate-400">Payload Cipher:</span>
                <span className="text-brand-300 font-semibold">AES-256-GCM (128-bit tag)</span>
              </div>
              <div className="p-2.5 bg-slate-900 rounded-lg border border-surface-border flex justify-between">
                <span className="text-slate-400">Passphrase KDF:</span>
                <span className="text-brand-300 font-semibold">Argon2id (m=64MB, t=3, p=4)</span>
              </div>
              <div className="p-2.5 bg-slate-900 rounded-lg border border-surface-border flex justify-between">
                <span className="text-slate-400">Key Derivation / Wrap:</span>
                <span className="text-brand-300 font-semibold">HKDF-SHA256 (Context-bound)</span>
              </div>
              <div className="p-2.5 bg-slate-900 rounded-lg border border-surface-border flex justify-between">
                <span className="text-slate-400">Nonce Generation:</span>
                <span className="text-brand-300 font-semibold">96-bit CSPRNG (Web Crypto)</span>
              </div>
              <div className="p-2.5 bg-slate-900 rounded-lg border border-surface-border flex justify-between">
                <span className="text-slate-400">Format Version:</span>
                <span className="text-brand-300 font-semibold">CloudVault Envelope v1</span>
              </div>
            </div>
          </Card>

          {/* Change Vault Passphrase Form */}
          <Card className="p-6 space-y-4">
            <CardHeader className="mb-0">
              <CardTitle className="flex items-center gap-2">
                <RotateCw className="w-4 h-4 text-emerald-400" /> Rotate Vault Passphrase
              </CardTitle>
            </CardHeader>

            {passphraseStatus.success && (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-xs text-emerald-400 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{passphraseStatus.success}</span>
              </div>
            )}

            {passphraseStatus.error && (
              <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-xs text-red-400">
                {passphraseStatus.error}
              </div>
            )}

            <form onSubmit={handleChangePassphrase} className="space-y-3">
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
                className="w-full mt-2"
              >
                Re-encrypt Master Key Envelope
              </Button>
            </form>
          </Card>
        </div>

        {/* Active Sessions Management */}
        <Card className="p-6 space-y-4">
          <CardHeader className="mb-0">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Laptop className="w-4 h-4 text-brand-400" /> Active Local Sessions
              </CardTitle>
              <p className="text-xs text-slate-400 mt-0.5">
                Cryptographically hashed session tokens managed in PostgreSQL
              </p>
            </div>
          </CardHeader>

          <div className="divide-y divide-surface-border/40 text-xs">
            {sessions.map((sess) => (
              <div
                key={sess.id}
                className="py-3 flex items-center justify-between gap-4 font-mono"
              >
                <div className="flex items-center gap-3">
                  <Laptop className="w-4 h-4 text-slate-500 shrink-0" />
                  <div>
                    <div className="flex items-center gap-2 text-slate-200">
                      <span>Session ID: {sess.id.slice(0, 12)}...</span>
                      {sess.isCurrent && <Badge variant="info">CURRENT DEVICE</Badge>}
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
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
                    className="text-slate-400 hover:text-rose-400"
                  >
                    Revoke
                  </Button>
                )}
              </div>
            ))}
          </div>
        </Card>

        {/* Security Audit Events */}
        <Card className="p-6 space-y-4">
          <CardHeader className="mb-0">
            <div>
              <CardTitle className="flex items-center gap-2">
                <History className="w-4 h-4 text-brand-400" /> Safe Audit Trail
              </CardTitle>
              <p className="text-xs text-slate-400 mt-0.5">
                Nonsensitive operational security logs (never contains plaintext keys or passwords)
              </p>
            </div>
          </CardHeader>

          {auditEvents.length === 0 ? (
            <p className="text-xs text-slate-500 py-4 text-center">No audit events recorded yet.</p>
          ) : (
            <div className="divide-y divide-surface-border/40 text-xs font-mono">
              {auditEvents.slice(0, 8).map((evt) => (
                <div key={evt.id} className="py-2.5 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-brand-400" />
                    <span className="text-slate-200 font-semibold">{evt.eventType}</span>
                  </div>
                  <div className="text-[11px] text-slate-500">
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
