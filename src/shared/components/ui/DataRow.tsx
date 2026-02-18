import type { ReactNode } from "react";

interface Props {
  label: string;
  value: ReactNode;
  border?: boolean;
}

export function DataRow({ label, value, border = true }: Props) {
  return (
    <div className={`flex items-center justify-between py-2.5 ${border ? "border-b border-border last:border-0" : ""}`}>
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium text-foreground">{value}</span>
    </div>
  );
}
