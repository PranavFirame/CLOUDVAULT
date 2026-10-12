"use client";

import React from "react";
import Link from "next/link";
import { Shield, Lock, Unlock, LogOut, KeyRound } from "lucide-react";
import { useVault } from "@/lib/crypto/vault-context";
import { Button } from "@/components/ui/button";

export function Navbar({ userEmail }: { userEmail?: string }) {
  const { status, isUnlocked, lockVault } = useVault();

  const handleLogout = async () => {
    lockVault();
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/login";
  };

  return (
    <header className="h-16 border-b border-slate-800/80 bg-slate-950/70 backdrop-blur-xl sticky top-0 z-40 px-6 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <Link href="/dashboard" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 rounded-xl bg-brand-500/10 border border-brand-500/30 flex items-center justify-center text-brand-400 group-hover:border-brand-400 transition-colors shadow-[0_0_12px_rgba(56,189,248,0.2)]">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <span className="font-bold text-base tracking-tight text-white flex items-center gap-1.5">
              CLOUD<span className="text-brand-400">VAULT</span>
            </span>
          </div>
        </Link>
      </div>

      <div className="flex items-center gap-4">
        {/* Vault Status Indicator */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900 border border-surface-border text-xs">
          {isUnlocked ? (
            <>
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_6px_rgba(52,211,153,0.8)]" />
              <span className="text-emerald-400 font-mono font-medium flex items-center gap-1">
                <Unlock className="w-3.5 h-3.5" /> VAULT UNLOCKED
              </span>
              <button
                onClick={lockVault}
                title="Lock Vault in Memory"
                className="ml-2 text-slate-400 hover:text-white transition-colors underline text-[11px]"
              >
                Lock
              </button>
            </>
          ) : status === "UNINITIALIZED" ? (
            <>
              <div className="w-2 h-2 rounded-full bg-amber-400" />
              <span className="text-amber-400 font-mono font-medium flex items-center gap-1">
                <KeyRound className="w-3.5 h-3.5" /> NOT INITIALIZED
              </span>
            </>
          ) : (
            <>
              <div className="w-2 h-2 rounded-full bg-rose-400" />
              <span className="text-rose-400 font-mono font-medium flex items-center gap-1">
                <Lock className="w-3.5 h-3.5" /> VAULT LOCKED
              </span>
              <Link
                href="/unlock"
                className="ml-2 text-brand-400 hover:text-brand-300 font-medium underline text-[11px]"
              >
                Unlock
              </Link>
            </>
          )}
        </div>

        {userEmail && (
          <div className="hidden sm:flex items-center text-xs text-slate-400 font-mono bg-slate-900/60 px-3 py-1.5 rounded-lg border border-surface-border">
            {userEmail}
          </div>
        )}

        <Button
          variant="ghost"
          size="sm"
          onClick={handleLogout}
          className="text-slate-400 hover:text-rose-400"
          title="Sign Out"
        >
          <LogOut className="w-4 h-4" />
          <span className="hidden md:inline">Sign Out</span>
        </Button>
      </div>
    </header>
  );
}
