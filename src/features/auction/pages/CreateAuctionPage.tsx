import { useState, useMemo, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { CheckCircle2 } from "lucide-react";
import { useBlockHeight } from "@/shared/hooks/useBlockHeight";
import { useRecords } from "@/shared/hooks/useRecords";
import { useTransaction } from "@/shared/hooks/useTransaction";
import { useLocalStorage } from "@/shared/hooks/useLocalStorage";
import { TokenRecordSelector } from "@/shared/components/RecordSelector";
import { TransactionButton } from "@/shared/components/TransactionButton";
import { Card } from "@/shared/components/ui/Card";
import { Input } from "@/shared/components/ui/Input";
import { Select } from "@/shared/components/ui/Select";
import { PageHeader } from "@/shared/components/ui/PageHeader";
import { PriceChart } from "../components/PriceChart";
import type { AuctionConfig, TokenRecord } from "@/shared/types/auction";
import { TestPaymentTokens, TestAuctionTokens } from "@/constants";

const paymentTokenOptions = TestPaymentTokens.map((t) => ({
  value: t.tokenId,
  label: `${t.name} (${t.symbol})`,
}));

const saleTokenOptions = TestAuctionTokens.map((t) => ({
  value: t.tokenId,
  label: `${t.name} (${t.symbol})`,
}));

// startBlock intentionally excluded — it must always reflect the live chain height
interface FormState {
  paymentTokenId: string;
  startPrice: string;
  floorPrice: string;
  endBlock: string;
  priceDecayBlocks: string;
  priceDecayAmount: string;
  maxBidAmount: string;
  minBidAmount: string;
}

const defaultForm: FormState = {
  paymentTokenId: "",
  startPrice: "",
  floorPrice: "",
  endBlock: "",
  priceDecayBlocks: "",
  priceDecayAmount: "",
  maxBidAmount: "0",
  minBidAmount: "1",
};

export function CreateAuctionPage() {
  const navigate = useNavigate();
  const { blockHeight } = useBlockHeight();
  const { tokenRecords, fetchRecords } = useRecords();
  const [saleTokenTypeId, setSaleTokenTypeId] = useLocalStorage("auction-draft-saleTokenType", "");
  const [form, setForm, clearDraft] = useLocalStorage<FormState>("auction-draft-form", defaultForm);

  // startBlock lives in local state only — never persisted so it stays current
  const [startBlock, setStartBlock] = useState("");
  const [selectedToken, setSelectedToken] = useState<TokenRecord | null>(null);
  const [submittedTxId, setSubmittedTxId] = useState<string | null>(null);

  const { execute, loading, status, error } = useTransaction();

  useEffect(() => { fetchRecords(); }, [fetchRecords]);

  // Always keep startBlock at blockHeight + 50 unless the user has edited it
  useEffect(() => {
    if (blockHeight > 0) {
      setStartBlock((prev) => {
        // Only auto-update if user hasn't typed a custom value yet
        if (!prev) return String(blockHeight + 50);
        return prev;
      });
    }
  }, [blockHeight]);

  const update = (key: keyof FormState) => (val: string) =>
    setForm((prev) => ({ ...prev, [key]: val }));

  const handleSaleTokenTypeChange = (tokenId: string) => {
    setSaleTokenTypeId(tokenId);
    setSelectedToken(null);
  };

  const handleClearDraft = () => {
    clearDraft();
    setSaleTokenTypeId("");
    setSelectedToken(null);
    setStartBlock("");
  };

  // Build preview config for price chart
  const previewConfig = useMemo<AuctionConfig | null>(() => {
    try {
      const startPrice = BigInt(form.startPrice || "0");
      const floorPrice = BigInt(form.floorPrice || "0");
      const sb = Number(startBlock || "0");
      const endBlock = Number(form.endBlock || "0");
      const priceDecayBlocks = Number(form.priceDecayBlocks || "0");
      const priceDecayAmount = BigInt(form.priceDecayAmount || "0");
      if (
        startPrice <= floorPrice ||
        endBlock <= sb ||
        priceDecayBlocks <= 0 ||
        priceDecayAmount <= 0n
      ) return null;
      return {
        auction_id: "preview",
        creator: "",
        sale_token_id: "",
        payment_token_id: "",
        supply: selectedToken ? selectedToken.amount : 0n,
        start_price: startPrice,
        floor_price: floorPrice,
        start_block: sb,
        end_block: endBlock,
        price_decay_blocks: priceDecayBlocks,
        price_decay_amount: priceDecayAmount,
        max_bid_amount: BigInt(form.maxBidAmount || "0"),
        min_bid_amount: BigInt(form.minBidAmount || "1"),
      };
    } catch {
      return null;
    }
  }, [form, startBlock, selectedToken]);

  const validation = useMemo(() => {
    if (!saleTokenTypeId) return "Select a sale token type";
    if (!selectedToken) return "Select a sale token record to deposit";
    if (!form.paymentTokenId) return "Select a payment token";
    if (!form.startPrice || BigInt(form.startPrice || "0") <= 0n) return "Enter start price";
    if (!form.floorPrice || BigInt(form.floorPrice || "0") <= 0n) return "Enter floor price";
    if (BigInt(form.startPrice) <= BigInt(form.floorPrice)) return "Start price must exceed floor price";
    const sb = Number(startBlock || "0");
    const endBlock = Number(form.endBlock || "0");
    if (sb <= 0) return "Enter start block";
    if (endBlock <= sb) return "End block must exceed start block";
    if (Number(form.priceDecayBlocks || "0") <= 0) return "Enter decay interval";
    if (BigInt(form.priceDecayAmount || "0") <= 0n) return "Enter decay amount";
    if (BigInt(form.minBidAmount || "0") <= 0n) return "Enter minimum bid amount";
    return null;
  }, [selectedToken, form, saleTokenTypeId, startBlock]);

  const handleCreate = async () => {
    if (!selectedToken || validation) return;
    const txId = await execute("create_auction", [
      selectedToken._record,
      form.paymentTokenId,
      `${form.startPrice}u128`,
      `${form.floorPrice}u128`,
      `${startBlock}u32`,
      `${form.endBlock}u32`,
      `${form.priceDecayBlocks}u32`,
      `${form.priceDecayAmount}u128`,
      `${form.maxBidAmount || "0"}u128`,
      `${form.minBidAmount}u128`,
    ]);
    if (txId) {
      clearDraft();
      setSaleTokenTypeId("");
      setSubmittedTxId(txId);
    }
  };

  // ── Success state — inline within the same layout ─────────────────────────
  if (submittedTxId) {
    return (
      <div className="mx-auto max-w-3xl space-y-8 animate-fade-in">
        <PageHeader title="Create Auction" description="Configure and launch a new Dutch auction." />
        <Card>
          <div className="flex flex-col items-center gap-6 py-8 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-success/10">
              <CheckCircle2 className="h-8 w-8 text-success" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-foreground">Auction Submitted!</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Your transaction is confirming on-chain. The auction will appear once finalized.
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => navigate("/creator")}
                className="rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white transition-all hover:opacity-90"
              >
                View My Auctions
              </button>
              <button
                onClick={() => {
                  setSubmittedTxId(null);
                  setSelectedToken(null);
                  setStartBlock("");
                }}
                className="rounded-xl border border-border bg-card px-5 py-2.5 text-sm font-semibold text-foreground transition-all hover:bg-secondary"
              >
                Create Another
              </button>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  const hasDraft =
    saleTokenTypeId !== "" ||
    (Object.keys(defaultForm) as (keyof FormState)[]).some(
      (k) => form[k] !== defaultForm[k]
    );

  return (
    <div className="mx-auto max-w-3xl space-y-8 animate-fade-in">
      <PageHeader
        title="Create Auction"
        description="Configure and launch a new Dutch auction."
        action={
          hasDraft ? (
            <button
              onClick={handleClearDraft}
              className="text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground"
            >
              Clear draft
            </button>
          ) : undefined
        }
      />

      <Card>
        <div className="space-y-6">
          {/* Sale Token — pick type first, then pick the wallet record */}
          <Select
            label="Sale Token Type"
            value={saleTokenTypeId}
            onChange={(e) => handleSaleTokenTypeChange(e.target.value)}
            options={saleTokenOptions}
            placeholder="Select sale token type…"
            hint="The token you are auctioning off"
          />
          {saleTokenTypeId && (
            <>
              <TokenRecordSelector
                records={tokenRecords}
                selected={selectedToken}
                onSelect={setSelectedToken}
                label="Sale Token Record (deposited into escrow)"
                filterTokenId={saleTokenTypeId}
              />
              {!tokenRecords.some((r) => r.token_id === saleTokenTypeId && !r.spent) && (
                <p className="text-xs text-muted-foreground">
                  No records for this token?{" "}
                  <Link to="/faucet" className="text-primary hover:underline">
                    Mint some from the faucet.
                  </Link>
                </p>
              )}
            </>
          )}

          <Select
            label="Payment Token"
            value={form.paymentTokenId}
            onChange={(e) => update("paymentTokenId")(e.target.value)}
            options={paymentTokenOptions}
            placeholder="Select payment token…"
            hint="Token that bidders will pay with"
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Start Price" value={form.startPrice} onChange={(e) => update("startPrice")(e.target.value)} placeholder="e.g. 1000" />
            <Input label="Floor Price" value={form.floorPrice} onChange={(e) => update("floorPrice")(e.target.value)} placeholder="e.g. 100" />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Start Block"
              value={startBlock}
              onChange={(e) => setStartBlock(e.target.value.replace(/[^0-9]/g, ""))}
              placeholder={blockHeight > 0 ? `Current: ${blockHeight}` : "Loading…"}
              hint="Not saved in draft — always reflects current chain height"
            />
            <Input label="End Block" value={form.endBlock} onChange={(e) => update("endBlock")(e.target.value)} placeholder="e.g. 10000" />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Decay Interval (blocks)" value={form.priceDecayBlocks} onChange={(e) => update("priceDecayBlocks")(e.target.value)} placeholder="e.g. 100" hint="Price drops every N blocks" />
            <Input label="Decay Amount" value={form.priceDecayAmount} onChange={(e) => update("priceDecayAmount")(e.target.value)} placeholder="e.g. 10" hint="How much price drops each step" />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Min Bid Amount" value={form.minBidAmount} onChange={(e) => update("minBidAmount")(e.target.value)} placeholder="e.g. 1" />
            <Input label="Max Bid Amount" value={form.maxBidAmount} onChange={(e) => update("maxBidAmount")(e.target.value)} placeholder="0 = unlimited" hint="Per-bidder cap (0 = no limit)" />
          </div>
        </div>
      </Card>

      {/* Price preview */}
      {previewConfig && (
        <div>
          <h3 className="mb-3 text-lg font-semibold text-foreground">Price Preview</h3>
          <PriceChart config={previewConfig} currentBlock={blockHeight} currentPrice={null} />
        </div>
      )}

      {error && <p className="text-sm text-destructive">{error}</p>}

      <TransactionButton
        onClick={handleCreate}
        txStatus={status}
        loading={loading}
        disabled={!!validation}
        className="w-full"
      >
        {validation || "Create Auction"}
      </TransactionButton>
    </div>
  );
}
