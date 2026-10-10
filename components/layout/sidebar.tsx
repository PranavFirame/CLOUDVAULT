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
} from "lucide-react";
import { Progress } from "@/components/ui/progress";

export function Sidebar() {
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
      name: "Dashboard",
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
      name: "Settings",
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
    <aside className="w-64 border-r border-surface-border/60 bg-surface/50 flex flex-col justify-between p-4 shrink-0">
      <div className="space-y-1">
        <div className="px-3 py-2 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
          Storage
        </div>
        {navItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/dashboard" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? "bg-brand-500/10 text-brand-400 border border-brand-500/20 shadow-sm"
                  : "text-slate-400 hover:text-slate-100 hover:bg-slate-800/50"
              }`}
            >
              <item.icon className="w-4 h-4" />
              {item.name}
            </Link>
          );
        })}
      </div>

      {/* Storage Quota Card */}
      <div className="p-4 rounded-xl bg-slate-900/80 border border-surface-border space-y-3">
        <div className="flex items-center justify-between text-xs font-medium text-slate-300">
          <span className="flex items-center gap-1.5">
            <HardDrive className="w-3.5 h-3.5 text-brand-400" /> Storage
          </span>
          <span className="text-slate-400 font-mono text-[11px]">
            {storageData.percentageUsed}%
          </span>
        </div>
        <Progress value={storageData.percentageUsed} max={100} />
        <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
          <span>{formatSize(storageData.usedBytes)}</span>
          <span className="text-slate-500">of {formatSize(storageData.quotaBytes)}</span>
        </div>
      </div>
    </aside>
  );
}
