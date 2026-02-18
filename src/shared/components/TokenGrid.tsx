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
  const excludeSet = new Set(exclude.map((r) => r._raw));

  const filtered = records.filter((r) => {
    if (excludeSet.has(r._raw)) return false;
    if (filterTokenId && r.token_id !== filterTokenId) return false;
    return true;
  });

  const hasSpent = filtered.some((r) => r.spent);

  return (
    <div>
      {label && (
        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {label}
        </p>
      )}

      {filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground">{emptyText}</p>
      ) : (
        <div className="space-y-2">
          <div className="grid gap-2 sm:grid-cols-2">
            {filtered.map((record) => (
              <TokenCard
                key={record._raw}
                record={record}
                selected={selected?._raw === record._raw}
                onSelect={record.spent ? undefined : () => onSelect(record)}
              />
            ))}
          </div>

          {hasSpent && (
            <p className="text-xs text-muted-foreground">
              Spent records will disappear once the wallet confirms them on-chain.
              New records from this transaction may take a few minutes to appear.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
