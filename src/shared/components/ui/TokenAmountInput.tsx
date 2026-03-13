import { type ChangeEvent } from "react";
import { formatTokenAmount, toPlainAmount } from "@/shared/utils/formatting";
import { Input } from "./Input";

interface Props {
  label: string;
  value: string;
  onChange: (value: string) => void;
  decimals: number;
  symbol?: string | null;
  /** Raw on-chain max (bigint). Enables a "Max" button. */
  max?: bigint;
  maxLabel?: string;
  placeholder?: string;
  error?: string;
  hint?: string;
}

/**
 * Numeric input that accepts human-readable token amounts with decimal support.
 * Parent stores the human-readable string and converts to raw bigint via `parseTokenAmount`.
 */
export function TokenAmountInput({
  label,
  value,
  onChange,
  decimals,
  symbol,
  max,
  maxLabel = "Max",
  placeholder,
  error,
  hint,
}: Props) {
  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    let v = e.target.value;

    if (decimals === 0) {
      // Integer-only: strip everything except digits
      v = v.replace(/[^0-9]/g, "");
    } else {
      // Allow digits and a single dot
      v = v.replace(/[^0-9.]/g, "");

      // Prevent multiple dots
      const parts = v.split(".");
      if (parts.length > 2) {
        v = parts[0] + "." + parts.slice(1).join("");
      }

      // Cap fractional digits
      if (parts.length === 2 && parts[1].length > decimals) {
        v = parts[0] + "." + parts[1].slice(0, decimals);
      }
    }

    onChange(v);
  };

  const handleMax = () => {
    if (max == null) return;
    onChange(toPlainAmount(max, decimals));
  };

  const fullLabel = symbol ? `${label} (${symbol})` : label;

  return (
    <div>
      <Input
        label={fullLabel}
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        error={error}
        hint={hint}
        inputMode={decimals > 0 ? "decimal" : "numeric"}
      />
      {max != null && (
        <button
          type="button"
          onClick={handleMax}
          className="mt-1 text-xs text-primary hover:underline"
        >
          {maxLabel} ({formatTokenAmount(max, { decimals })}{symbol ? ` ${symbol}` : ""})
        </button>
      )}
    </div>
  );
}
