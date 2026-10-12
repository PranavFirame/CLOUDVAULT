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
    info: "bg-sky-500/10 text-sky-400 border-sky-500/30 shadow-[0_0_8px_rgba(56,189,248,0.15)]",
    success: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30 shadow-[0_0_8px_rgba(16,185,129,0.15)]",
    warning: "bg-amber-500/10 text-amber-400 border-amber-500/30 shadow-[0_0_8px_rgba(245,158,11,0.15)]",
    danger: "bg-rose-500/10 text-rose-400 border-rose-500/30 shadow-[0_0_8px_rgba(244,63,94,0.15)]",
    neutral: "bg-slate-800/80 text-slate-300 border-slate-700/80",
  };

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-mono font-medium border tracking-wide uppercase ${variantStyles[variant]} ${className}`}
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
    <div className={`w-full bg-slate-950 rounded-full h-1.5 overflow-hidden border border-slate-800/60 ${className}`}>
      <div
        className="bg-gradient-to-r from-sky-500 to-blue-500 h-1.5 rounded-full transition-all duration-300 shadow-[0_0_10px_rgba(56,189,248,0.6)]"
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-150">
      <div className="bg-[#0b111e] border border-slate-700/80 rounded-2xl max-w-lg w-full p-6 shadow-2xl shadow-black/80 relative text-slate-100">
        <div className="flex items-center justify-between pb-3.5 mb-4 border-b border-slate-800">
          <h2 className="text-base font-semibold text-white tracking-tight">{title}</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors leading-none"
            aria-label="Close dialog"
          >
            &times;
          </button>
        </div>
        <div>{children}</div>
      </div>
    </div>
  );
}
