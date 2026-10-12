"use client";

import React, { useState, useEffect } from "react";
import {
  User,
  KeyRound,
  HardDrive,
  Database,
  Archive,
  CheckCircle2,
  AlertCircle,
  LogOut,
  FolderLock,
} from "lucide-react";
import { Card, CardTitle, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useVault } from "@/lib/crypto/vault-context";

export default function SettingsPage() {
  const { lockVault } = useVault();
  const [userInfo, setUserInfo] = useState<{ id: string; email: string } | null>(null);

  // Password state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pwdStatus, setPwdStatus] = useState<{
    success?: string;
    error?: string;
    loading?: boolean;
  }>({});

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((data) => {
        if (data?.authenticated) setUserInfo(data.user);
      })
      .catch(() => {});
  }, []);

  const handleChangeAccountPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwdStatus({ loading: true });

    if (newPassword.length < 10) {
      setPwdStatus({ error: "New password must be at least 10 characters." });
      return;
    }

    if (newPassword !== confirmPassword) {
      setPwdStatus({ error: "New passwords do not match." });
      return;
    }

    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to update password");
      }

      setPwdStatus({ success: "Account password updated successfully!" });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: unknown) {
      setPwdStatus({
        error: err instanceof Error ? err.message : "Password update failed",
      });
    }
  };

  const handleLogout = async () => {
    lockVault();
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/login";
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="pb-2 border-b border-slate-800/60">
        <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
          Settings & Local Recovery
        </h1>
        <p className="text-xs text-slate-400 mt-0.5">
          Account credentials, local storage path, and disaster recovery procedures
        </p>
      </div>

      {/* Account Profile Card */}
      <Card className="p-6 space-y-4 bg-slate-900/60 border-slate-800">
        <CardHeader className="mb-0">
          <CardTitle className="flex items-center gap-2">
            <User className="w-4 h-4 text-sky-400" /> Account Identity
          </CardTitle>
        </CardHeader>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
          <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800">
            <span className="text-slate-500 block text-[10px] uppercase tracking-wider font-semibold">Email Address</span>
            <span className="text-slate-200 font-semibold">{userInfo?.email || "Loading..."}</span>
          </div>
          <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800">
            <span className="text-slate-500 block text-[10px] uppercase tracking-wider font-semibold">User Identifier</span>
            <span className="text-slate-300 break-all">{userInfo?.id || "Loading..."}</span>
          </div>
        </div>
      </Card>

      {/* Account Password Change Card */}
      <Card className="p-6 space-y-4 bg-slate-900/60 border-slate-800">
        <CardHeader className="mb-0">
          <div>
            <CardTitle className="flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-sky-400" /> Change Account Password
            </CardTitle>
            <p className="text-xs text-slate-400 mt-0.5">
              Updates your server login authentication password (does not affect vault passphrase)
            </p>
          </div>
        </CardHeader>

        {pwdStatus.success && (
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-xs text-emerald-400 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{pwdStatus.success}</span>
          </div>
        )}

        {pwdStatus.error && (
          <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-400 font-medium flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{pwdStatus.error}</span>
          </div>
        )}

        <form onSubmit={handleChangeAccountPassword} className="space-y-3 max-w-md">
          <Input
            label="Current Password"
            type="password"
            required
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
          />
          <Input
            label="New Password"
            type="password"
            required
            placeholder="Min. 10 characters"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
          <Input
            label="Confirm New Password"
            type="password"
            required
            placeholder="Repeat new password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
          <Button
            type="submit"
            variant="primary"
            size="sm"
            isLoading={pwdStatus.loading}
            className="mt-2"
          >
            Update Account Password
          </Button>
        </form>
      </Card>

      {/* Local Storage Information & Backup Guide */}
      <Card className="p-6 space-y-5 bg-slate-900/60 border-slate-800">
        <CardHeader className="mb-0">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Archive className="w-4 h-4 text-sky-400" /> Local Storage & Backup Procedures
            </CardTitle>
            <p className="text-xs text-slate-400 mt-0.5">
              Zero-knowledge disaster recovery checklist
            </p>
          </div>
        </CardHeader>

        <div className="space-y-3 text-xs">
          <div className="p-3.5 bg-slate-950/80 border border-slate-800 rounded-xl space-y-2">
            <div className="flex items-center gap-2 font-semibold text-slate-200">
              <HardDrive className="w-4 h-4 text-sky-400" /> Encrypted Objects Filesystem Path
            </div>
            <p className="text-slate-400">
              All uploaded files are stored strictly as encrypted ciphertext under opaque identifiers in:
            </p>
            <code className="block p-2 bg-slate-900 rounded-lg text-sky-300 font-mono text-[11px] border border-slate-800">
              d:/antigravity/CLOUDVAULT/data/objects/
            </code>
          </div>

          <div className="p-3.5 bg-slate-950/80 border border-slate-800 rounded-xl space-y-2">
            <div className="flex items-center gap-2 font-semibold text-slate-200">
              <Database className="w-4 h-4 text-emerald-400" /> Complete Backup Instructions
            </div>
            <p className="text-slate-400 leading-relaxed">
              To create a fully restorable backup, you must archive <strong>both</strong> the PostgreSQL database and the ciphertext directory. Backing up only one component is insufficient.
            </p>
            <div className="p-2.5 bg-slate-900 rounded-lg font-mono text-[11px] text-slate-300 space-y-1 border border-slate-800">
              <div className="text-slate-400"># 1. Dump PostgreSQL schema and encrypted envelopes:</div>
              <div className="text-sky-400">docker exec -t cloudvault-postgres pg_dump -U cloudvault cloudvault &gt; backup_$(date +%Y%m%d).sql</div>
              <div className="text-slate-400 pt-1"># 2. Archive local ciphertext files:</div>
              <div className="text-sky-400">tar -czvf cloudvault_objects_$(date +%Y%m%d).tar.gz ./data/objects/</div>
            </div>
          </div>

          <div className="p-3.5 bg-amber-500/10 border border-amber-500/20 rounded-xl space-y-1.5 text-amber-300">
            <div className="font-semibold flex items-center gap-1.5">
              <FolderLock className="w-4 h-4 text-amber-400" /> Recovery Secret Stored Separately
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Your emergency recovery secret must never be stored on the same disk or inside the backup archive. Store it offline on an external physical key or printed security sheet.
            </p>
          </div>
        </div>
      </Card>

      {/* Logout */}
      <div className="pt-2 flex justify-end">
        <Button variant="danger" size="md" onClick={handleLogout}>
          <LogOut className="w-4 h-4 mr-2" /> Sign Out & Scrub Memory
        </Button>
      </div>
    </div>
  );
}
