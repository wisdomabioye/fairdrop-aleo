type Size = "sm" | "default" | "lg";

interface Props {
  size?: Size;
  center?: boolean;
  className?: string;
}

const sizeClasses: Record<Size, string> = {
  sm: "h-4 w-4",
  default: "h-6 w-6",
  lg: "h-8 w-8",
};

export function Spinner({ size = "default", center, className = "" }: Props) {
  const spinner = (
    <div
      className={`animate-spin rounded-full border-4 border-primary border-t-transparent ${sizeClasses[size]} ${className}`}
    />
  );

  if (center) {
    return <div className="flex items-center justify-center h-32">{spinner}</div>;
  }

  return spinner;
}
