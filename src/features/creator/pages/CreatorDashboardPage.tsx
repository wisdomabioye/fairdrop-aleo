import { useState, useMemo, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useTransaction } from "@/shared/hooks/useTransaction";
import { useTokenMetadata } from "@/shared/hooks/useTokenMetadata";
import { useAuction } from "@/features/auction/hooks/useAuction";
import { StatusBadge } from "@/features/auction/components/StatusBadge";
import { useBlockHeight } from "@/shared/hooks/useBlockHeight";
import { TransactionButton } from "@/shared/components/TransactionButton";
import { RevenuePanel } from "../components/RevenuePanel";
import { Card } from "@/shared/components/ui/Card";
import { Input } from "@/shared/components/ui/Input";
import { Button } from "@/shared/components/ui/Button";
import { PageHeader } from "@/shared/components/ui/PageHeader";
import { Spinner } from "@/shared/components/ui/Spinner";
import { getCreatorWithdrawn, getUnsoldWithdrawn } from "@/shared/lib/mappings";

export function CreatorDashboardPage() {
  const { blockHeight } = useBlockHeight();
  const [searchParams] = useSearchParams();
  const idFromUrl = searchParams.get("id") ?? "";
  const [auctionIdInput, setAuctionIdInput] = useState(idFromUrl);
  const [auctionId, setAuctionId] = useState<string | undefined>(idFromUrl || undefined);
  const { config, state, loading, error } = useAuction(auctionId);

  const { metadata: saleMeta } = useTokenMetadata(config?.sale_token_id);
  const { metadata: payMeta } = useTokenMetadata(config?.payment_token_id);
  const saleSymbol = saleMeta?.symbolStr ?? null;
  const paySymbol = payMeta?.symbolStr ?? null;

  const [withdrawn, setWithdrawn]           = useState(0n);
  const [unsoldWithdrawn, setUnsoldWithdrawn] = useState(0n);
  const [paymentAmount, setPaymentAmount]   = useState("");
  const [unsoldAmount, setUnsoldAmount]     = useState("");

  // Refetch withdrawn amounts whenever any tx confirms
  const [refetchKey, setRefetchKey] = useState(0);
  const refetch = () => setRefetchKey((k) => k + 1);

  const closeTx    = useTransaction({ label: "Close Auction", onConfirmed: refetch });
  const withdrawTx = useTransaction({ label: "Withdraw Payments", onConfirmed: refetch });
  const unsoldTx   = useTransaction({ label: "Withdraw Unsold", onConfirmed: refetch });

  const status = useMemo(() => {
    if (!config || !state) return "upcoming" as const;
    if (state.cleared) return "cleared" as const;
    if (state.supply_met) return "supply_met" as const;
    if (blockHeight >= config.end_block) return "ended" as const;
    if (blockHeight >= config.start_block) return "active" as const;
    return "upcoming" as const;
  }, [config, state, blockHeight]);

  useEffect(() => {
    if (!auctionId) return;
    getCreatorWithdrawn(auctionId).then((raw) => {
      if (raw) setWithdrawn(BigInt(raw.replace(/u128$/, "")));
    });
    getUnsoldWithdrawn(auctionId).then((raw) => {
      if (raw) setUnsoldWithdrawn(BigInt(raw.replace(/u128$/, "")));
    });
  }, [auctionId, refetchKey]);

  const canClose        = (status === "supply_met" || status === "ended") && !state?.cleared;
  const unsoldSupply    = config && state ? config.supply - state.total_committed : 0n;
  const maxWithdrawable = state?.cleared ? state.creator_revenue - withdrawn : 0n;
  const maxUnsold       = state?.cleared ? unsoldSupply - unsoldWithdrawn : 0n;

  return (
    <div className="mx-auto max-w-2xl space-y-8 animate-fade-in">
      <PageHeader
        title="Creator Dashboard"
        description="Manage your auctions — close, withdraw payments, recover unsold tokens."
      />

      {/* Auction lookup */}
      <div className="flex gap-3">
        <div className="flex-1">
          <Input
            value={auctionIdInput}
            onChange={(e) => setAuctionIdInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && setAuctionId(auctionIdInput.trim())}
            placeholder="Enter your auction ID"
          />
        </div>
        <Button onClick={() => setAuctionId(auctionIdInput.trim())} size="lg">Load</Button>
      </div>

      {loading && <Spinner center size="lg" />}
      {error && <p className="text-sm text-destructive">{error}</p>}

      {config && state && (
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <StatusBadge status={status} />
            <span className="font-mono text-xs text-muted-foreground">{config.auction_id}</span>
          </div>

          <RevenuePanel
            auctionId={config.auction_id}
            config={config}
            state={state}
            refetchTrigger={refetchKey > 0 ? String(refetchKey) : null}
          />

          {/* Close Auction */}
          <Card padding="sm">
            <h4 className="mb-3 font-semibold text-foreground">Close Auction</h4>
            {canClose ? (
              <>
                <p className="mb-4 text-sm text-muted-foreground">
                  {state.supply_met
                    ? "Supply has been met. Close to lock the clearing price."
                    : "Auction has passed its end block. Close to finalize at floor price."}
                </p>
                <TransactionButton
                  onClick={() => closeTx.execute("close_auction", [config.auction_id])}
                  txStatus={closeTx.status}
                  loadingText="Closing..."
                  variant="accent"
                >
                  Close Auction
                </TransactionButton>
              </>
            ) : state.cleared ? (
              <p className="text-sm text-muted-foreground">
                Closed at clearing price{" "}
                <span className="font-medium text-foreground">
                  {state.clearing_price.toLocaleString()}
                  {paySymbol && <span className="ml-1 text-xs text-muted-foreground">{paySymbol}</span>}
                </span>.
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">
                {status === "upcoming"
                  ? `Available once auction starts at block ${config.start_block.toLocaleString()}.`
                  : `Available once supply is met or auction passes block ${config.end_block.toLocaleString()}.`}
              </p>
            )}
            {closeTx.error && <p className="mt-2 text-sm text-destructive">{closeTx.error}</p>}
          </Card>

          {/* Withdraw Payments */}
          <Card padding="sm">
            <h4 className="mb-3 font-semibold text-foreground">Withdraw Payments</h4>
            {state.cleared && maxWithdrawable > 0n ? (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Max withdrawable:{" "}
                  <span className="font-medium text-foreground">
                    {maxWithdrawable.toLocaleString()}
                    {paySymbol && <span className="ml-1 text-xs text-muted-foreground">{paySymbol}</span>}
                  </span>
                </p>
                <Input
                  label={paySymbol ? `Amount (${paySymbol})` : "Amount"}
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value.replace(/[^0-9]/g, ""))}
                  placeholder={`Up to ${maxWithdrawable.toLocaleString()}`}
                />
                <TransactionButton
                  onClick={() => withdrawTx.execute("withdraw_payments", [config.auction_id, `${paymentAmount}u128`])}
                  txStatus={withdrawTx.status}
                  loadingText="Withdrawing..."
                  disabled={!paymentAmount || BigInt(paymentAmount || "0") <= 0n}
                  variant="success"
                >
                  Withdraw Payments
                </TransactionButton>
              </div>
            ) : state.cleared ? (
              <p className="text-sm text-muted-foreground">All revenue has been withdrawn.</p>
            ) : (
              <p className="text-sm text-muted-foreground">Available after the auction is closed and cleared.</p>
            )}
            {withdrawTx.error && <p className="mt-2 text-sm text-destructive">{withdrawTx.error}</p>}
          </Card>

          {/* Withdraw Unsold */}
          <Card padding="sm">
            <h4 className="mb-3 font-semibold text-foreground">Withdraw Unsold Tokens</h4>
            {state.cleared && maxUnsold > 0n ? (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Unsold supply:{" "}
                  <span className="font-medium text-foreground">
                    {maxUnsold.toLocaleString()}
                    {saleSymbol && <span className="ml-1 text-xs text-muted-foreground">{saleSymbol}</span>}
                  </span>
                </p>
                <Input
                  label={saleSymbol ? `Amount (${saleSymbol})` : "Amount"}
                  value={unsoldAmount}
                  onChange={(e) => setUnsoldAmount(e.target.value.replace(/[^0-9]/g, ""))}
                  placeholder={`Up to ${maxUnsold.toLocaleString()}`}
                />
                <TransactionButton
                  onClick={() => unsoldTx.execute("withdraw_unsold", [config.auction_id, `${unsoldAmount}u128`, config.sale_token_id])}
                  txStatus={unsoldTx.status}
                  loadingText="Withdrawing..."
                  disabled={!unsoldAmount || BigInt(unsoldAmount || "0") <= 0n}
                  variant="warning"
                >
                  Withdraw Unsold
                </TransactionButton>
              </div>
            ) : state.cleared ? (
              <p className="text-sm text-muted-foreground">
                {config.supply === state.total_committed
                  ? "Supply fully sold — no unsold tokens."
                  : "All unsold tokens have been withdrawn."}
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">Available after the auction is closed.</p>
            )}
            {unsoldTx.error && <p className="mt-2 text-sm text-destructive">{unsoldTx.error}</p>}
          </Card>
        </div>
      )}
    </div>
  );
}
