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
    info: "bg-brand-500/10 text-brand-600 dark:text-brand-400 border-brand-500/20",
    success: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
    warning: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
    danger: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20",
    neutral: "bg-surface-raised text-slate-600 dark:text-slate-400 border-surface-border",
  };

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${variantStyles[variant]} ${className}`}
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
    <div className={`w-full bg-slate-200 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden ${className}`}>
      <div
        className="bg-brand-500 h-full rounded-full transition-all duration-300"
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-surface border border-surface-border rounded-xl max-w-lg w-full p-6 shadow-2xl relative text-foreground">
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
