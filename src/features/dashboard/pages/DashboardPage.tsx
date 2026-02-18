import { useState, useCallback, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuction } from "@/features/auction/hooks/useAuction";
import { useCurrentPrice } from "@/features/auction/hooks/useCurrentPrice";
import { AuctionCard } from "@/features/auction/components/AuctionCard";
import { useBlockHeight } from "@/shared/hooks/useBlockHeight";
import { getStats } from "@/shared/lib/mappings";
import { parseStats, type Stats } from "@/shared/types/auction";
import { Card } from "@/shared/components/ui/Card";
import { Button } from "@/shared/components/ui/Button";
import { Input } from "@/shared/components/ui/Input";
import { PageHeader } from "@/shared/components/ui/PageHeader";

function StatCard({ label, value, delay }: { label: string; value: string; delay: string }) {
  return (
    <Card variant="glass" padding="sm" className="animate-fade-in">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="text-2xl font-bold text-foreground">{value}</p>
    </Card>
  );
}

function AuctionResult({ auctionId, blockHeight }: { auctionId: string; blockHeight: number }) {
  const { config, state } = useAuction(auctionId);
  const { price, status: priceStatus } = useCurrentPrice(config, blockHeight);

  const status = state?.cleared ? "cleared" : state?.supply_met ? "supply_met" : priceStatus;

  if (!config) return null;

  return <AuctionCard config={config} status={status} currentPrice={price} />;
}

export function DashboardPage() {
  const { blockHeight } = useBlockHeight();
  const [stats, setStats] = useState<Stats | null>(null);
  const [searchId, setSearchId] = useState("");
  const [searchedIds, setSearchedIds] = useState<string[]>([]);

  useEffect(() => {
    getStats().then((raw) => {
      if (raw) setStats(parseStats(raw));
    });
  }, []);

  const handleSearch = useCallback(() => {
    const id = searchId.trim();
    if (id && !searchedIds.includes(id)) {
      setSearchedIds((prev) => [id, ...prev]);
    }
  }, [searchId, searchedIds]);

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
        <StatCard label="Total Auctions" value={stats?.total_auctions.toLocaleString() ?? "\u2014"} delay="0ms" />
        <StatCard label="Total Bids" value={stats?.total_bids.toLocaleString() ?? "\u2014"} delay="100ms" />
        <StatCard label="Current Block" value={blockHeight > 0 ? blockHeight.toLocaleString() : "\u2014"} delay="200ms" />
      </div>

      {/* Search */}
      <div>
        <h3 className="mb-4 text-lg font-semibold text-foreground">Look Up Auction</h3>
        <div className="flex gap-3">
          <div className="flex-1">
            <Input
              value={searchId}
              onChange={(e) => setSearchId(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              placeholder="Enter auction ID (e.g. 123field)"
            />
          </div>
          <Button onClick={handleSearch} size="lg">
            Search
          </Button>
        </div>
      </div>

      {/* Results */}
      {searchedIds.length > 0 && (
        <div>
          <h3 className="mb-4 text-lg font-semibold text-foreground">Results</h3>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {searchedIds.map((id) => (
              <AuctionResult key={id} auctionId={id} blockHeight={blockHeight} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
