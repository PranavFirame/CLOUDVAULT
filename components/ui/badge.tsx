import React from "react";

export function Badge({
  children,
  variant = "info",
  className = "",
}: {
  children: React.ReactNode;
  variant?: "info" | "success" | "warning" | "danger" | "neutral";
  className?: string;
}) {
  const variantStyles = {
    info: "bg-[rgba(240,158,79,0.15)] text-[rgb(240_158_79)] border-[rgba(240,158,79,0.3)]",
    success: "bg-[rgba(100,215,113,0.15)] text-[rgb(100_215_113)] border-[rgba(100,215,113,0.3)]",
    warning: "bg-amber-500/15 text-amber-500 border-amber-500/30",
    danger: "bg-rose-500/15 text-rose-500 border-rose-500/30",
    neutral: "bg-surface-raised text-slate-600 dark:text-slate-400 border-surface-border",
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border backdrop-blur-md ${variantStyles[variant]} ${className}`}
    >
      {children}
    </span>
  );
}
