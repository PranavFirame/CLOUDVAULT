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
          className={`w-full bg-slate-950/80 border ${
            error
              ? "border-rose-500/80 focus:border-rose-500 focus:ring-rose-500/20"
              : "border-slate-800 focus:border-sky-500 focus:ring-sky-500/20 hover:border-slate-700"
          } text-slate-100 placeholder-slate-500 text-xs sm:text-sm rounded-lg px-3.5 py-2.5 transition-all duration-150 focus:outline-none focus:ring-2 disabled:opacity-50 disabled:bg-slate-900/50 ${className}`}
          {...props}
        />
        {error && <p className="text-xs text-rose-400 font-medium">{error}</p>}
        {helperText && !error && (
          <p className="text-[11px] text-slate-400">{helperText}</p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";
