import type { CreatorToken } from "@/shared/hooks/useCreatorTokens";
import { formatTokenAmount } from "@/shared/utils/formatting";
import { DropdownSelect } from "@/shared/components/ui/DropdownSelect";

interface Props {
  tokens: CreatorToken[];
  selectedId: string;
  onSelect: (tokenId: string) => void;
}

export function TokenPicker({ tokens, selectedId, onSelect }: Props) {
  const selected = tokens.find((t) => t.tokenId === selectedId) ?? null;

  return (
    <DropdownSelect
      items={tokens}
      selected={selected}
      getId={(t) => t.tokenId}
      onSelect={(t) => onSelect(t.tokenId)}
      placeholder="Pick a token…"
      emptyText="No tokens found."
      renderTrigger={(t) => <TokenRow token={t} />}
      renderOption={(t) => <TokenRow token={t} />}
    />
  );
}

function TokenRow({ token: t }: { token: CreatorToken }) {
  const symbol = t.metadata?.symbolStr;
  const name = t.metadata?.nameStr;
  return (
    <div className="flex flex-1 items-center gap-2 min-w-0">
      {symbol && (
        <span className="shrink-0 rounded-md bg-primary/10 px-1.5 py-0.5 text-xs font-semibold text-primary">
          {symbol}
        </span>
      )}
      <span className="truncate text-sm text-foreground">
        {name ?? t.tokenId.slice(0, 20) + "…"}
      </span>
      <span className="ml-auto shrink-0 tabular-nums text-sm font-medium text-muted-foreground">
        {formatTokenAmount(t.ownedAmount, t.metadata)}
      </span>
    </div>
  );
}
