import { useState, useMemo, useEffect } from "react";
import { useWallet } from "@demox-labs/aleo-wallet-adapter-react";
import {
  Transaction,
  WalletAdapterNetwork,
} from "@demox-labs/aleo-wallet-adapter-base";
import { useAuction } from "@/features/auction/hooks/useAuction";
import { StatusBadge } from "@/features/auction/components/StatusBadge";
import { useBlockHeight } from "@/shared/hooks/useBlockHeight";
import { TransactionButton } from "@/shared/components/TransactionButton";
import { Card } from "@/shared/components/ui/Card";
import { Input } from "@/shared/components/ui/Input";
import { Button } from "@/shared/components/ui/Button";
import { Alert } from "@/shared/components/ui/Alert";
import { DataRow } from "@/shared/components/ui/DataRow";
import { PageHeader } from "@/shared/components/ui/PageHeader";
import { Spinner } from "@/shared/components/ui/Spinner";
import { getCreatorWithdrawn, getUnsoldWithdrawn } from "@/shared/lib/mappings";
import { PROGRAM_ID, FEE } from "@/constants";

export function CreatorDashboardPage() {
  const { publicKey, requestTransaction } = useWallet();
  const { blockHeight } = useBlockHeight();
  const [auctionIdInput, setAuctionIdInput] = useState("");
  const [auctionId, setAuctionId] = useState<string | undefined>();
  const { config, state, loading, error, refetch } = useAuction(auctionId);

  const [withdrawn, setWithdrawn] = useState(0n);
  const [unsoldWithdrawn, setUnsoldWithdrawn] = useState(0n);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [unsoldAmount, setUnsoldAmount] = useState("");
  const [txLoading, setTxLoading] = useState<string | null>(null);
  const [txError, setTxError] = useState<string | null>(null);
  const [txSuccess, setTxSuccess] = useState<string | null>(null);

  const status = useMemo(() => {
    if (!config || !state) return "upcoming" as const;
    if (state.cleared) return "cleared" as const;
    if (state.supply_met) return "supply_met" as const;
    if (blockHeight >= config.end_block) return "ended" as const;
    if (blockHeight >= config.start_block) return "active" as const;
    return "upcoming" as const;
  }, [config, state, blockHeight]);

  // Fetch withdrawal amounts
  useEffect(() => {
    if (!auctionId) return;
    getCreatorWithdrawn(auctionId).then((raw) => {
      if (raw) setWithdrawn(BigInt(raw.replace("u128", "")));
    });
    getUnsoldWithdrawn(auctionId).then((raw) => {
      if (raw) setUnsoldWithdrawn(BigInt(raw.replace("u128", "")));
    });
  }, [auctionId, txSuccess]);

  const canClose = (status === "supply_met" || status === "ended") && !state?.cleared;
  const maxWithdrawable = state?.cleared ? state.creator_revenue - withdrawn : 0n;
  const unsoldSupply = config && state ? config.supply - state.total_committed : 0n;
  const maxUnsold = state?.cleared ? unsoldSupply - unsoldWithdrawn : 0n;

  const executeTx = async (fn: string, inputs: string[], label: string) => {
    if (!publicKey || !requestTransaction) return;
    setTxLoading(label);
    setTxError(null);
    setTxSuccess(null);
    try {
      const tx = Transaction.createTransaction(
        publicKey,
        WalletAdapterNetwork.TestnetBeta,
        PROGRAM_ID,
        fn,
        inputs,
        FEE,
      );
      await requestTransaction(tx);
      setTxSuccess(label);
      refetch();
    } catch (e) {
      setTxError(e instanceof Error ? e.message : "Transaction failed");
    } finally {
      setTxLoading(null);
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-8 animate-fade-in">
      <PageHeader
        title="Creator Dashboard"
        description="Manage your auctions \u2014 close, withdraw payments, recover unsold tokens."
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
        <Button onClick={() => setAuctionId(auctionIdInput.trim())} size="lg">
          Load
        </Button>
      </div>

      {loading && <Spinner center size="lg" />}

      {error && <p className="text-sm text-destructive">{error}</p>}

      {config && state && (
        <div className="space-y-6">
          {/* Status */}
          <div className="flex items-center gap-3">
            <StatusBadge status={status} />
            <span className="font-mono text-xs text-muted-foreground">{config.auction_id}</span>
          </div>

          {/* Revenue summary */}
          {state.cleared && (
            <Card variant="gradient" padding="sm">
              <h4 className="mb-3 font-semibold text-foreground">Revenue Summary</h4>
              <div className="grid grid-cols-2 gap-4">
                <DataRow label="Total Revenue" value={<span className="text-xl font-bold text-primary">{state.creator_revenue.toLocaleString()}</span>} border={false} />
                <DataRow label="Clearing Price" value={<span className="text-xl font-bold text-foreground">{state.clearing_price.toLocaleString()}</span>} border={false} />
                <DataRow label="Withdrawn" value={withdrawn.toLocaleString()} border={false} />
                <DataRow label="Remaining" value={<span className="font-medium text-success">{maxWithdrawable.toLocaleString()}</span>} border={false} />
              </div>
            </Card>
          )}

          {/* Close Auction */}
          {canClose && (
            <Card padding="sm">
              <h4 className="mb-3 font-semibold text-foreground">Close Auction</h4>
              <p className="mb-4 text-sm text-muted-foreground">
                {state.supply_met
                  ? "Supply has been met. Close to set the clearing price."
                  : "Auction has passed its end block. Close to finalize at floor price."}
              </p>
              <TransactionButton
                onClick={() => executeTx("close_auction", [config.auction_id], "close")}
                loading={txLoading === "close"}
                loadingText="Closing..."
                variant="accent"
              >
                Close Auction
              </TransactionButton>
            </Card>
          )}

          {/* Withdraw Payments */}
          {state.cleared && maxWithdrawable > 0n && (
            <Card padding="sm">
              <div className="space-y-4">
                <h4 className="font-semibold text-foreground">Withdraw Payments</h4>
                <p className="text-sm text-muted-foreground">
                  Max withdrawable: {maxWithdrawable.toLocaleString()}
                </p>
                <Input
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value.replace(/[^0-9]/g, ""))}
                  placeholder={`Up to ${maxWithdrawable.toLocaleString()}`}
                />
                <TransactionButton
                  onClick={() => executeTx(
                    "withdraw_payments",
                    [config.auction_id, `${paymentAmount}u128`, config.payment_token_id],
                    "withdraw_payments",
                  )}
                  loading={txLoading === "withdraw_payments"}
                  loadingText="Withdrawing..."
                  disabled={!paymentAmount || BigInt(paymentAmount || "0") <= 0n}
                  variant="success"
                >
                  Withdraw Payments
                </TransactionButton>
              </div>
            </Card>
          )}

          {/* Withdraw Unsold */}
          {state.cleared && maxUnsold > 0n && (
            <Card padding="sm">
              <div className="space-y-4">
                <h4 className="font-semibold text-foreground">Withdraw Unsold Tokens</h4>
                <p className="text-sm text-muted-foreground">
                  Unsold supply: {maxUnsold.toLocaleString()}
                </p>
                <Input
                  value={unsoldAmount}
                  onChange={(e) => setUnsoldAmount(e.target.value.replace(/[^0-9]/g, ""))}
                  placeholder={`Up to ${maxUnsold.toLocaleString()}`}
                />
                <TransactionButton
                  onClick={() => executeTx(
                    "withdraw_unsold",
                    [config.auction_id, `${unsoldAmount}u128`, config.sale_token_id],
                    "withdraw_unsold",
                  )}
                  loading={txLoading === "withdraw_unsold"}
                  loadingText="Withdrawing..."
                  disabled={!unsoldAmount || BigInt(unsoldAmount || "0") <= 0n}
                  variant="warning"
                >
                  Withdraw Unsold
                </TransactionButton>
              </div>
            </Card>
          )}

          {txError && <p className="text-sm text-destructive">{txError}</p>}
          {txSuccess && (
            <Alert variant="success" title="Transaction submitted successfully!" />
          )}
        </div>
      )}
    </div>
  );
}
