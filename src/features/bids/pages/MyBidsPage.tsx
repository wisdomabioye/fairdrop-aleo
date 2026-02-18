import { useEffect } from "react";
import { Link } from "react-router-dom";
import { useRecords } from "@/shared/hooks/useRecords";
import { Card } from "@/shared/components/ui/Card";
import { Button } from "@/shared/components/ui/Button";
import { Badge } from "@/shared/components/ui/Badge";
import { DataRow } from "@/shared/components/ui/DataRow";
import { PageHeader } from "@/shared/components/ui/PageHeader";
import { Spinner } from "@/shared/components/ui/Spinner";
import { formatField } from "@/shared/lib/formatting";

export function MyBidsPage() {
  const { bidRecords, loading, fetchRecords } = useRecords();

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  return (
    <div className="space-y-8 animate-fade-in">
      <PageHeader
        title="My Bids"
        description="View all your active bid records."
        action={
          <Button variant="secondary" onClick={fetchRecords} disabled={loading}>
            {loading ? "Refreshing..." : "Refresh"}
          </Button>
        }
      />

      {loading && bidRecords.length === 0 && <Spinner center size="lg" />}

      {!loading && bidRecords.length === 0 && (
        <Card className="text-center">
          <p className="text-muted-foreground">No bid records found.</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Place a bid on an auction to see it here.
          </p>
        </Card>
      )}

      {bidRecords.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2">
          {bidRecords.map((bid, i) => (
            <Card key={i}>
              <div className="mb-3 flex items-center justify-between">
                <Badge variant="info" dot>Bid</Badge>
                <Link
                  to={`/auction/${bid.auction_id}`}
                  className="text-xs font-mono text-primary hover:underline"
                >
                  {formatField(bid.auction_id)}
                </Link>
              </div>
              <DataRow label="Quantity" value={bid.quantity.toLocaleString()} />
              <DataRow label="Payment Locked" value={bid.payment_amount.toLocaleString()} />
              <div className="mt-3">
                <Link to="/claim">
                  <Button variant="success" size="sm" className="w-full">
                    Go to Claim
                  </Button>
                </Link>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
