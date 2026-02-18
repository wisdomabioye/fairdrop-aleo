import { Clock } from "lucide-react";
import type { TokenRecord } from "@/shared/types/auction";
import { getTokenLabel, getTokenSymbol } from "@/constants";

interface Props {
  record: TokenRecord;
  selected?: boolean;
  /** Show a deselect (×) button — fires instead of onSelect when clicked */
  onDeselect?: () => void;
  onSelect?: () => void;
  /** Visually dim the card (e.g. incompatible record) */
  dim?: boolean;
  className?: string;
}

export function TokenCard({ record, selected, onDeselect, onSelect, dim, className = "" }: Props) {
  const symbol = getTokenSymbol(record.token_id);
  const label  = getTokenLabel(record.token_id);
  const spent  = record.spent;

  return (
    <div
      onClick={spent ? undefined : onSelect}
      className={[
        "relative rounded-xl border p-3 transition-all",
        spent
          ? "cursor-not-allowed border-border/50 bg-card opacity-75"
          : onSelect
          ? "cursor-pointer"
          : "",
        !spent && selected
          ? "border-primary bg-primary/10 shadow-glow-primary"
          : !spent && dim
          ? "border-border bg-card opacity-40 cursor-not-allowed"
          : !spent
          ? "border-border bg-card hover:border-primary/50 hover-lift"
          : "",
        className,
      ].join(" ")}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-xs text-muted-foreground">{label}</p>
          <p className={`mt-0.5 text-base font-bold ${spent ? "line-through text-muted-foreground" : "text-foreground"}`}>
            {record.amount.toLocaleString()}{" "}
            <span className={`text-sm font-semibold ${spent ? "text-muted-foreground" : "text-primary"}`}>
              {symbol}
            </span>
          </p>
        </div>

        {/* Spent badge */}
        {spent && (
          <span className="flex items-center gap-1 rounded-full bg-secondary px-2 py-0.5 text-xs font-medium text-muted-foreground">
            <Clock className="h-3 w-3" />
            Spent
          </span>
        )}

        {/* Deselect button */}
        {!spent && onDeselect && (
          <button
            onClick={(e) => { e.stopPropagation(); onDeselect(); }}
            aria-label="Deselect"
            className="ml-1 flex-shrink-0 rounded-full p-1 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}

        {/* Selected checkmark */}
        {!spent && selected && !onDeselect && (
          <svg className="h-4 w-4 flex-shrink-0 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        )}
      </div>
    </div>
  );
}
