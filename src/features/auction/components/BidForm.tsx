import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import type { AuctionConfig, TokenRecord } from "@/shared/types/auction";
import { useTransaction } from "@/shared/hooks/useTransaction";
import { TokenRecordSelector } from "@/shared/components/RecordSelector";
import { TransactionButton } from "@/shared/components/TransactionButton";
import { Card } from "@/shared/components/ui/Card";
import { Input } from "@/shared/components/ui/Input";
import { DataRow } from "@/shared/components/ui/DataRow";

interface Props {
  config: AuctionConfig;
  currentPrice: bigint;
  paymentRecords: TokenRecord[];
}

export function BidForm({ config, currentPrice, paymentRecords }: Props) {
  const [quantity, setQuantity] = useState("");
  const [selectedPayment, setSelectedPayment] = useState<TokenRecord | null>(null);
  const bidTx = useTransaction();

  const hasPaymentRecords = paymentRecords.some(
    (r) => r.token_id === config.payment_token_id && !r.spent,
  );

  const totalCost = useMemo(() => {
    const qty = BigInt(quantity || "0");
    return qty * currentPrice;
  }, [quantity, currentPrice]);

  const validation = useMemo(() => {
    const qty = BigInt(quantity || "0");
    if (qty <= 0n) return "Enter a quantity";
    if (qty < config.min_bid_amount) return `Minimum bid: ${config.min_bid_amount.toLocaleString()}`;
    if (config.max_bid_amount > 0n && qty > config.max_bid_amount) return `Maximum bid: ${config.max_bid_amount.toLocaleString()}`;
    if (!selectedPayment) return "Select a payment record";
    if (selectedPayment.amount < totalCost) return "Insufficient payment balance";
    return null;
  }, [quantity, config, selectedPayment, totalCost]);

  const handleBid = async () => {
    if (!selectedPayment || validation) return;
    const txId = await bidTx.execute("place_bid", [
      selectedPayment._record,
      config.auction_id,
      `${quantity}u128`,
    ]);
    if (txId) {
      setQuantity("");
      setSelectedPayment(null);
    }
  };

  return (
    <Card variant="glass" className="animate-fade-in h-full">
      <h4 className="mb-4 font-semibold text-foreground">Place Bid</h4>

      <div className="space-y-4">
        <Input
          label="Quantity"
          value={quantity}
          onChange={(e) => setQuantity(e.target.value.replace(/[^0-9]/g, ""))}
          placeholder={`Min: ${config.min_bid_amount.toLocaleString()}`}
        />

        <TokenRecordSelector
          records={paymentRecords}
          selected={selectedPayment}
          onSelect={setSelectedPayment}
          label="Payment Record"
          filterTokenId={config.payment_token_id}
        />
        {!hasPaymentRecords && (
          <p className="text-xs text-muted-foreground">
            No payment tokens?{" "}
            <Link to="/faucet" className="text-primary hover:underline">
              Mint some from the faucet.
            </Link>
          </p>
        )}

        {quantity && BigInt(quantity || "0") > 0n && (
          <div className="rounded-xl bg-secondary p-4">
            <DataRow label="Price per unit" value={currentPrice.toLocaleString()} border={false} />
            <DataRow
              label="Total cost"
              value={<span className="font-semibold text-primary">{totalCost.toLocaleString()}</span>}
              border={false}
            />
          </div>
        )}

        {bidTx.error && <p className="text-sm text-destructive">{bidTx.error}</p>}

        <TransactionButton
          onClick={handleBid}
          txStatus={bidTx.status}
          disabled={!!validation}
          className="w-full"
        >
          {validation || "Place Bid"}
        </TransactionButton>
      </div>
    </Card>
  );
}
