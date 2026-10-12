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
    <header className="h-16 border-b border-slate-800/80 bg-[#080c14]/80 backdrop-blur-xl sticky top-0 z-40 px-6 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <Link href="/dashboard" className="flex items-center gap-3 group">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-sky-500/20 to-blue-600/10 border border-sky-400/40 flex items-center justify-center text-sky-400 group-hover:border-sky-400 group-hover:shadow-[0_0_15px_rgba(56,189,248,0.35)] transition-all duration-200">
            <Shield className="w-5 h-5 text-sky-400 group-hover:scale-105 transition-transform" />
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-sm tracking-tight text-white flex items-center gap-1">
              CLOUD<span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-blue-400">VAULT</span>
            </span>
            <span className="text-[10px] text-slate-400 font-mono tracking-wider -mt-0.5">
              ZERO-KNOWLEDGE
            </span>
          </div>
        </Link>
      </div>

      <div className="flex items-center gap-3 sm:gap-4">
        {/* Vault Status Indicator Pill */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900/90 border border-slate-800 text-xs">
          {isUnlocked ? (
            <>
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]"></span>
              </span>
              <span className="text-emerald-400 font-mono font-medium text-[11px] flex items-center gap-1.5">
                <Unlock className="w-3 h-3" /> VAULT UNLOCKED
              </span>
              <button
                onClick={lockVault}
                title="Immediately clear cryptographic keys from browser memory"
                className="ml-2 px-1.5 py-0.5 rounded text-[10px] font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                Lock
              </button>
            </>
          ) : status === "UNINITIALIZED" ? (
            <>
              <div className="w-2 h-2 rounded-full bg-amber-400" />
              <span className="text-amber-400 font-mono font-medium text-[11px] flex items-center gap-1.5">
                <KeyRound className="w-3 h-3" /> UNINITIALIZED
              </span>
            </>
          ) : (
            <>
              <div className="w-2 h-2 rounded-full bg-rose-500 shadow-[0_0_6px_rgba(244,63,94,0.6)]" />
              <span className="text-rose-400 font-mono font-medium text-[11px] flex items-center gap-1.5">
                <Lock className="w-3 h-3" /> VAULT LOCKED
              </span>
              <Link
                href="/unlock"
                className="ml-2 px-1.5 py-0.5 rounded bg-sky-500/10 text-sky-400 hover:text-sky-300 hover:bg-sky-500/20 text-[10px] font-semibold transition-colors"
              >
                Unlock
              </Link>
            </>
          )}
        </div>

        {userEmail && (
          <div className="hidden md:flex items-center text-xs text-slate-300 font-mono bg-slate-900/60 px-3 py-1.5 rounded-lg border border-slate-800">
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
          <LogOut className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Sign Out</span>
        </Button>
      </div>
    </header>
  );
}
