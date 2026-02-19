import { Link } from "react-router-dom";
import { RefreshCw } from "lucide-react";
import { useAuctions } from "@/features/auction/hooks/useAuctions";
import { useCurrentPrice } from "@/features/auction/hooks/useCurrentPrice";
import { AuctionCard } from "@/features/auction/components/AuctionCard";
import { useBlockHeight } from "@/shared/hooks/useBlockHeight";
import { Card } from "@/shared/components/ui/Card";
import { Button } from "@/shared/components/ui/Button";
import { Spinner } from "@/shared/components/ui/Spinner";
import { PageHeader } from "@/shared/components/ui/PageHeader";
import type { AuctionEntry } from "@/features/auction/hooks/useAuctions";

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <Card variant="glass" padding="sm" className="animate-fade-in">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="text-2xl font-bold text-foreground">{value}</p>
    </Card>
  );
}

function AuctionItem({ entry, blockHeight }: { entry: AuctionEntry; blockHeight: number }) {
  const { price, status: priceStatus } = useCurrentPrice(entry.config, blockHeight);
  const status = entry.state?.cleared
    ? "cleared"
    : entry.state?.supply_met
    ? "supply_met"
    : priceStatus;

  return <AuctionCard config={entry.config} status={status} currentPrice={price} />;
}

export function DashboardPage() {
  const { blockHeight } = useBlockHeight();
  const { auctions, total, loading, error, refetch } = useAuctions({ limit: 50 });

  return (
    <div className="space-y-10">
      <PageHeader
        title="Dashboard"
        description="Privacy-preserving Dutch auctions with zero-knowledge proofs."
        action={
          <Link to="/auction/new">
            <Button variant="primary" size="lg">
              Create Auction
            </Button>
          </Link>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Total Auctions" value={total?.toLocaleString() ?? "—"} />
        <StatCard label="Loaded" value={loading ? "…" : auctions.length.toLocaleString()} />
        <StatCard label="Current Block" value={blockHeight > 0 ? blockHeight.toLocaleString() : "—"} />
      </div>

      {/* Auction list */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-foreground">
            All Auctions
            {total !== null && total > 0 && (
              <span className="ml-2 text-sm font-normal text-muted-foreground">
                ({total.toLocaleString()} total)
              </span>
            )}
          </h3>
          <button
            onClick={refetch}
            disabled={loading}
            className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>

        {loading && auctions.length === 0 && <Spinner center size="lg" />}

        {error && <p className="text-sm text-destructive">{error}</p>}

        {!loading && auctions.length === 0 && !error && (
          <Card className="py-12 text-center">
            <p className="font-medium text-foreground">No auctions yet</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Be the first to{" "}
              <Link to="/auction/new" className="text-primary hover:underline">
                create an auction
              </Link>
              .
            </p>
          </Card>
        )}

        {auctions.length > 0 && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {auctions.map((entry) => (
              <AuctionItem
                key={entry.config.auction_id}
                entry={entry}
                blockHeight={blockHeight}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
