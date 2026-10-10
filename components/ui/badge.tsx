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
    info: "bg-brand-500/10 text-brand-400 border-brand-500/30",
    success: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
    warning: "bg-amber-500/10 text-amber-400 border-amber-500/30",
    danger: "bg-rose-500/10 text-rose-400 border-rose-500/30",
    neutral: "bg-slate-800 text-slate-300 border-slate-700",
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
    <div className={`w-full bg-slate-800 rounded-full h-2 overflow-hidden ${className}`}>
      <div
        className="bg-brand-500 h-2 rounded-full transition-all duration-300 shadow-[0_0_8px_rgba(14,165,233,0.5)]"
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-surface border border-surface-border rounded-xl max-w-lg w-full p-6 shadow-2xl relative">
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-surface-border">
          <h2 className="text-lg font-semibold text-slate-100">{title}</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 text-xl font-mono leading-none focus:outline-none"
          >
            &times;
          </button>
        </div>
        <div>{children}</div>
      </div>
    </div>
  );
}
