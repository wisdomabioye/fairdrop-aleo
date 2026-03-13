import { useState, useMemo, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { CheckCircle2 } from "lucide-react";
import { useBlockHeight } from "@/shared/hooks/useBlockHeight";
import { useTokenRecords } from "@/shared/hooks/useTokenRecords";
import { useCreatorTokens } from "@/shared/hooks/useCreatorTokens";
import { TokenPicker } from "@/shared/components/TokenPicker";
import { useTransaction } from "@/shared/hooks/useTransaction";
import { useLocalStorage } from "@/shared/hooks/useLocalStorage";
import { TokenRecordSelector } from "@/shared/components/RecordSelector";
import { TransactionButton } from "@/shared/components/TransactionButton";
import { Card } from "@/shared/components/ui/Card";
import { Input } from "@/shared/components/ui/Input";
import { Alert } from "@/shared/components/ui/Alert";
import { PageHeader } from "@/shared/components/ui/PageHeader";
import { Spinner } from "@/shared/components/ui/Spinner";
import { PriceChart } from "../components/PriceChart";
import { CREDITS_RESERVED_TOKEN_ID } from "@/shared/types/token";
import type { AuctionConfig } from "@/shared/types/auction";
import type { TokenRecord } from "@/shared/types/token";

// startBlock intentionally excluded — always reflects live chain height
interface FormState {
  saleTokenId: string;
  startPrice: string;
  floorPrice: string;
  endBlock: string;
  priceDecayBlocks: string;
  priceDecayAmount: string;
  maxBidAmount: string;
  minBidAmount: string;
}

const defaultForm: FormState = {
  saleTokenId: "",
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
  const { tokenRecords } = useTokenRecords();
  const { creatorTokens, loading: tokensLoading } = useCreatorTokens();
  const [form, setForm, clearDraft] = useLocalStorage<FormState>("auction-draft-form", defaultForm);
  const [startBlock, setStartBlock] = useState("");
  const [selectedRecord, setSelectedRecord] = useState<TokenRecord | null>(null);
  const [submittedTxId, setSubmittedTxId] = useState<string | null>(null);
  const { execute, status, error } = useTransaction({ label: "Create Auction" });

  useEffect(() => {
    if (blockHeight > 0) {
      setStartBlock((prev) => (!prev ? String(blockHeight + 50) : prev));
    }
  }, [blockHeight]);

  const update = (key: keyof FormState) => (val: string) =>
    setForm((prev) => ({ ...prev, [key]: val }));

  const handleClearDraft = () => {
    clearDraft();
    setStartBlock("");
    setSelectedRecord(null);
  };

  // Records in wallet matching the selected token type
  const eligibleRecords = tokenRecords.filter(
    (r) => r.token_id === form.saleTokenId && !r.spent,
  );

  const previewConfig = useMemo<AuctionConfig | null>(() => {
    try {
      const startPrice = BigInt(form.startPrice || "0");
      const floorPrice = BigInt(form.floorPrice || "0");
      const sb = Number(startBlock || "0");
      const endBlock = Number(form.endBlock || "0");
      const priceDecayBlocks = Number(form.priceDecayBlocks || "0");
      const priceDecayAmount = BigInt(form.priceDecayAmount || "0");
      const supply = selectedRecord?.amount ?? 0n;
      if (
        startPrice <= floorPrice ||
        endBlock <= sb ||
        priceDecayBlocks <= 0 ||
        priceDecayAmount <= 0n ||
        supply <= 0n
      ) return null;
      return {
        auction_id: "preview",
        creator: "",
        sale_token_id: form.saleTokenId,
        payment_token_id: CREDITS_RESERVED_TOKEN_ID,
        supply,
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
  }, [form, startBlock, selectedRecord]);

  const validation = useMemo(() => {
    if (!form.saleTokenId) return "Select a sale token";
    if (!selectedRecord) return "Select a token record to deposit";
    if (!form.startPrice || BigInt(form.startPrice || "0") <= 0n) return "Enter start price";
    if (!form.floorPrice || BigInt(form.floorPrice || "0") <= 0n) return "Enter floor price";
    if (BigInt(form.startPrice) <= BigInt(form.floorPrice)) return "Start price must exceed floor price";
    const sb = Number(startBlock || "0");
    if (sb <= 0) return "Enter start block";
    if (Number(form.endBlock || "0") <= sb) return "End block must exceed start block";
    if (Number(form.priceDecayBlocks || "0") <= 0) return "Enter decay interval";
    if (BigInt(form.priceDecayAmount || "0") <= 0n) return "Enter decay amount";
    if (BigInt(form.minBidAmount || "0") <= 0n) return "Enter minimum bid amount";
    return null;
  }, [form, selectedRecord, startBlock]);

  const handleCreate = async () => {
    if (validation || !selectedRecord) return;
    const txId = await execute("create_auction", [
      selectedRecord._record,               // private Token record — burned on-chain
      form.saleTokenId,
      CREDITS_RESERVED_TOKEN_ID,
      `${selectedRecord.amount}u128`,       // supply = full record amount
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
      setSelectedRecord(null);
      setSubmittedTxId(txId);
    }
  };

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
                onClick={() => { setSubmittedTxId(null); setStartBlock(""); }}
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

  const hasDraft = (Object.keys(defaultForm) as (keyof FormState)[]).some(
    (k) => form[k] !== defaultForm[k],
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
          {/* Step 1: Pick sale token type */}
          <div className="space-y-2">
            <p className="text-sm font-medium text-foreground">Sale Token</p>
            {tokensLoading ? (
              <Spinner size="sm" />
            ) : creatorTokens.length === 0 ? (
              <Alert variant="warning" title="No token records in wallet">
                Mint tokens first, then complete Token Launch Step 3 (Authorize) to grant
                SUPPLY_MANAGER_ROLE to the auction contract.{" "}
                <Link to="/token-launch" className="underline">Go to Token Launch.</Link>
              </Alert>
            ) : (
              <TokenPicker
                tokens={creatorTokens}
                selectedId={form.saleTokenId}
                onSelect={(id) => { update("saleTokenId")(id); setSelectedRecord(null); }}
              />
            )}
          </div>

          {/* Step 2: Pick the record to deposit — supply = record.amount */}
          {form.saleTokenId && (
            <>
              <TokenRecordSelector
                records={eligibleRecords}
                selected={selectedRecord}
                onSelect={setSelectedRecord}
                label="Token Record to Deposit (becomes auction supply)"
                filterTokenId={form.saleTokenId}
              />
              {selectedRecord && (
                <p className="text-xs text-muted-foreground">
                  Auction supply: <span className="font-medium text-foreground">{selectedRecord.amount.toLocaleString()} tokens</span>
                  {" — "}the record will be burned on-chain and re-minted to winners at claim time.
                </p>
              )}
              {eligibleRecords.length === 0 && (
                <p className="text-xs text-muted-foreground">
                  No records for this token.{" "}
                  <Link to="/token-launch" className="text-primary hover:underline">Mint some first.</Link>
                </p>
              )}
            </>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Start Price (µALEO)" value={form.startPrice} onChange={(e) => update("startPrice")(e.target.value.replace(/[^0-9]/g, ""))} placeholder="e.g. 1000000" hint="Microcredits per token at open" />
            <Input label="Floor Price (µALEO)" value={form.floorPrice} onChange={(e) => update("floorPrice")(e.target.value.replace(/[^0-9]/g, ""))} placeholder="e.g. 100000" hint="Minimum price, never drops below" />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Start Block"
              value={startBlock}
              onChange={(e) => setStartBlock(e.target.value.replace(/[^0-9]/g, ""))}
              placeholder={blockHeight > 0 ? `Current: ${blockHeight}` : "Loading…"}
              hint="Not saved in draft — always reflects current height"
            />
            <Input label="End Block" value={form.endBlock} onChange={(e) => update("endBlock")(e.target.value.replace(/[^0-9]/g, ""))} placeholder="e.g. 10000" />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Decay Interval (blocks)" value={form.priceDecayBlocks} onChange={(e) => update("priceDecayBlocks")(e.target.value.replace(/[^0-9]/g, ""))} placeholder="e.g. 100" hint="Price drops every N blocks" />
            <Input label="Decay Amount (µALEO)" value={form.priceDecayAmount} onChange={(e) => update("priceDecayAmount")(e.target.value.replace(/[^0-9]/g, ""))} placeholder="e.g. 10000" hint="µALEO reduction per step" />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Min Bid Amount" value={form.minBidAmount} onChange={(e) => update("minBidAmount")(e.target.value.replace(/[^0-9]/g, ""))} placeholder="e.g. 1" />
            <Input label="Max Bid Amount" value={form.maxBidAmount} onChange={(e) => update("maxBidAmount")(e.target.value.replace(/[^0-9]/g, ""))} placeholder="0 = unlimited" hint="Per-bidder cap (0 = no limit)" />
          </div>

          <Alert variant="info" title="Payment token">
            All bids are paid in ALEO Credits (private or public). Bidders choose their privacy level when placing bids.
          </Alert>
        </div>
      </Card>

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
        disabled={!!validation}
        className="w-full"
      >
        {validation || "Create Auction"}
      </TransactionButton>
    </div>
  );
}
