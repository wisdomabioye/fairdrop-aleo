import { useMemo } from "react";
import type { AuctionConfig, AuctionStatus } from "@/shared/types/auction";
import { computeCurrentPrice } from "../utils/price";

export function useCurrentPrice(
  config: AuctionConfig | null,
  blockHeight: number,
) {
  const price = useMemo(() => {
    if (!config || blockHeight === 0) return null;
    return computeCurrentPrice(config, blockHeight);
  }, [config, blockHeight]);

  const status: AuctionStatus = useMemo(() => {
    if (!config) return "upcoming";
    if (blockHeight < config.start_block) return "upcoming";
    if (blockHeight >= config.end_block) return "ended";
    // Check ending soon: within 10% of remaining blocks
    const totalBlocks = config.end_block - config.start_block;
    const remaining = config.end_block - blockHeight;
    if (remaining < totalBlocks * 0.1) return "ending";
    return "active";
  }, [config, blockHeight]);

  return { price, status };
}
