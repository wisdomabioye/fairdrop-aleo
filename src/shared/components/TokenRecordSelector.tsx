import type { TokenRecord } from "@/shared/types/token";
import { useTokenMetadata } from "@/shared/hooks/useTokenMetadata";
import { DropdownSelect } from "@/shared/components/ui/DropdownSelect";

interface TokenRecordSelectorProps {
  records: TokenRecord[];
  selected: TokenRecord | null;
  onSelect: (record: TokenRecord) => void;
  label?: string;
  filterTokenId?: string;
}

export function TokenRecordSelector({
  records,
  selected,
  onSelect,
  label = "Select Token Record",
  filterTokenId,
}: TokenRecordSelectorProps) {
  const filtered = filterTokenId
    ? records.filter((r) => r.token_id === filterTokenId)
    : records;

  const tokenIds = [...new Set(filtered.map((r) => r.token_id))];
  const { metadataMap } = useTokenMetadata(tokenIds);

  const getDisplay = (tokenId: string) => {
    const meta = metadataMap.get(tokenId);
    return { name: meta?.nameStr ?? null, symbol: meta?.symbolStr ?? null };
  };

  return (
    <DropdownSelect
      items={filtered}
      selected={selected}
      getId={(r) => r.id}
      isSpent={(r) => !!r.spent}
      onSelect={onSelect}
      label={label}
      placeholder="Pick a token record…"
      emptyText="No matching token records found."
      spentLabel="spent"
      renderTrigger={(r) => <TokenRow tokenId={r.token_id} amount={r.amount} getDisplay={getDisplay} />}
      renderOption={(r, { spent }) => (
        <TokenRow tokenId={r.token_id} amount={r.amount} getDisplay={getDisplay} dimmed={spent} />
      )}
    />
  );
}

// ─── Shared row renderer ─────────────────────────────────────────────────────

function TokenRow({
  tokenId,
  amount,
  getDisplay,
  dimmed,
}: {
  tokenId: string;
  amount: bigint;
  getDisplay: (id: string) => { name: string | null; symbol: string | null };
  dimmed?: boolean;
}) {
  const { name, symbol } = getDisplay(tokenId);
  return (
    <div className={`flex flex-1 items-center gap-2 min-w-0 ${dimmed ? "line-through" : ""}`}>
      {symbol && (
        <span className="shrink-0 rounded-md bg-primary/10 px-1.5 py-0.5 text-xs font-semibold text-primary">
          {symbol}
        </span>
      )}
      <span className="truncate text-sm text-muted-foreground">
        {name ?? tokenId.slice(0, 16) + "…"}
      </span>
      <span className="ml-auto shrink-0 tabular-nums text-sm font-medium text-foreground">
        {amount.toLocaleString()}
      </span>
    </div>
  );
}
