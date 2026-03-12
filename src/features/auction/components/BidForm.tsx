import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { Shield, Eye } from "lucide-react";
import type { AuctionConfig } from "@/shared/types/auction";
import type { CreditRecord } from "@/shared/types/token";
import { useTransaction } from "@/shared/hooks/useTransaction";
import { TransactionButton } from "@/shared/components/TransactionButton";
import { Card } from "@/shared/components/ui/Card";
import { Input } from "@/shared/components/ui/Input";
import { Alert } from "@/shared/components/ui/Alert";
import { DataRow } from "@/shared/components/ui/DataRow";

interface Props {
  config: AuctionConfig;
  currentPrice: bigint;
  creditRecords: CreditRecord[];
}

export function BidForm({ config, currentPrice, creditRecords }: Props) {
  const [mode, setMode] = useState<"private" | "public">("private");
  const [quantity, setQuantity] = useState("");
  const [selectedRecord, setSelectedRecord] = useState<CreditRecord | null>(null);
  const privateTx = useTransaction();
  const publicTx = useTransaction();
  const tx = mode === "private" ? privateTx : publicTx;

  const qty = BigInt(quantity || "0");
  const totalCost = qty * currentPrice;   // microcredits

  // payment_amount must fit in u64
  const paymentAmountU64 = totalCost <= 18446744073709551615n ? totalCost : 0n;

  const unspentRecords = creditRecords.filter((r) => !r.spent);

  const validation = useMemo(() => {
    if (qty <= 0n) return "Enter a quantity";
    if (qty < config.min_bid_amount) return `Minimum bid: ${config.min_bid_amount.toLocaleString()}`;
    if (config.max_bid_amount > 0n && qty > config.max_bid_amount)
      return `Maximum bid: ${config.max_bid_amount.toLocaleString()}`;
    if (mode === "private") {
      if (!selectedRecord) return "Select a credits record";
      if (selectedRecord.microcredits < totalCost) return "Insufficient credits in record";
    }
    return null;
  }, [qty, config, mode, selectedRecord, totalCost]);

  const handleBid = async () => {
    if (validation) return;
    if (mode === "private") {
      if (!selectedRecord) return;
      const txId = await privateTx.execute("place_bid_private", [
        selectedRecord._record,
        config.auction_id,
        `${qty}u128`,
        `${paymentAmountU64}u64`,
      ]);
      if (txId) { setQuantity(""); setSelectedRecord(null); }
    } else {
      const txId = await publicTx.execute("place_bid_public", [
        config.auction_id,
        `${qty}u128`,
        `${paymentAmountU64}u64`,
      ]);
      if (txId) setQuantity("");
    }
  };

  return (
    <Card variant="glass" className="animate-fade-in h-full">
      <h4 className="mb-4 font-semibold text-foreground">Place Bid</h4>

      <div className="space-y-4">
        {/* Privacy mode toggle */}
        <div className="flex gap-2">
          {(["private", "public"] as const).map((m) => (
            <button
              key={m}
              onClick={() => { setMode(m); setSelectedRecord(null); }}
              className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl border py-2 text-xs font-medium transition-colors ${
                mode === m
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border text-muted-foreground hover:border-primary/40"
              }`}
            >
              {m === "private" ? <Shield className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
              {m === "private" ? "Private" : "Public"}
            </button>
          ))}
        </div>

        <Alert variant="info" title={mode === "private" ? "Private bid" : "Public bid"}>
          {mode === "private"
            ? "Your credits record (UTXO) is consumed privately. Bid amount is visible on-chain; the source record is not."
            : "Deducted from your public credits.aleo balance. Both your address and bid amount are fully public."}
        </Alert>

        <Input
          label="Quantity"
          value={quantity}
          onChange={(e) => setQuantity(e.target.value.replace(/[^0-9]/g, ""))}
          placeholder={`Min: ${config.min_bid_amount.toLocaleString()}`}
        />

        {/* Private: record selector */}
        {mode === "private" && (
          <div className="space-y-2">
            <p className="text-sm font-medium text-foreground">Credits Record</p>
            {unspentRecords.length === 0 ? (
              <p className="text-xs text-muted-foreground">
                No credits records found.{" "}
                <Link to="/faucet" className="text-primary hover:underline">
                  Get credits from faucet.
                </Link>
              </p>
            ) : (
              <div className="space-y-1.5 max-h-40 overflow-y-auto">
                {unspentRecords.map((r) => (
                  <button
                    key={r.id}
                    onClick={() => setSelectedRecord(r)}
                    className={`w-full rounded-xl border px-3 py-2 text-left text-xs transition-colors ${
                      selectedRecord?.id === r.id
                        ? "border-primary bg-primary/10"
                        : "border-border hover:border-primary/40"
                    }`}
                  >
                    <span className="font-medium text-foreground">
                      {r.microcredits.toLocaleString()} µALEO
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {qty > 0n && (
          <div className="rounded-xl bg-secondary p-4">
            <DataRow label="Price per token (µALEO)" value={currentPrice.toLocaleString()} border={false} />
            <DataRow
              label="Total cost (µALEO)"
              value={<span className="font-semibold text-primary">{totalCost.toLocaleString()}</span>}
              border={false}
            />
            {mode === "private" && selectedRecord && (
              <DataRow
                label="Change returned"
                value={(selectedRecord.microcredits - totalCost).toLocaleString()}
                border={false}
              />
            )}
          </div>
        )}

        {tx.error && <Alert variant="error" title="Transaction failed">{tx.error}</Alert>}

        <TransactionButton
          onClick={handleBid}
          txStatus={tx.status}
          disabled={!!validation}
          className="w-full"
        >
          {validation || `Place ${mode === "private" ? "Private" : "Public"} Bid`}
        </TransactionButton>
      </div>
    </Card>
  );
}
