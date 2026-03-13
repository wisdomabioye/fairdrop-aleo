import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { Shield, Eye } from "lucide-react";
import type { AuctionConfig } from "@/shared/types/auction";
import type { CreditRecord } from "@/shared/types/token";
import { CREDITS_DECIMALS } from "@/shared/types/token";
import { useTransaction } from "@/shared/hooks/useTransaction";
import { useTokenMetadata } from "@/shared/hooks/useTokenMetadata";
import { formatTokenAmount, formatAmount, parseTokenAmount } from "@/shared/utils/formatting";
import { TransactionButton } from "@/shared/components/TransactionButton";
import { DropdownSelect } from "@/shared/components/ui/DropdownSelect";
import { TokenAmountInput } from "@/shared/components/ui/TokenAmountInput";
import { Card } from "@/shared/components/ui/Card";
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

  const { metadata: saleMeta } = useTokenMetadata(config.sale_token_id);
  const { metadata: payMeta } = useTokenMetadata(config.payment_token_id);
  const saleSymbol = saleMeta?.symbolStr ?? null;
  const paySymbol = payMeta?.symbolStr ?? null;
  const saleDecimals = saleMeta?.decimals ?? 0;

  const fmtSale = (v: bigint) => formatTokenAmount(v, saleMeta);
  const fmtPay = (v: bigint) => formatTokenAmount(v, payMeta);
  const fmtCredits = (v: bigint) => formatAmount(v, CREDITS_DECIMALS);

  const qty = parseTokenAmount(quantity, saleDecimals);
  const saleScale = 10n ** BigInt(saleDecimals);
  const totalCost = qty * currentPrice / saleScale;

  // payment_amount must fit in u64
  const paymentAmountU64 = totalCost <= 18446744073709551615n ? totalCost : 0n;

  const unspentRecords = creditRecords.filter((r) => !r.spent);

  const validation = useMemo(() => {
    if (qty <= 0n) return "Enter a quantity";
    if (qty < config.min_bid_amount) return `Minimum bid: ${fmtSale(config.min_bid_amount)}`;
    if (config.max_bid_amount > 0n && qty > config.max_bid_amount)
      return `Maximum bid: ${fmtSale(config.max_bid_amount)}`;
    if (mode === "private") {
      if (!selectedRecord) return "Select a credits record";
      if (selectedRecord.microcredits < totalCost) return "Insufficient credits in record";
    }
    return null;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [qty, config, mode, selectedRecord, totalCost, saleMeta]);

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

        <TokenAmountInput
          label="Quantity"
          value={quantity}
          onChange={setQuantity}
          decimals={saleDecimals}
          symbol={saleSymbol}
          placeholder={`Min: ${fmtSale(config.min_bid_amount)}`}
        />

        {/* Private: credit record selector */}
        {mode === "private" && (
          <DropdownSelect
            items={unspentRecords}
            selected={selectedRecord}
            getId={(r) => r.id}
            onSelect={setSelectedRecord}
            label="Credits Record"
            placeholder="Pick a credits record…"
            emptyText="No credits records found."
            emptyHint={
              <Link to="/faucet" className="text-xs text-primary hover:underline">
                Get credits from faucet.
              </Link>
            }
            renderTrigger={(r) => (
              <span className="text-sm font-medium text-foreground">
                {fmtCredits(r.microcredits)} ALEO
              </span>
            )}
            renderOption={(r) => (
              <span className="flex-1 text-sm">
                {fmtCredits(r.microcredits)} ALEO
              </span>
            )}
          />
        )}

        {qty > 0n && (
          <div className="rounded-xl bg-secondary p-4">
            <DataRow label={`Price per token${paySymbol ? ` (${paySymbol})` : ""}`} value={fmtPay(currentPrice)} border={false} />
            <DataRow
              label={`Total cost${paySymbol ? ` (${paySymbol})` : ""}`}
              value={<span className="font-semibold text-primary">{fmtPay(totalCost)}</span>}
              border={false}
            />
            {mode === "private" && selectedRecord && (
              <DataRow
                label="Change returned"
                value={`${fmtCredits(selectedRecord.microcredits - totalCost)} ALEO`}
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
