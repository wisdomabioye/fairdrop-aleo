import { useEffect } from "react";
import { useParams } from "react-router-dom";
import { useBlockHeight } from "@/shared/hooks/useBlockHeight";
import { useRecords } from "@/shared/hooks/useRecords";
import { Spinner } from "@/shared/components/ui/Spinner";
import { Alert } from "@/shared/components/ui/Alert";
import { PageHeader } from "@/shared/components/ui/PageHeader";
import { StatusBadge } from "../components/StatusBadge";
import { AuctionInfo } from "../components/AuctionInfo";
import { PriceChart } from "../components/PriceChart";
import { BidForm } from "../components/BidForm";
import { useAuction } from "../hooks/useAuction";
import { useCurrentPrice } from "../hooks/useCurrentPrice";

export function AuctionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { config, state, loading, error, refetch } = useAuction(id);
  const { blockHeight } = useBlockHeight();
  const { price, status: priceStatus } = useCurrentPrice(config, blockHeight);
  const { tokenRecords, fetchRecords, markSpent } = useRecords();

  const status = state?.cleared ? "cleared" : state?.supply_met ? "supply_met" : priceStatus;
  const isActive = status === "active" || status === "ending";
  const blocksRemaining = config ? config.end_block - blockHeight : 0;
  const isEndingSoon = isActive && blocksRemaining > 0 && blocksRemaining < 100;

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  if (loading) {
    return <Spinner center size="lg" />;
  }

  if (error || !config) {
    return (
      <Alert variant="error" title="Auction Not Found">
        {error || "Could not load auction data."}
      </Alert>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <PageHeader title="Auction" action={<StatusBadge status={status} />} />
        <div className={`rounded-2xl border p-4 text-right ${isActive ? "border-primary/30 animate-glow" : "border-border"}`}>
          <p className="text-xs text-muted-foreground">Current Price</p>
          <p className={`text-3xl font-bold ${isActive ? "text-primary" : "text-foreground"}`}>
            {price !== null ? price.toLocaleString() : "\u2014"}
          </p>
        </div>
      </div>

      <p className="font-mono text-sm text-muted-foreground">{config.auction_id}</p>

      {/* Countdown warning */}
      {isEndingSoon && (
        <div className="animate-countdown-pulse rounded-2xl gradient-auction-ending p-4 text-center text-white">
          <p className="text-sm font-semibold">
            Ending in {blocksRemaining} blocks!
          </p>
        </div>
      )}

      {/* Price Chart */}
      <PriceChart config={config} currentBlock={blockHeight} currentPrice={price} />

      {/* Info Grid */}
      <AuctionInfo config={config} state={state} blockHeight={blockHeight} />

      {/* Bid Form — shown when active */}
      {isActive && price !== null && (
        <BidForm
          config={config}
          currentPrice={price}
          paymentRecords={tokenRecords}
          onSuccess={() => {
            refetch();
            fetchRecords();
          }}
          onMarkSpent={(id) => markSpent([id])}
        />
      )}
    </div>
  );
}
