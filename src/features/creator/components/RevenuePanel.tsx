import { useState, useEffect } from "react";
import { getCreatorWithdrawn, getUnsoldWithdrawn } from "@/shared/lib/mappings";
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

  return (
    <Card variant="gradient" padding="sm">
      <h4 className="mb-3 font-semibold text-foreground">Revenue Summary</h4>
      <DataRow label="Clearing Price"  value={state.clearing_price.toLocaleString()} />
      <DataRow label="Total Payments"  value={state.total_payments.toLocaleString()} />
      <DataRow label="Creator Revenue" value={<span className="font-bold text-primary">{state.creator_revenue.toLocaleString()}</span>} />
      <DataRow label="Withdrawn"       value={withdrawn.toLocaleString()} />
      <DataRow label="Remaining"       value={<span className="font-medium text-success">{remaining.toLocaleString()}</span>} />
      {unsoldSupply > 0n && (
        <>
          <DataRow label="Unsold Supply"     value={unsoldSupply.toLocaleString()} />
          <DataRow label="Unsold Withdrawn"  value={unsoldWithdrawn.toLocaleString()} />
          <DataRow label="Unsold Remaining"  value={<span className="font-medium text-warning">{unsoldRemaining.toLocaleString()}</span>} />
        </>
      )}
    </Card>
  );
}
