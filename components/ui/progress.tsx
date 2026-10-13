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
    <div className={`w-full bg-slate-200 dark:bg-zinc-800/80 rounded-full h-1.5 overflow-hidden backdrop-blur-sm ${className}`}>
      <div
        className="bg-[rgb(240_158_79)] h-full rounded-full transition-all duration-300 shadow-[0_0_8px_rgba(240,158,79,0.5)]"
        style={{ width: `${percentage}%` }}
      />
    </div>
  );
}
