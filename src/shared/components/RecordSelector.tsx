import { Clock } from "lucide-react";
import type { TokenRecord, BidRecord } from "@/shared/types/auction";
import { getTokenLabel, getTokenSymbol } from "@/constants";

// ─── Token record selector ────────────────────────────────────────────────────

interface TokenSelectorProps {
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
  label = "Select Token",
  filterTokenId,
}: TokenSelectorProps) {
  const filtered = filterTokenId
    ? records.filter((r) => r.token_id === filterTokenId)
    : records;

  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-foreground">{label}</label>
      {filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground">No matching token records found.</p>
      ) : (
        <div className="max-h-52 overflow-y-auto rounded-xl pr-0.5 space-y-2">
          {filtered.map((record) => {
            const isSpent    = !!record.spent;
            const isSelected = selected?._raw === record._raw;
            return (
              <button
                key={record._raw}
                onClick={isSpent ? undefined : () => onSelect(record)}
                disabled={isSpent}
                className={[
                  "w-full rounded-xl border p-3 text-left transition-all",
                  isSpent
                    ? "cursor-not-allowed border-border/50 bg-card opacity-75"
                    : isSelected
                    ? "border-primary bg-primary/10 shadow-glow-primary"
                    : "border-border bg-card hover:border-primary/50 hover-lift",
                ].join(" ")}
              >
                <div className="flex items-center justify-between">
                  <span className={`text-sm font-medium ${isSpent ? "text-muted-foreground line-through" : "text-foreground"}`}>
                    {getTokenLabel(record.token_id)}
                  </span>
                  <div className="flex items-center gap-2">
                    {isSpent && (
                      <span className="flex items-center gap-1 rounded-full bg-secondary px-2 py-0.5 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        Spent
                      </span>
                    )}
                    <span className={`text-sm font-semibold ${isSpent ? "text-muted-foreground line-through" : "text-foreground"}`}>
                      {record.amount.toLocaleString()}{" "}
                      <span className="text-xs text-muted-foreground">{getTokenSymbol(record.token_id)}</span>
                    </span>
                  </div>
                </div>
              </button>
            );
          })}

          {filtered.some((r) => r.spent) && (
            <p className="text-xs text-muted-foreground px-1">
              Spent records will disappear once the wallet confirms them.
              New records may take a few minutes to appear.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Bid record selector ──────────────────────────────────────────────────────

interface BidSelectorProps {
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
}: BidSelectorProps) {
  const filtered = filterAuctionId
    ? records.filter((r) => r.auction_id === filterAuctionId)
    : records;

  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-foreground">{label}</label>
      {filtered.length === 0 ? (
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">No matching bid records found.</p>
          <p className="rounded-lg bg-warning/10 px-3 py-2 text-xs text-warning">
            Already placed a bid? Open the Leo wallet → ⚙ → Advanced → <span className="font-semibold">Upgrade Records</span> to force a resync.
          </p>
        </div>
      ) : (
        <div className="max-h-52 overflow-y-auto rounded-xl pr-0.5 space-y-2">
          {filtered.map((record) => {
            const isSpent    = !!record.spent;
            const isSelected = selected?._raw === record._raw;
            return (
              <button
                key={record._raw}
                onClick={isSpent ? undefined : () => onSelect(record)}
                disabled={isSpent}
                className={[
                  "w-full rounded-xl border p-3 text-left transition-all",
                  isSpent
                    ? "cursor-not-allowed border-border/50 bg-card opacity-75"
                    : isSelected
                    ? "border-primary bg-primary/10 shadow-glow-primary"
                    : "border-border bg-card hover:border-primary/50 hover-lift",
                ].join(" ")}
              >
                <div className="flex flex-col gap-1">
                  <div className="flex items-center justify-between">
                    <span className="truncate font-mono text-xs text-muted-foreground">
                      Auction: {record.auction_id}
                    </span>
                    {isSpent && (
                      <span className="flex items-center gap-1 rounded-full bg-secondary px-2 py-0.5 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        Spent
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className={`text-sm ${isSpent ? "text-muted-foreground line-through" : "text-foreground"}`}>
                      Qty: {record.quantity.toLocaleString()}
                    </span>
                    <span className={`text-sm font-semibold ${isSpent ? "text-muted-foreground line-through" : "text-foreground"}`}>
                      Paid: {record.payment_amount.toLocaleString()}
                    </span>
                  </div>
                </div>
              </button>
            );
          })}

          {filtered.some((r) => r.spent) && (
            <p className="text-xs text-muted-foreground px-1">
              Spent records will disappear once the wallet confirms them.
              New records may take a few minutes to appear.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
