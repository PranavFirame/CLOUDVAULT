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
  Sun,
  Moon,
  Laptop,
} from "lucide-react";
import { Card, CardTitle, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useVault } from "@/lib/crypto/vault-context";
import { useTheme } from "@/components/theme-provider";

export default function SettingsPage() {
  const { lockVault } = useVault();
  const { theme, setTheme } = useTheme();
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
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl md:text-2xl font-bold tracking-tight text-foreground">
          Settings & Preferences
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Account credentials, appearance preferences, and local storage backup procedures
        </p>
      </div>

      {/* Account Profile Card */}
      <Card className="p-5 space-y-3">
        <CardHeader className="mb-0">
          <CardTitle className="flex items-center gap-1.5">
            <User className="w-4 h-4 text-brand-500" /> Account Profile
          </CardTitle>
        </CardHeader>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
          <div className="p-3 bg-surface-raised rounded-lg border border-surface-border">
            <span className="text-slate-400 block text-[11px]">Email Address</span>
            <span className="text-foreground font-semibold">{userInfo?.email || "Loading..."}</span>
          </div>
          <div className="p-3 bg-surface-raised rounded-lg border border-surface-border">
            <span className="text-slate-400 block text-[11px]">User Identifier</span>
            <span className="text-foreground">{userInfo?.id || "Loading..."}</span>
          </div>
        </div>
      </Card>

      {/* Appearance & Theme Card */}
      <Card className="p-5 space-y-3">
        <CardHeader className="mb-0">
          <div>
            <CardTitle className="flex items-center gap-1.5">
              <Sun className="w-4 h-4 text-amber-500" /> Appearance & Theme
            </CardTitle>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Customize the user interface for light, dark, or system matching
            </p>
          </div>
        </CardHeader>

        <div className="grid grid-cols-3 gap-3">
          <button
            onClick={() => setTheme("light")}
            className={`p-3 rounded-lg border text-xs font-medium flex items-center justify-center gap-2 transition-all ${
              theme === "light"
                ? "border-brand-500 bg-brand-500/10 text-brand-600 font-semibold"
                : "border-surface-border bg-surface hover:bg-surface-raised text-slate-600 dark:text-slate-300"
            }`}
          >
            <Sun className="w-4 h-4" /> Light
          </button>
          <button
            onClick={() => setTheme("dark")}
            className={`p-3 rounded-lg border text-xs font-medium flex items-center justify-center gap-2 transition-all ${
              theme === "dark"
                ? "border-brand-500 bg-brand-500/10 text-brand-400 font-semibold"
                : "border-surface-border bg-surface hover:bg-surface-raised text-slate-600 dark:text-slate-300"
            }`}
          >
            <Moon className="w-4 h-4" /> Dark
          </button>
          <button
            onClick={() => setTheme("system")}
            className={`p-3 rounded-lg border text-xs font-medium flex items-center justify-center gap-2 transition-all ${
              theme === "system"
                ? "border-brand-500 bg-brand-500/10 text-brand-500 font-semibold"
                : "border-surface-border bg-surface hover:bg-surface-raised text-slate-600 dark:text-slate-300"
            }`}
          >
            <Laptop className="w-4 h-4" /> System
          </button>
        </div>
      </Card>

      {/* Account Password Change Card */}
      <Card className="p-5 space-y-3">
        <CardHeader className="mb-0">
          <div>
            <CardTitle className="flex items-center gap-1.5">
              <KeyRound className="w-4 h-4 text-brand-500" /> Change Account Password
            </CardTitle>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Updates your server login authentication password (does not modify your vault encryption keys)
            </p>
          </div>
        </CardHeader>

        {pwdStatus.success && (
          <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{pwdStatus.success}</span>
          </div>
        )}

        {pwdStatus.error && (
          <div className="p-2.5 bg-rose-500/10 border border-rose-500/20 rounded-lg text-xs text-rose-600 dark:text-rose-400 flex items-center gap-2">
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
            className="mt-1"
          >
            Update Account Password
          </Button>
        </form>
      </Card>

      {/* Local Storage Information & Backup Guide */}
      <Card className="p-5 space-y-4">
        <CardHeader className="mb-0">
          <div>
            <CardTitle className="flex items-center gap-1.5">
              <Archive className="w-4 h-4 text-brand-500" /> Local Storage & Disaster Recovery
            </CardTitle>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Zero-knowledge local backup procedure
            </p>
          </div>
        </CardHeader>

        <div className="space-y-3 text-xs">
          <div className="p-3 bg-surface-raised border border-surface-border rounded-lg space-y-1.5">
            <div className="flex items-center gap-2 font-semibold text-foreground">
              <HardDrive className="w-4 h-4 text-brand-500" /> Ciphertext Storage Directory
            </div>
            <p className="text-slate-600 dark:text-slate-400">
              All uploaded files are saved strictly as opaque ciphertext binary objects at:
            </p>
            <code className="block p-2 bg-surface rounded text-brand-600 dark:text-brand-400 font-mono text-[11px] border border-surface-border">
              ./data/objects/
            </code>
          </div>

          <div className="p-3 bg-surface-raised border border-surface-border rounded-lg space-y-2">
            <div className="flex items-center gap-2 font-semibold text-foreground">
              <Database className="w-4 h-4 text-emerald-500" /> Complete Backup Commands
            </div>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
              To create an archival backup, export both the PostgreSQL schema and the ciphertext objects directory:
            </p>
            <div className="p-2.5 bg-surface rounded font-mono text-[11px] text-slate-600 dark:text-slate-300 space-y-1 border border-surface-border">
              <div># 1. Dump database schema and encrypted envelopes:</div>
              <div className="text-brand-500">docker exec -t cloudvault-postgres pg_dump -U cloudvault cloudvault &gt; backup.sql</div>
              <div className="pt-1"># 2. Archive local ciphertext files:</div>
              <div className="text-brand-500">tar -czvf cloudvault_objects.tar.gz ./data/objects/</div>
            </div>
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
