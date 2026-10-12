import React from "react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, className = "", id, ...props }, ref) => {
    const inputId = id || props.name;

    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-xs font-medium text-slate-700 dark:text-slate-300"
          >
            {label}
          </label>
        )}
        <input
          id={inputId}
          ref={ref}
          className={`w-full bg-surface border ${
            error
              ? "border-rose-500 focus:ring-rose-500/20"
              : "border-surface-border hover:border-slate-400 dark:hover:border-slate-600 focus:border-brand-500 focus:ring-brand-500/20"
          } text-foreground placeholder-slate-400 text-sm rounded-lg px-3.5 py-2 transition-all duration-150 focus:outline-none focus:ring-2 disabled:opacity-50 ${className}`}
          {...props}
        />
        {error && <p className="text-xs text-rose-500 font-medium">{error}</p>}
        {helperText && !error && (
          <p className="text-xs text-slate-500 dark:text-slate-400">{helperText}</p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";
