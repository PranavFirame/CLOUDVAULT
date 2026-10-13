import React from "react";

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
