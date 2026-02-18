import { type InputHTMLAttributes } from "react";

interface Props extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hint?: string;
  error?: string;
}

export function Input({ label, hint, error, className = "", ...props }: Props) {
  return (
    <div>
      {label && (
        <label className="mb-1 block text-sm font-medium text-foreground">{label}</label>
      )}
      <input
        className={`w-full rounded-xl border bg-input px-4 py-3 text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-1 focus:ring-primary ${
          error ? "border-destructive" : "border-border"
        } ${className}`}
        {...props}
      />
      {hint && !error && (
        <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
      )}
      {error && (
        <p className="mt-1 text-xs text-destructive">{error}</p>
      )}
    </div>
  );
}
