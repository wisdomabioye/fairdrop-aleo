import { useState } from "react";
import type { TokenRecord } from "@/shared/types/auction";
import { TokenCard } from "./TokenCard";

interface Props {
  records: TokenRecord[];
  selected: TokenRecord | null;
  onSelect: (record: TokenRecord) => void;
  label?: string;
  emptyText?: string;
  /** When set, only records with this token_id are shown */
  filterTokenId?: string;
  /** Records to exclude by _raw identity (e.g. already selected in another slot) */
  exclude?: TokenRecord[];
}

export function TokenGrid({
  records,
  selected,
  onSelect,
  label,
  emptyText = "No token records found.",
  filterTokenId,
  exclude = [],
}: Props) {
  const [showSpent, setShowSpent] = useState(false);
  const excludeSet = new Set(exclude.map((r) => r._raw));

  const filtered = records.filter((r) => {
    if (excludeSet.has(r._raw)) return false;
    if (filterTokenId && r.token_id !== filterTokenId) return false;
    return true;
  });

  const unspent = filtered.filter((r) => !r.spent);
  const spent   = filtered.filter((r) => r.spent);

  return (
    <div>
      {label && (
        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {label}
        </p>
      )}

      {unspent.length === 0 && spent.length === 0 ? (
        <p className="text-sm text-muted-foreground">{emptyText}</p>
      ) : (
        <div className="space-y-2">
          {unspent.length === 0 ? (
            <p className="text-sm text-muted-foreground">{emptyText}</p>
          ) : (
            <div className="grid gap-2 sm:grid-cols-2">
              {unspent.map((record) => (
                <TokenCard
                  key={record._raw}
                  record={record}
                  selected={selected?._raw === record._raw}
                  onSelect={() => onSelect(record)}
                />
              ))}
            </div>
          )}

          {spent.length > 0 && (
            <div className="space-y-2">
              <button
                onClick={() => setShowSpent((s) => !s)}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                {spent.length} spent record{spent.length !== 1 ? "s" : ""} — {showSpent ? "hide" : "show"}
              </button>

              {showSpent && (
                <div className="grid gap-2 sm:grid-cols-2 opacity-50">
                  {spent.map((record) => (
                    <TokenCard key={record._raw} record={record} />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
