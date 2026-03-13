import type { AuctionConfig, AuctionState } from "@/shared/types/auction";
import { useTokenMetadata } from "@/shared/hooks/useTokenMetadata";
import { formatTokenAmount } from "@/shared/utils/formatting";
import { CopyField } from "@/shared/components/CopyField";
import { Card } from "@/shared/components/ui/Card";
import { DataRow } from "@/shared/components/ui/DataRow";
import { ProgressBar } from "@/shared/components/ui/ProgressBar";

interface Props {
  config: AuctionConfig;
  state: AuctionState | null;
  blockHeight: number;
}

/** Inline badge: [SYMBOL] Name */
function TokenLabel({ symbol, name, fallbackId }: { symbol?: string | null; name?: string | null; fallbackId: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      {symbol && (
        <span className="rounded-md bg-primary/10 px-1.5 py-0.5 text-xs font-semibold text-primary">
          {symbol}
        </span>
      )}
      <span className="truncate">{name ?? fallbackId.slice(0, 16) + "…"}</span>
    </span>
  );
}

export function AuctionInfo({ config, state, blockHeight }: Props) {
  const { metadataMap } = useTokenMetadata(
    [config.sale_token_id, config.payment_token_id].filter(Boolean),
  );

  const saleMeta = metadataMap.get(config.sale_token_id);
  const payMeta = metadataMap.get(config.payment_token_id);

  const saleSymbol = saleMeta?.symbolStr ?? null;
  const paySymbol = payMeta?.symbolStr ?? null;

  const fmtSale = (v: bigint) => formatTokenAmount(v, saleMeta);
  const fmtPay = (v: bigint) => formatTokenAmount(v, payMeta);

  const demandPercent = state && config.supply > 0n
    ? Number((state.total_committed * 100n) / config.supply)
    : 0;

  const timePercent = blockHeight > 0 && blockHeight < config.end_block
    ? ((blockHeight - config.start_block) / (config.end_block - config.start_block)) * 100
    : 0;

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Config */}
      <Card padding="sm">
        <h4 className="mb-4 font-semibold text-foreground">Configuration</h4>
        <CopyField label="Auction ID" value={config.auction_id} />
        <div className="mt-3">
          <CopyField label="Creator" value={config.creator} />
        </div>
        <div className="mt-4">
          <DataRow label="Sale Token" value={<TokenLabel symbol={saleMeta?.symbolStr} name={saleMeta?.nameStr} fallbackId={config.sale_token_id} />} />
          <DataRow label="Payment Token" value={<TokenLabel symbol={payMeta?.symbolStr} name={payMeta?.nameStr} fallbackId={config.payment_token_id} />} />
          <DataRow label="Supply" value={<>{fmtSale(config.supply)}{saleSymbol && <span className="ml-1 text-xs text-muted-foreground">{saleSymbol}</span>}</>} />
          <DataRow label="Start Price" value={<>{fmtPay(config.start_price)}{paySymbol && <span className="ml-1 text-xs text-muted-foreground">{paySymbol}</span>}</>} />
          <DataRow label="Floor Price" value={<>{fmtPay(config.floor_price)}{paySymbol && <span className="ml-1 text-xs text-muted-foreground">{paySymbol}</span>}</>} />
          <DataRow label="Start Block" value={config.start_block.toLocaleString()} />
          <DataRow label="End Block" value={config.end_block.toLocaleString()} />
          <DataRow label="Decay Interval" value={`${config.price_decay_blocks} blocks`} />
          <DataRow label="Decay Amount" value={<>{fmtPay(config.price_decay_amount)}{paySymbol && <span className="ml-1 text-xs text-muted-foreground">{paySymbol}</span>}</>} />
          <DataRow label="Min Bid" value={<>{fmtSale(config.min_bid_amount)}{saleSymbol && <span className="ml-1 text-xs text-muted-foreground">{saleSymbol}</span>}</>} />
          <DataRow label="Max Bid" value={config.max_bid_amount === 0n ? "Unlimited" : <>{fmtSale(config.max_bid_amount)}{saleSymbol && <span className="ml-1 text-xs text-muted-foreground">{saleSymbol}</span>}</>} />
        </div>
      </Card>

      {/* State */}
      <Card padding="sm">
        <h4 className="mb-4 font-semibold text-foreground">Live State</h4>
        {state ? (
          <>
            <DataRow label="Total Committed" value={<>{fmtSale(state.total_committed)}{saleSymbol && <span className="ml-1 text-xs text-muted-foreground">{saleSymbol}</span>}</>} />
            <DataRow label="Total Payments" value={<>{fmtPay(state.total_payments)}{paySymbol && <span className="ml-1 text-xs text-muted-foreground">{paySymbol}</span>}</>} />
            <DataRow label="Supply Met" value={state.supply_met ? "Yes" : "No"} />
            <DataRow label="Cleared" value={state.cleared ? "Yes" : "No"} />
            {state.cleared && (
              <>
                <DataRow label="Clearing Price" value={<>{fmtPay(state.clearing_price)}{paySymbol && <span className="ml-1 text-xs text-muted-foreground">{paySymbol}</span>}</>} />
                <DataRow label="Creator Revenue" value={<>{fmtPay(state.creator_revenue)}{paySymbol && <span className="ml-1 text-xs text-muted-foreground">{paySymbol}</span>}</>} />
              </>
            )}
            {state.supply_met && state.ended_at_block > 0 && (
              <DataRow label="Ended at Block" value={state.ended_at_block.toLocaleString()} />
            )}

            <ProgressBar
              value={Math.min(100, demandPercent)}
              variant="primary"
              label="Demand"
              detail={`${fmtSale(state.total_committed)} / ${fmtSale(config.supply)}${saleSymbol ? ` ${saleSymbol}` : ""}`}
              className="mt-4"
            />

            {blockHeight > 0 && blockHeight < config.end_block && (
              <ProgressBar
                value={Math.min(100, timePercent)}
                variant="warning"
                label="Time Progress"
                detail={`${config.end_block - blockHeight} blocks remaining`}
                className="mt-3"
              />
            )}
          </>
        ) : (
          <p className="text-sm text-muted-foreground">Loading state...</p>
        )}
      </Card>
    </div>
  );
}
