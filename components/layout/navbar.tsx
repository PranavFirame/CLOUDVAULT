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
  X,
  User,
  KeyRound,
} from "lucide-react";
import { useVault } from "@/lib/crypto/vault-context";
import { useTheme } from "@/components/theme-provider";
import { Button } from "@/components/ui/button";

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
    <header className="h-14 border-b border-surface-border bg-surface sticky top-0 z-40 px-4 md:px-6 flex items-center justify-between transition-colors">
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
          <div className="w-8 h-8 rounded-lg bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-brand-500 group-hover:border-brand-500/40 transition-colors">
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
        <div className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-surface-raised border border-surface-border text-xs">
          {isUnlocked ? (
            <>
              <div className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="text-emerald-600 dark:text-emerald-400 font-mono font-medium flex items-center gap-1 text-[11px]">
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
              <div className="w-2 h-2 rounded-full bg-amber-500" />
              <span className="text-amber-600 dark:text-amber-400 font-mono font-medium flex items-center gap-1 text-[11px]">
                <KeyRound className="w-3 h-3" /> UNINITIALIZED
              </span>
            </>
          ) : (
            <>
              <div className="w-2 h-2 rounded-full bg-rose-500" />
              <span className="text-rose-600 dark:text-rose-400 font-mono font-medium flex items-center gap-1 text-[11px]">
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
          {resolvedTheme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>

        {/* User Account Dropdown */}
        <div className="relative">
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2 p-1 pl-2 rounded-lg hover:bg-surface-raised transition-colors border border-transparent hover:border-surface-border"
          >
            <div className="w-7 h-7 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-500 flex items-center justify-center font-semibold text-xs uppercase">
              {userEmail ? userEmail.charAt(0) : "U"}
            </div>
            {userEmail && (
              <span className="hidden sm:inline text-xs font-medium text-slate-700 dark:text-slate-300 max-w-[140px] truncate">
                {userEmail}
              </span>
            )}
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-surface border border-surface-border rounded-xl shadow-xl py-1 z-50 text-xs">
              <div className="px-3 py-2 border-b border-surface-border font-medium text-slate-500 truncate">
                {userEmail}
              </div>
              <Link
                href="/dashboard/settings"
                onClick={() => setDropdownOpen(false)}
                className="flex items-center gap-2 px-3 py-2 hover:bg-surface-raised text-slate-700 dark:text-slate-300"
              >
                <User className="w-3.5 h-3.5" /> Account Settings
              </Link>
              <button
                onClick={() => {
                  setDropdownOpen(false);
                  handleLogout();
                }}
                className="w-full flex items-center gap-2 px-3 py-2 hover:bg-surface-raised text-rose-600 dark:text-rose-400 text-left"
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
