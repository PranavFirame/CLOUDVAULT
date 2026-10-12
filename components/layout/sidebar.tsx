"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FolderLock,
  ShieldCheck,
  Settings,
  HardDrive,
  Star,
  Trash2,
  Share2,
} from "lucide-react";
import { Progress } from "@/components/ui/progress";

export function Sidebar({
  isOpen,
  onClose,
}: {
  isOpen?: boolean;
  onClose?: () => void;
}) {
  const pathname = usePathname();
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
    },
    {
      name: "My Files",
      href: "/dashboard/files",
      icon: FolderLock,
    },
    {
      name: "Security Center",
      href: "/dashboard/security",
      icon: ShieldCheck,
    },
    {
      name: "Settings & Backup",
      href: "/dashboard/settings",
      icon: Settings,
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
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm md:hidden"
        />
      )}

      <aside
        className={`fixed md:static inset-y-0 left-0 z-50 w-60 border-r border-surface-border bg-surface flex flex-col justify-between p-3 shrink-0 transform transition-transform duration-200 ease-in-out md:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="space-y-4">
          <div className="px-3 pt-2 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Workspace
          </div>

          <nav className="space-y-1">
            {navItems.map((item) => {
              const isActive =
                pathname === item.href ||
                (item.href !== "/dashboard" && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onClose}
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                    isActive
                      ? "bg-brand-500/10 text-brand-600 dark:text-brand-400 font-semibold"
                      : "text-slate-600 dark:text-slate-400 hover:text-foreground hover:bg-surface-raised"
                  }`}
                >
                  <item.icon className="w-4 h-4" />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Storage Quota Card */}
        <div className="p-3.5 rounded-xl bg-surface-raised border border-surface-border space-y-2.5">
          <div className="flex items-center justify-between text-xs font-medium text-foreground">
            <span className="flex items-center gap-1.5 text-xs font-semibold">
              <HardDrive className="w-3.5 h-3.5 text-brand-500" /> Storage
            </span>
            <span className="text-slate-500 font-mono text-[11px]">
              {storageData.percentageUsed}%
            </span>
          </div>
          <Progress value={storageData.percentageUsed} max={100} />
          <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono">
            <span>{formatSize(storageData.usedBytes)}</span>
            <span>of {formatSize(storageData.quotaBytes)}</span>
          </div>
        </div>
      </aside>
    </>
  );
}
