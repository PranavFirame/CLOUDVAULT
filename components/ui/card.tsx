import React from "react";

export function Card({
  children,
  className = "",
  onClick,
}: {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className={`bg-slate-900/60 backdrop-blur-md border border-slate-800/80 hover:border-slate-700/80 rounded-xl p-5 shadow-xl shadow-black/40 transition-all duration-200 ${className}`}
    >
      {children}
    </div>
  );
}

export function CardHeader({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={`mb-4 flex items-center justify-between ${className}`}>{children}</div>;
}

export function CardTitle({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <h3 className={`text-sm font-semibold tracking-tight text-slate-100 ${className}`}>{children}</h3>;
}

export function CardDescription({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <p className={`text-xs text-slate-400 mt-1 leading-relaxed ${className}`}>{children}</p>;
}

