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

export function Progress({
  value,
  max = 100,
  className = "",
}: {
  value: number;
  max?: number;
  className?: string;
}) {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));

  return (
    <div className={`w-full bg-slate-200 dark:bg-zinc-800/80 rounded-full h-1.5 overflow-hidden backdrop-blur-sm ${className}`}>
      <div
        className="bg-[rgb(240_158_79)] h-full rounded-full transition-all duration-300 shadow-[0_0_8px_rgba(240,158,79,0.5)]"
        style={{ width: `${percentage}%` }}
      />
    </div>
  );
}

export function Dialog({
  isOpen,
  onClose,
  title,
  children,
}: {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-surface border border-surface-border rounded-2xl max-w-lg w-full p-6 shadow-2xl relative text-foreground backdrop-blur-2xl">
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-surface-border">
          <h2 className="text-base font-semibold text-foreground flex items-center gap-2">{title}</h2>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg hover:bg-surface-raised text-slate-500 hover:text-foreground flex items-center justify-center text-lg font-mono transition-colors focus:outline-none"
          >
            &times;
          </button>
        </div>
        <div>{children}</div>
      </div>
    </div>
  );
}
