import { Link } from "react-router-dom";
import { RefreshCw } from "lucide-react";
import { useWallet } from "@demox-labs/aleo-wallet-adapter-react";
import { useAuctions } from "@/features/auction/hooks/useAuctions";
import { useCurrentPrice } from "@/features/auction/hooks/useCurrentPrice";
import { AuctionCard } from "@/features/auction/components/AuctionCard";
import { useBlockHeight } from "@/shared/hooks/useBlockHeight";
import { Card } from "@/shared/components/ui/Card";
import { Button } from "@/shared/components/ui/Button";
import { Spinner } from "@/shared/components/ui/Spinner";
import { PageHeader } from "@/shared/components/ui/PageHeader";
import type { AuctionEntry } from "@/features/auction/hooks/useAuctions";

function AuctionItem({ entry, blockHeight }: { entry: AuctionEntry; blockHeight: number }) {
  const { price, status: priceStatus } = useCurrentPrice(entry.config, blockHeight);
  const status = entry.state?.cleared
    ? "cleared"
    : entry.state?.supply_met
    ? "supply_met"
    : priceStatus;

  return (
    <div className="space-y-2">
      <AuctionCard config={entry.config} status={status} currentPrice={price} />
      <Link to={`/creator/manage?id=${entry.config.auction_id}`}>
        <Button variant="secondary" size="sm" className="w-full">
          Manage
        </Button>
      </Link>
    </div>
  );
}

export function MyAuctionsPage() {
  const { publicKey } = useWallet();
  const { blockHeight } = useBlockHeight();
  const { auctions, loading, error, refetch } = useAuctions({
    creatorFilter: publicKey ?? undefined,
    limit: 100,
  });

  return (
    <div className="space-y-8 animate-fade-in">
      <PageHeader
        title="My Auctions"
        description="Auctions you've created — click Manage to close or withdraw."
        action={
          <div className="flex items-center gap-3">
            <button
              onClick={refetch}
              disabled={loading}
              className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </button>
            <Link to="/auction/new">
              <Button>Create New</Button>
            </Link>
          </div>
        }
      />

      {!publicKey && (
        <Card className="py-10 text-center">
          <p className="text-muted-foreground">Connect your wallet to see your auctions.</p>
        </Card>
      )}

      {publicKey && loading && auctions.length === 0 && <Spinner center size="lg" />}

      {publicKey && error && <p className="text-sm text-destructive">{error}</p>}

      {publicKey && !loading && auctions.length === 0 && !error && (
        <Card className="py-12 text-center">
          <p className="font-medium text-foreground">No auctions found</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Auctions you create will appear here automatically.
          </p>
          <div className="mt-4">
            <Link to="/auction/new">
              <Button>Create Your First Auction</Button>
            </Link>
          </div>
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
  );
}
