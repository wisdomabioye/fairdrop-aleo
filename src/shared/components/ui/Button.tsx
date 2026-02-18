import { type ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "ghost" | "accent" | "success" | "warning" | "destructive";
type Size = "sm" | "default" | "lg";

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  loadingText?: string;
}

const variantClasses: Record<Variant, string> = {
  primary: "gradient-primary text-white shadow-md-custom hover-glow",
  secondary: "bg-secondary text-foreground border border-border hover:bg-secondary-hover",
  ghost: "text-foreground hover:bg-secondary",
  accent: "gradient-accent text-white shadow-md-custom hover-glow",
  success: "gradient-success text-white shadow-md-custom hover-glow",
  warning: "gradient-warning text-white shadow-md-custom hover-glow",
  destructive: "gradient-accent text-white shadow-md-custom hover-glow",
};

const sizeClasses: Record<Size, string> = {
  sm: "px-3 py-1.5 text-xs",
  default: "px-4 py-2.5 text-sm",
  lg: "px-6 py-3 text-sm",
};

export function Button({
  variant = "primary",
  size = "default",
  loading,
  loadingText = "Processing...",
  children,
  className = "",
  disabled,
  ...props
}: Props) {
  return (
    <button
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-all disabled:cursor-not-allowed disabled:opacity-50 ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      {...props}
    >
      {loading && (
        <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
        </svg>
      )}
      {loading ? loadingText : children}
    </button>
  );
}
