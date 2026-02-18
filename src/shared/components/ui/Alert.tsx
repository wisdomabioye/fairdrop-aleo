import type { ReactNode } from "react";

type Variant = "success" | "warning" | "error" | "info";

interface Props {
  variant: Variant;
  title?: string;
  children?: ReactNode;
  className?: string;
}

const variantClasses: Record<Variant, string> = {
  success: "bg-success-light text-success",
  warning: "bg-warning-light text-warning",
  error: "bg-destructive-light text-destructive",
  info: "bg-info-light text-info",
};

export function Alert({ variant, title, children, className = "" }: Props) {
  return (
    <div className={`rounded-xl p-4 animate-scale-in ${variantClasses[variant]} ${className}`}>
      {title && <p className="text-sm font-semibold">{title}</p>}
      {children && <div className="mt-1 text-xs text-muted-foreground">{children}</div>}
    </div>
  );
}
