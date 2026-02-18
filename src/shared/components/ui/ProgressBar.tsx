type Variant = "primary" | "success" | "warning" | "accent";

interface Props {
  value: number;
  variant?: Variant;
  label?: string;
  detail?: string;
  className?: string;
}

const fillClasses: Record<Variant, string> = {
  primary: "gradient-primary",
  success: "gradient-success",
  warning: "gradient-warning",
  accent: "gradient-accent",
};

export function ProgressBar({ value, variant = "primary", label, detail, className = "" }: Props) {
  const clamped = Math.min(100, Math.max(0, value));

  return (
    <div className={className}>
      {(label || detail) && (
        <div className="mb-1 flex items-center justify-between text-xs text-muted-foreground">
          {label && <span>{label}</span>}
          {detail && <span>{detail}</span>}
        </div>
      )}
      <div className="h-2 overflow-hidden rounded-full bg-secondary">
        <div
          className={`h-full rounded-full transition-all duration-500 ${fillClasses[variant]}`}
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  );
}
