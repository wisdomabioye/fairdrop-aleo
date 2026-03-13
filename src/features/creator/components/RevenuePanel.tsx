import { useState, useEffect } from "react";
import { getCreatorWithdrawn, getUnsoldWithdrawn } from "@/shared/lib/mappings";
import { useTokenMetadata } from "@/shared/hooks/useTokenMetadata";
import { formatTokenAmount } from "@/shared/utils/formatting";
import { Card } from "@/shared/components/ui/Card";
import { DataRow } from "@/shared/components/ui/DataRow";
import { Spinner } from "@/shared/components/ui/Spinner";
import type { AuctionState, AuctionConfig } from "@/shared/types/auction";

interface Props {
  auctionId: string;
  config: AuctionConfig;
  state: AuctionState;
  /** Pass txSuccess to re-fetch after a withdrawal transaction settles. */
  refetchTrigger?: unknown;
}

/**
 * Displays creator revenue summary for a cleared auction.
 * Fetches creator_withdrawn and unsold_withdrawn mapping values internally.
 */
export function RevenuePanel({ auctionId, config, state, refetchTrigger }: Props) {
  const [withdrawn, setWithdrawn]           = useState(0n);
  const [unsoldWithdrawn, setUnsoldWithdrawn] = useState(0n);
  const [loading, setLoading]               = useState(false);

  const { metadata: saleMeta } = useTokenMetadata(config.sale_token_id);
  const { metadata: payMeta } = useTokenMetadata(config.payment_token_id);
  const saleSymbol = saleMeta?.symbolStr ?? null;
  const paySymbol = payMeta?.symbolStr ?? null;

  const fmtSale = (v: bigint) => formatTokenAmount(v, saleMeta);
  const fmtPay = (v: bigint) => formatTokenAmount(v, payMeta);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    Promise.all([
      getCreatorWithdrawn(auctionId),
      getUnsoldWithdrawn(auctionId),
    ]).then(([rev, unsold]) => {
      if (cancelled) return;
      if (rev)   setWithdrawn(BigInt(rev.replace(/u128$/, "")));
      if (unsold) setUnsoldWithdrawn(BigInt(unsold.replace(/u128$/, "")));
    }).finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [auctionId, refetchTrigger]);

  if (!state.cleared) {
    return (
      <Card padding="sm">
        <p className="text-sm text-muted-foreground">
          Revenue summary is available after the auction is cleared.
        </p>
      </Card>
    );
  }

  if (loading) return <Spinner center />;

  const unsoldSupply    = config.supply - state.total_committed;
  const remaining       = state.creator_revenue - withdrawn;
  const unsoldRemaining = unsoldSupply - unsoldWithdrawn;

  /** Formatted value + symbol suffix */
  const pay = (v: bigint) => paySymbol ? <>{fmtPay(v)} <span className="text-xs text-muted-foreground">{paySymbol}</span></> : fmtPay(v);
  const sale = (v: bigint) => saleSymbol ? <>{fmtSale(v)} <span className="text-xs text-muted-foreground">{saleSymbol}</span></> : fmtSale(v);

  return (
    <Card variant="gradient" padding="sm">
      <h4 className="mb-3 font-semibold text-foreground">Revenue Summary</h4>
      <DataRow label="Clearing Price"  value={pay(state.clearing_price)} />
      <DataRow label="Total Payments"  value={pay(state.total_payments)} />
      <DataRow label="Creator Revenue" value={<span className="font-bold text-primary">{fmtPay(state.creator_revenue)}{paySymbol && <span className="ml-1 text-xs font-normal text-muted-foreground">{paySymbol}</span>}</span>} />
      <DataRow label="Withdrawn"       value={pay(withdrawn)} />
      <DataRow label="Remaining"       value={<span className="font-medium text-success">{fmtPay(remaining)}{paySymbol && <span className="ml-1 text-xs font-normal text-muted-foreground">{paySymbol}</span>}</span>} />
      {unsoldSupply > 0n && (
        <>
          <DataRow label="Unsold Supply"     value={sale(unsoldSupply)} />
          <DataRow label="Unsold Withdrawn"  value={sale(unsoldWithdrawn)} />
          <DataRow label="Unsold Remaining"  value={<span className="font-medium text-warning">{fmtSale(unsoldRemaining)}{saleSymbol && <span className="ml-1 text-xs font-normal text-muted-foreground">{saleSymbol}</span>}</span>} />
        </>
      )}
    </Card>
  );
}
