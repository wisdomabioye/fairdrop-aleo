import { useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { useBlockHeight } from "@/shared/hooks/useBlockHeight";
import { useAuction } from "@/features/auction/hooks/useAuction";
import { useCurrentPrice } from "@/features/auction/hooks/useCurrentPrice";
import { AuctionCard } from "@/features/auction/components/AuctionCard";
import { Card } from "@/shared/components/ui/Card";
import { Button } from "@/shared/components/ui/Button";
import { Input } from "@/shared/components/ui/Input";
import { PageHeader } from "@/shared/components/ui/PageHeader";

function AuctionResult({ auctionId, blockHeight }: { auctionId: string; blockHeight: number }) {
  const { config, state } = useAuction(auctionId);
  const { price, status: priceStatus } = useCurrentPrice(config, blockHeight);

  const status = state?.cleared ? "cleared" : state?.supply_met ? "supply_met" : priceStatus;

  if (!config) return null;

  return (
    <div className="space-y-2">
      <AuctionCard config={config} status={status} currentPrice={price} />
      <Link to={`/creator/manage?id=${config.auction_id}`}>
        <Button variant="secondary" size="sm" className="w-full">
          Manage
        </Button>
      </Link>
    </div>
  );
}

export function MyAuctionsPage() {
  const { blockHeight } = useBlockHeight();
  const [searchId, setSearchId] = useState("");
  const [searchedIds, setSearchedIds] = useState<string[]>([]);

  const handleSearch = useCallback(() => {
    const id = searchId.trim();
    if (id && !searchedIds.includes(id)) {
      setSearchedIds((prev) => [id, ...prev]);
    }
  }, [searchId, searchedIds]);

  return (
    <div className="space-y-8 animate-fade-in">
      <PageHeader
        title="My Auctions"
        description="Look up and manage auctions you've created."
        action={
          <Link to="/auction/new">
            <Button>Create New</Button>
          </Link>
        }
      />

      <div className="flex gap-3">
        <div className="flex-1">
          <Input
            value={searchId}
            onChange={(e) => setSearchId(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            placeholder="Enter your auction ID"
          />
        </div>
        <Button onClick={handleSearch} size="lg">
          Load
        </Button>
      </div>

      {searchedIds.length === 0 && (
        <Card className="text-center">
          <p className="text-muted-foreground">Enter an auction ID above to manage it.</p>
        </Card>
      )}

      {searchedIds.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {searchedIds.map((id) => (
            <AuctionResult key={id} auctionId={id} blockHeight={blockHeight} />
          ))}
        </div>
      )}
    </div>
  );
}
