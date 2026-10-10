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
            className="block text-xs font-medium text-slate-300"
          >
            {label}
          </label>
        )}
        <input
          id={inputId}
          ref={ref}
          className={`w-full bg-slate-900/90 border ${
            error ? "border-red-500 focus:ring-red-500" : "border-surface-border focus:border-brand-500 focus:ring-brand-500/20"
          } text-slate-100 placeholder-slate-500 text-sm rounded-lg px-3.5 py-2 transition-all focus:outline-none focus:ring-2 disabled:opacity-50 ${className}`}
          {...props}
        />
        {error && <p className="text-xs text-red-400 font-medium">{error}</p>}
        {helperText && !error && (
          <p className="text-xs text-slate-500">{helperText}</p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";
