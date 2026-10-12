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
    <aside className="w-64 border-r border-slate-800/80 bg-[#080c14]/90 backdrop-blur-md flex flex-col justify-between p-4 shrink-0">
      <div className="space-y-1">
        <div className="px-3 py-2 text-[10px] font-mono font-semibold text-slate-500 uppercase tracking-widest">
          Platform Workspace
        </div>
        {navItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/dashboard" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150 ${
                isActive
                  ? "bg-gradient-to-r from-sky-500/15 to-blue-500/5 text-sky-400 border border-sky-500/30 shadow-[0_0_12px_rgba(56,189,248,0.12)]"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/60 border border-transparent"
              }`}
            >
              <item.icon className={`w-4 h-4 ${isActive ? "text-sky-400" : "text-slate-400"}`} />
              {item.name}
            </Link>
          );
        })}
      </div>

      {/* Storage Quota Card */}
      <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800/90 space-y-3 shadow-lg">
        <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
          <span className="flex items-center gap-2">
            <HardDrive className="w-3.5 h-3.5 text-sky-400" /> Local Storage
          </span>
          <span className="text-sky-400 font-mono text-[11px] font-bold">
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
