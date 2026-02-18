import type { ReactNode } from "react";

type Variant = "default" | "glass" | "gradient";
type Padding = "sm" | "default" | "lg";

interface Props {
  variant?: Variant;
  padding?: Padding;
  className?: string;
  children: ReactNode;
}

const variantClasses: Record<Variant, string> = {
  default: "border border-border bg-card shadow-md-custom",
  glass: "glass",
  gradient: "border-gradient-primary",
};

const paddingClasses: Record<Padding, string> = {
  sm: "p-5",
  default: "p-6",
  lg: "p-8",
};

export function Card({ variant = "default", padding = "default", className = "", children }: Props) {
  return (
    <div className={`rounded-2xl ${variantClasses[variant]} ${paddingClasses[padding]} ${className}`}>
      {children}
    </div>
  );
}
