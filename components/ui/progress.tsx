import React from "react";

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
