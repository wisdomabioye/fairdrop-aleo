import type { BidRecord } from "@/shared/types/auction";
import { DropdownSelect } from "@/shared/components/ui/DropdownSelect";

interface BidRecordSelectorProps {
  records: BidRecord[];
  selected: BidRecord | null;
  onSelect: (record: BidRecord) => void;
  label?: string;
  filterAuctionId?: string;
}

export function BidRecordSelector({
  records,
  selected,
  onSelect,
  label = "Select Bid",
  filterAuctionId,
}: BidRecordSelectorProps) {
  const filtered = filterAuctionId
    ? records.filter((r) => r.auction_id === filterAuctionId)
    : records;

  return (
    <DropdownSelect
      items={filtered}
      selected={selected}
      getId={(r) => r.id}
      isSpent={(r) => !!r.spent}
      onSelect={onSelect}
      label={label}
      placeholder="Pick a bid record…"
      emptyText="No matching bid records found."
      spentLabel="claimed"
      emptyHint={
        <p className="rounded-lg bg-warning/10 px-3 py-2 text-xs text-warning">
          Already placed a bid? Open the Leo wallet → ⚙ → Advanced →{" "}
          <span className="font-semibold">Upgrade Records</span> to force a resync.
        </p>
      }
      renderTrigger={(r) => <BidRow record={r} />}
      renderOption={(r, { spent }) => <BidRow record={r} dimmed={spent} />}
    />
  );
}

// ─── Shared row renderer ─────────────────────────────────────────────────────

function BidRow({ record: r, dimmed }: { record: BidRecord; dimmed?: boolean }) {
  return (
    <div className={`flex flex-1 items-center justify-between gap-3 min-w-0 ${dimmed ? "line-through" : ""}`}>
      <span className="truncate font-mono text-xs">{r.auction_id}</span>
      <div className="flex shrink-0 items-center gap-3 tabular-nums text-sm">
        <span>Qty {r.quantity.toLocaleString()}</span>
        <span className="font-medium">{r.payment_amount.toLocaleString()} µ</span>
      </div>
    </div>
  );
}
