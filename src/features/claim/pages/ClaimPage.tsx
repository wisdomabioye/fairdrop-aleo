import { useState, useEffect, useMemo } from "react";
import { useRecords } from "@/shared/hooks/useRecords";
import { useTransaction } from "@/shared/hooks/useTransaction";
import { useAuction } from "@/features/auction/hooks/useAuction";
import { BidRecordSelector } from "@/shared/components/RecordSelector";
import { TransactionButton } from "@/shared/components/TransactionButton";
import { Card } from "@/shared/components/ui/Card";
import { Alert } from "@/shared/components/ui/Alert";
import { DataRow } from "@/shared/components/ui/DataRow";
import { PageHeader } from "@/shared/components/ui/PageHeader";
import type { BidRecord } from "@/shared/types/auction";

export function ClaimPage() {
  const { bidRecords, fetchRecords, markSpent } = useRecords();
  const [selectedBid, setSelectedBid] = useState<BidRecord | null>(null);
  const [success, setSuccess] = useState(false);
  const claimTx = useTransaction();

  const { config, state } = useAuction(selectedBid?.auction_id);

  useEffect(() => { fetchRecords(); }, [fetchRecords]);

  const breakdown = useMemo(() => {
    if (!selectedBid || !state?.cleared) return null;
    const costAtClearing = selectedBid.quantity * state.clearing_price;
    const refund = selectedBid.payment_amount - costAtClearing;
    return {
      saleTokens: selectedBid.quantity,
      costAtClearing,
      refund,
      clearingPrice: state.clearing_price,
    };
  }, [selectedBid, state]);

  const handleClaim = async () => {
    if (!selectedBid || !config || !state?.cleared) return;
    const spentId = selectedBid.id;
    const txId = await claimTx.execute("claim", [
      selectedBid._record,
      `${state.clearing_price}u128`,
      config.sale_token_id,
      config.payment_token_id,
    ]);
    if (txId) {
      markSpent([spentId]);
      setSuccess(true);
      setSelectedBid(null);
    }
  };

  return (
    <div className="mx-auto max-w-lg space-y-8 animate-fade-in">
      <PageHeader
        title="Claim"
        description="Redeem your bid for sale tokens and payment refund."
      />

      <Card>
        <div className="space-y-5">
          <BidRecordSelector
            records={bidRecords}
            selected={selectedBid}
            onSelect={setSelectedBid}
            label="Select Bid Record"
          />

          {selectedBid && !state?.cleared && (
            <Alert variant="warning" title="Not yet cleared">
              This auction has not been cleared yet. Claims are available after closing.
            </Alert>
          )}

          {breakdown && (
            <div className="animate-slide-up rounded-xl border border-border bg-secondary p-4">
              <h5 className="mb-2 text-sm font-semibold text-foreground">Claim Breakdown</h5>
              <DataRow
                label="Sale tokens to receive"
                value={<span className="font-medium text-success">{breakdown.saleTokens.toLocaleString()}</span>}
              />
              <DataRow label="Clearing price"   value={breakdown.clearingPrice.toLocaleString()} />
              <DataRow label="Cost at clearing" value={breakdown.costAtClearing.toLocaleString()} />
              <DataRow
                label="Payment refund"
                value={<span className="font-semibold text-primary">{breakdown.refund.toLocaleString()}</span>}
              />
            </div>
          )}

          {claimTx.error && <p className="text-sm text-destructive">{claimTx.error}</p>}

          {success && (
            <Alert variant="success" title="Claim submitted!">
              You will receive your sale tokens and refund once confirmed.
            </Alert>
          )}

          <TransactionButton
            onClick={handleClaim}
            txStatus={claimTx.status}
            disabled={!selectedBid || !state?.cleared}
            className="w-full"
            variant="success"
          >
            Claim Tokens
          </TransactionButton>
        </div>
      </Card>
    </div>
  );
}
