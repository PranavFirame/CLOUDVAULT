"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Shield,
  Lock,
  Unlock,
  LogOut,
  Sun,
  Moon,
  Menu,
  User,
  KeyRound,
} from "lucide-react";
import { useVault } from "@/lib/crypto/vault-context";
import { useTheme } from "@/components/theme-provider";

export function Navbar({
  userEmail,
  onToggleSidebar,
}: {
  userEmail?: string;
  onToggleSidebar?: () => void;
}) {
  const { status, isUnlocked, lockVault } = useVault();
  const { resolvedTheme, setTheme } = useTheme();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const handleLogout = async () => {
    lockVault();
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/login";
  };

  return (
    <header className="h-14 border-b border-surface-border bg-surface/85 backdrop-blur-xl sticky top-0 z-40 px-4 md:px-6 flex items-center justify-between transition-colors">
      <div className="flex items-center gap-3">
        {onToggleSidebar && (
          <button
            onClick={onToggleSidebar}
            className="md:hidden p-1.5 rounded-lg text-slate-500 hover:text-foreground hover:bg-surface-raised"
            title="Toggle menu"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}

        <Link href="/dashboard" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-xl bg-brand-500/10 border border-brand-500/30 flex items-center justify-center text-brand-500 group-hover:border-brand-500/60 shadow-[0_0_12px_rgba(229,169,60,0.15)] transition-all">
            <Shield className="w-4 h-4" />
          </div>
          <div>
            <span className="font-bold text-sm tracking-tight text-foreground flex items-center gap-1">
              CLOUD<span className="text-brand-500">VAULT</span>
            </span>
          </div>
        </Link>
      </div>

      <div className="flex items-center gap-3">
        {/* Vault Status Indicator */}
        <div className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-surface-raised/80 backdrop-blur-md border border-surface-border text-xs">
          {isUnlocked ? (
            <>
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.7)]" />
              <span className="text-emerald-500 font-mono font-medium flex items-center gap-1 text-[11px]">
                <Unlock className="w-3 h-3" /> UNLOCKED
              </span>
              <button
                onClick={lockVault}
                title="Lock Vault in Memory"
                className="ml-1 text-slate-400 hover:text-foreground transition-colors underline text-[10px]"
              >
                Lock
              </button>
            </>
          ) : status === "UNINITIALIZED" ? (
            <>
              <div className="w-2 h-2 rounded-full bg-brand-500" />
              <span className="text-brand-500 font-mono font-medium flex items-center gap-1 text-[11px]">
                <KeyRound className="w-3 h-3" /> UNINITIALIZED
              </span>
            </>
          ) : (
            <>
              <div className="w-2 h-2 rounded-full bg-rose-500" />
              <span className="text-rose-500 font-mono font-medium flex items-center gap-1 text-[11px]">
                <Lock className="w-3 h-3" /> LOCKED
              </span>
              <Link
                href="/unlock"
                className="ml-1 text-brand-500 hover:underline font-medium text-[10px]"
              >
                Unlock
              </Link>
            </>
          )}
        </div>

        {/* Theme Toggle Button */}
        <button
          onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
          className="p-1.5 rounded-lg text-slate-500 hover:text-foreground hover:bg-surface-raised transition-colors"
          title="Toggle theme"
        >
          {resolvedTheme === "dark" ? <Sun className="w-4 h-4 text-brand-500" /> : <Moon className="w-4 h-4" />}
        </button>

        {/* User Account Dropdown */}
        <div className="relative">
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2 p-1 pl-2 rounded-full hover:bg-surface-raised transition-colors border border-transparent hover:border-surface-border"
          >
            <div className="w-7 h-7 rounded-full bg-brand-500/10 border border-brand-500/30 text-brand-500 flex items-center justify-center font-semibold text-xs uppercase shadow-sm">
              {userEmail ? userEmail.charAt(0) : "U"}
            </div>
            {userEmail && (
              <span className="hidden sm:inline text-xs font-medium text-slate-700 dark:text-slate-300 max-w-[140px] truncate">
                {userEmail}
              </span>
            )}
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-surface border border-surface-border rounded-2xl shadow-2xl py-1 z-50 text-xs backdrop-blur-xl">
              <div className="px-3 py-2 border-b border-surface-border font-medium text-slate-500 truncate">
                {userEmail}
              </div>
              <Link
                href="/dashboard/settings"
                onClick={() => setDropdownOpen(false)}
                className="flex items-center gap-2 px-3 py-2 hover:bg-surface-raised text-slate-700 dark:text-slate-300"
              >
                <User className="w-3.5 h-3.5 text-brand-500" /> Account Settings
              </Link>
              <button
                onClick={() => {
                  setDropdownOpen(false);
                  handleLogout();
                }}
                className="w-full flex items-center gap-2 px-3 py-2 hover:bg-surface-raised text-rose-500 text-left"
              >
                <LogOut className="w-3.5 h-3.5" /> Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
