"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import {
  LayoutDashboard,
  FolderLock,
  Clock,
  Star,
  ShieldCheck,
  Settings,
  HardDrive,
  Shield,
  Lock,
  ArrowUpRight,
} from "lucide-react";
import { Progress } from "../../components/ui/progress";

export function Sidebar({
  isOpen,
  onClose,
}: {
  isOpen?: boolean;
  onClose?: () => void;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentTab = searchParams.get("tab");

  const [storageData, setStorageData] = useState<{
    usedBytes: number;
    quotaBytes: number;
    percentageUsed: number;
  }>({
    usedBytes: 0,
    quotaBytes: 5368709120,
    percentageUsed: 0,
  });

  useEffect(() => {
    fetch("/api/storage/usage")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) setStorageData(data);
      })
      .catch(() => {});
  }, [pathname]);

  const navItems = [
    {
      name: "Overview",
      href: "/dashboard",
      icon: LayoutDashboard,
      isActive: pathname === "/dashboard" && !currentTab,
    },
    {
      name: "My Files",
      href: "/dashboard/files",
      icon: FolderLock,
      isActive: pathname === "/dashboard/files" && !currentTab,
    },
    {
      name: "Recent Files",
      href: "/dashboard/files?tab=recent",
      icon: Clock,
      isActive: pathname === "/dashboard/files" && currentTab === "recent",
    },
    {
      name: "Favorites",
      href: "/dashboard/files?tab=favorites",
      icon: Star,
      isActive: pathname === "/dashboard/files" && currentTab === "favorites",
    },
  ];

  const adminNavItems = [
    {
      name: "Security Center",
      href: "/dashboard/security",
      icon: ShieldCheck,
      isActive: pathname.startsWith("/dashboard/security"),
    },
    {
      name: "Settings & Backup",
      href: "/dashboard/settings",
      icon: Settings,
      isActive: pathname.startsWith("/dashboard/settings"),
    },
  ];

  const formatSize = (bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden animate-in fade-in duration-200"
        />
      )}

      <aside
        className={`fixed md:static inset-y-0 left-0 z-50 w-64 border-r border-surface-border bg-surface/85 backdrop-blur-xl flex flex-col justify-between p-4 shrink-0 transform transition-transform duration-200 ease-in-out md:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="space-y-6">
          {/* Workspace Branding Header */}
          <div className="flex items-center gap-2.5 px-2">
            <div className="w-8 h-8 rounded-xl bg-[rgba(240,158,79,0.12)] border border-[rgba(240,158,79,0.35)] flex items-center justify-center text-[rgb(240_158_79)] shadow-[0_0_12px_rgba(240,158,79,0.15)] shrink-0">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <div className="font-bold text-sm tracking-tight text-foreground flex items-center gap-1">
                CLOUD<span className="text-[rgb(240_158_79)]">VAULT</span>
              </div>
              <div className="text-[10px] text-slate-500 font-mono tracking-tight">
                Zero-Knowledge Workspace
              </div>
            </div>
          </div>

          {/* Main Navigation */}
          <div className="space-y-1">
            <div className="px-3 pb-1 text-[10px] font-mono font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              Storage
            </div>
            <nav className="space-y-1">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onClose}
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                    item.isActive
                      ? "bg-[rgba(240,158,79,0.15)] text-[rgb(240_158_79)] font-semibold border border-[rgba(240,158,79,0.35)] shadow-sm"
                      : "text-slate-600 dark:text-slate-400 hover:text-foreground hover:bg-surface-raised"
                  }`}
                >
                  <item.icon className="w-4 h-4 shrink-0" />
                  <span>{item.name}</span>
                </Link>
              ))}
            </nav>
          </div>

          {/* Security & System Navigation */}
          <div className="space-y-1">
            <div className="px-3 pb-1 text-[10px] font-mono font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              Security & Vault
            </div>
            <nav className="space-y-1">
              {adminNavItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onClose}
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                    item.isActive
                      ? "bg-[rgba(240,158,79,0.15)] text-[rgb(240_158_79)] font-semibold border border-[rgba(240,158,79,0.35)] shadow-sm"
                      : "text-slate-600 dark:text-slate-400 hover:text-foreground hover:bg-surface-raised"
                  }`}
                >
                  <item.icon className="w-4 h-4 shrink-0" />
                  <span>{item.name}</span>
                </Link>
              ))}
            </nav>
          </div>
        </div>

        {/* Bottom Section: Storage Quota Card & Zero-Knowledge Badge */}
        <div className="space-y-3 pt-4 border-t border-surface-border">
          <div className="p-3.5 rounded-2xl bg-surface-raised/90 backdrop-blur-md border border-surface-border space-y-2.5 shadow-sm">
            <div className="flex items-center justify-between text-xs font-medium text-foreground">
              <span className="flex items-center gap-1.5 text-xs font-semibold">
                <HardDrive className="w-3.5 h-3.5 text-[rgb(240_158_79)]" /> Storage
              </span>
              <span className="text-[rgb(240_158_79)] font-mono text-[11px] font-semibold">
                {storageData.percentageUsed}%
              </span>
            </div>
            <Progress value={storageData.percentageUsed} max={100} />
            <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono">
              <span>{formatSize(storageData.usedBytes)}</span>
              <span>of {formatSize(storageData.quotaBytes)}</span>
            </div>
            <Link
              href="/dashboard/files"
              className="text-[10px] font-medium text-[rgb(240_158_79)] hover:underline flex items-center justify-between pt-1 border-t border-surface-border/50"
            >
              <span>Manage storage</span>
              <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="px-1 flex items-center justify-between text-[10px] text-slate-400 dark:text-slate-500 font-mono">
            <span className="flex items-center gap-1 text-[rgb(100_215_113)]">
              <Lock className="w-2.5 h-2.5" /> AES-256-GCM
            </span>
            <span>Zero-Knowledge</span>
          </div>
        </div>
      </aside>
    </>
  );
}
