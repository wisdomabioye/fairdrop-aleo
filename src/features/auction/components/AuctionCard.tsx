import { Link } from "react-router-dom";
import type { AuctionConfig, AuctionStatus } from "@/shared/types/auction";
import { StatusBadge } from "./StatusBadge";
import { formatField, formatAmount } from "@/shared/utils/formatting";
import { CREDITS_DECIMALS } from "@/shared/types/token";
import { AppRoutes } from "@/config/app.route";

interface Props {
  config: AuctionConfig;
  status: AuctionStatus;
  currentPrice: bigint | null;
}

export function AuctionCard({ config, status, currentPrice }: Props) {
  const isActive = status === "active" || status === "ending";

  return (
    <Link
      to={`${AppRoutes.auction}${config.auction_id}`}
      className={`block rounded-2xl border bg-card p-5 shadow-md-custom transition-all hover-lift ${
        isActive ? "border-primary/30 animate-glow" : "border-border"
      }`}
    >
      <div className="mb-3 flex items-center justify-between">
        <span className="font-mono text-xs text-muted-foreground">
          {formatField(config.auction_id)}
        </span>
        <StatusBadge status={status} />
      </div>

      <div className="mb-4 grid grid-cols-2 gap-3">
        <div>
          <p className="text-xs text-muted-foreground">Supply</p>
          <p className="text-lg font-semibold text-foreground">{config.supply.toLocaleString()}</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-muted-foreground">Current Price</p>
          <p className={`text-lg font-semibold ${isActive ? "text-primary animate-price-update" : "text-foreground"}`}>
            {currentPrice !== null ? `${formatAmount(currentPrice, CREDITS_DECIMALS)} ALEO` : "\u2014"}
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>Floor: {formatAmount(config.floor_price, CREDITS_DECIMALS)} ALEO</span>
        <span>Blocks: {config.start_block}–{config.end_block}</span>
      </div>
    </Link>
  );
}
