import { useState, useMemo } from "react";
import { useWallet } from "@provablehq/aleo-wallet-adaptor-react";
import { useBidRecords } from "@/shared/hooks/useBidRecords";
import { useTransaction } from "@/shared/hooks/useTransaction";
import { useTokenMetadata } from "@/shared/hooks/useTokenMetadata";
import { formatTokenAmount } from "@/shared/utils/formatting";
import { useAuction } from "@/features/auction/hooks/useAuction";
import { ConnectWalletPrompt } from "@/shared/components/ConnectWalletPrompt";
import { BidRecordSelector } from "@/shared/components/RecordSelector";
import { TransactionButton } from "@/shared/components/TransactionButton";
import { Card } from "@/shared/components/ui/Card";
import { Alert } from "@/shared/components/ui/Alert";
import { DataRow } from "@/shared/components/ui/DataRow";
import { PageHeader } from "@/shared/components/ui/PageHeader";
import type { BidRecord } from "@/shared/types/auction";

export function ClaimPage() {
  const { address } = useWallet();
  const { bidRecords } = useBidRecords();
  const [selectedBid, setSelectedBid] = useState<BidRecord | null>(null);
  const claimTx = useTransaction({ label: "Claim Tokens" });

  const { config, state } = useAuction(selectedBid?.auction_id);

  const { metadata: saleMeta } = useTokenMetadata(config?.sale_token_id);
  const { metadata: payMeta } = useTokenMetadata(config?.payment_token_id);
  const saleSymbol = saleMeta?.symbolStr ?? null;
  const paySymbol = payMeta?.symbolStr ?? null;
  const fmtSale = (v: bigint) => formatTokenAmount(v, saleMeta);
  const fmtPay = (v: bigint) => formatTokenAmount(v, payMeta);

  const saleDecimals = saleMeta?.decimals ?? 0;
  const saleScale = 10n ** BigInt(saleDecimals);

  const breakdown = useMemo(() => {
    if (!selectedBid || !state?.cleared) return null;
    const costAtClearing = selectedBid.quantity * state.clearing_price / saleScale;
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
    const txId = await claimTx.execute("claim", [
      selectedBid._record,
      `${state.clearing_price}u128`,
      config.sale_token_id,
      `${saleScale}u128`,
    ]);
    if (txId) setSelectedBid(null);
  };

  return (
    <div className="mx-auto max-w-lg space-y-8 animate-fade-in">
      <PageHeader
        title="Claim"
        description="Redeem your bid for sale tokens and payment refund."
      />

      {!address && (
        <Card>
          <ConnectWalletPrompt
            title="Connect to claim"
            description="Your bid records are privately encrypted. Connect your wallet to redeem sale tokens and receive your refund."
          />
        </Card>
      )}

      {address && <Card>
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
                value={<span className="font-medium text-success">{fmtSale(breakdown.saleTokens)}{saleSymbol && <span className="ml-1 text-xs font-normal text-muted-foreground">{saleSymbol}</span>}</span>}
              />
              <DataRow label="Clearing price"   value={<>{fmtPay(breakdown.clearingPrice)}{paySymbol && <span className="ml-1 text-xs text-muted-foreground">{paySymbol}</span>}</>} />
              <DataRow label="Cost at clearing" value={<>{fmtPay(breakdown.costAtClearing)}{paySymbol && <span className="ml-1 text-xs text-muted-foreground">{paySymbol}</span>}</>} />
              <DataRow
                label="Payment refund"
                value={<span className="font-semibold text-primary">{fmtPay(breakdown.refund)}{paySymbol && <span className="ml-1 text-xs font-normal text-muted-foreground">{paySymbol}</span>}</span>}
              />
            </div>
          )}

          {claimTx.error && <p className="text-sm text-destructive">{claimTx.error}</p>}

          {claimTx.status === "confirmed" && (
            <Alert variant="success" title="Claim confirmed!">
              Your sale tokens and refund have been delivered.
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
      </Card>}
    </div>
  );
}
