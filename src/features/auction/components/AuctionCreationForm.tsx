import { useState, useMemo, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { CheckCircle2 } from "lucide-react";
import { useBlockHeight } from "@/shared/hooks/useBlockHeight";
import { useTokenRecords } from "@/shared/hooks/useTokenRecords";
import { useCreatorTokens } from "@/shared/hooks/useCreatorTokens";
import { useTokenMetadata } from "@/shared/hooks/useTokenMetadata";
import { formatTokenAmount, parseTokenAmount } from "@/shared/utils/formatting";
import { TokenPicker } from "@/shared/components/TokenPicker";
import { useTransaction } from "@/shared/hooks/useTransaction";
import { useLocalStorage } from "@/shared/hooks/useLocalStorage";
import { TokenRecordSelector } from "@/shared/components/RecordSelector";
import { TransactionButton } from "@/shared/components/TransactionButton";
import { TokenAmountInput } from "@/shared/components/ui/TokenAmountInput";
import { Card } from "@/shared/components/ui/Card";
import { Input } from "@/shared/components/ui/Input";
import { Alert } from "@/shared/components/ui/Alert";
import { Spinner } from "@/shared/components/ui/Spinner";
import { PriceChart } from "./PriceChart";
import { CREDITS_RESERVED_TOKEN_ID, CREDITS_DECIMALS } from "@/shared/types/token";
import type { AuctionConfig } from "@/shared/types/auction";
import type { TokenRecord } from "@/shared/types/token";
import { AppRoutes } from "@/config/app.route";

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

interface AuctionCreationFormProps {
  address: string;
}

export function AuctionCreationForm({ address: _address }: AuctionCreationFormProps) {
  const navigate = useNavigate();
  const { blockHeight } = useBlockHeight();
  const { tokenRecords } = useTokenRecords();
  const { creatorTokens, loading: tokensLoading } = useCreatorTokens();
  const [form, setForm, clearDraft] = useLocalStorage<FormState>("auction-draft-v2", defaultForm);
  const [startBlock, setStartBlock] = useState("");
  const [selectedRecord, setSelectedRecord] = useState<TokenRecord | null>(null);
  const [submittedTxId, setSubmittedTxId] = useState<string | null>(null);
  const { execute, status, error } = useTransaction({ label: "Create Auction" });

  const { metadata: saleMeta } = useTokenMetadata(form.saleTokenId || undefined);
  const saleDecimals = saleMeta?.decimals ?? 0;
  const saleSymbol = saleMeta?.symbolStr ?? null;
  const fmtSale = (v: bigint) => formatTokenAmount(v, saleMeta);

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

  const eligibleRecords = tokenRecords.filter(
    (r) => r.token_id === form.saleTokenId && !r.spent,
  );

  const previewConfig = useMemo<AuctionConfig | null>(() => {
    try {
      const startPrice = parseTokenAmount(form.startPrice, CREDITS_DECIMALS);
      const floorPrice = parseTokenAmount(form.floorPrice, CREDITS_DECIMALS);
      const sb = Number(startBlock || "0");
      const endBlock = Number(form.endBlock || "0");
      const priceDecayBlocks = Number(form.priceDecayBlocks || "0");
      const priceDecayAmount = parseTokenAmount(form.priceDecayAmount, CREDITS_DECIMALS);
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
        max_bid_amount: parseTokenAmount(form.maxBidAmount, saleDecimals),
        min_bid_amount: parseTokenAmount(form.minBidAmount, saleDecimals),
      };
    } catch {
      return null;
    }
  }, [form, startBlock, selectedRecord, saleDecimals]);

  const validation = useMemo(() => {
    if (!form.saleTokenId) return "Select a sale token";
    if (!selectedRecord) return "Select a token record to deposit";
    const sp = parseTokenAmount(form.startPrice, CREDITS_DECIMALS);
    const fp = parseTokenAmount(form.floorPrice, CREDITS_DECIMALS);
    if (sp <= 0n) return "Enter start price";
    if (fp <= 0n) return "Enter floor price";
    if (sp <= fp) return "Start price must exceed floor price";
    const sb = Number(startBlock || "0");
    if (sb <= 0) return "Enter start block";
    if (Number(form.endBlock || "0") <= sb) return "End block must exceed start block";
    if (Number(form.priceDecayBlocks || "0") <= 0) return "Enter decay interval";
    if (parseTokenAmount(form.priceDecayAmount, CREDITS_DECIMALS) <= 0n) return "Enter decay amount";
    if (parseTokenAmount(form.minBidAmount, saleDecimals) <= 0n) return "Enter minimum bid amount";
    return null;
  }, [form, selectedRecord, startBlock, saleDecimals]);

  const handleCreate = async () => {
    if (validation || !selectedRecord) return;

    const auctionCreateParams = [
      selectedRecord._record,
      form.saleTokenId,
      CREDITS_RESERVED_TOKEN_ID,
      `${selectedRecord.amount}u128`,
      `${form.startPrice}u128`,
      `${form.floorPrice}u128`,
      `${startBlock}u32`,
      `${form.endBlock}u32`,
      `${form.priceDecayBlocks}u32`,
      `${form.priceDecayAmount}u128`,
      `${form.maxBidAmount}u128`,
      `${form.minBidAmount}u128`,
    ];
    console.log(auctionCreateParams);
    const txId = await execute("create_auction", auctionCreateParams);
    if (txId) {
      clearDraft();
      setSelectedRecord(null);
      setSubmittedTxId(txId);
    }
  };

  if (submittedTxId) {
    return (
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
              onClick={() => navigate(AppRoutes.myAuctions)}
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
    );
  }

  const hasDraft = (Object.keys(defaultForm) as (keyof FormState)[]).some(
    (k) => form[k] !== defaultForm[k],
  );

  return (
    <>
      {hasDraft && (
        <div className="flex justify-end">
          <button
            onClick={handleClearDraft}
            className="text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground"
          >
            Clear draft
          </button>
        </div>
      )}

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
                <Link to={AppRoutes.tokenLaunch} className="underline">Go to Token Launch.</Link>
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
          {(!tokensLoading && !!form.saleTokenId) && (
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
                  Auction supply: <span className="font-medium text-foreground">{fmtSale(selectedRecord.amount)} tokens</span>
                  {" — "}the record will be burned on-chain and re-minted to winners at claim time.
                </p>
              )}
              {eligibleRecords.length === 0 && (
                <p className="text-xs text-muted-foreground">
                  No records for this token.{" "}
                  <Link to={AppRoutes.tokenLaunch} className="text-primary hover:underline">Mint some first.</Link>
                </p>
              )}
            </>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <TokenAmountInput label="Start Price" value={form.startPrice} onChange={update("startPrice")} decimals={CREDITS_DECIMALS} symbol="ALEO" placeholder="e.g. 1.0" hint="ALEO per token at open" />
            <TokenAmountInput label="Floor Price" value={form.floorPrice} onChange={update("floorPrice")} decimals={CREDITS_DECIMALS} symbol="ALEO" placeholder="e.g. 0.1" hint="Minimum price, never drops below" />
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
            <TokenAmountInput label="Decay Amount" value={form.priceDecayAmount} onChange={update("priceDecayAmount")} decimals={CREDITS_DECIMALS} symbol="ALEO" placeholder="e.g. 0.01" hint="ALEO reduction per step" />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <TokenAmountInput label="Min Bid Amount" value={form.minBidAmount} onChange={update("minBidAmount")} decimals={saleDecimals} symbol={saleSymbol} placeholder="e.g. 1" />
            <TokenAmountInput label="Max Bid Amount" value={form.maxBidAmount} onChange={update("maxBidAmount")} decimals={saleDecimals} symbol={saleSymbol} placeholder="0 = unlimited" hint="Per-bidder cap (0 = no limit)" />
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
    </>
  );
}
