import { CheckCircle2, ChevronRight, Rocket, Coins, ShieldCheck } from "lucide-react";

export const WIZARD_STEPS = [
  { label: "Register",  icon: Rocket },
  { label: "Mint",      icon: Coins },
  { label: "Authorize", icon: ShieldCheck },
] as const;

export function StepIndicator({ current }: { current: number }) {
  return (
    <div className="flex items-center gap-2">
      {WIZARD_STEPS.map((s, i) => {
        const done   = i < current;
        const active = i === current;
        const Icon   = s.icon;
        return (
          <div key={s.label} className="flex items-center gap-2">
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-colors ${
                done    ? "bg-success text-white"
                : active ? "bg-primary text-white"
                         : "bg-secondary text-muted-foreground"
              }`}
            >
              {done ? <CheckCircle2 className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
            </div>
            <span
              className={`hidden text-sm font-medium sm:block ${
                active ? "text-foreground" : "text-muted-foreground"
              }`}
            >
              {s.label}
            </span>
            {i < WIZARD_STEPS.length - 1 && (
              <ChevronRight className="h-4 w-4 text-muted-foreground/40" />
            )}
          </div>
        );
      })}
    </div>
  );
}
