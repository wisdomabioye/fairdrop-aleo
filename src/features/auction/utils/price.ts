import type { AuctionConfig } from "@/shared/types/auction";

export function computeCurrentPrice(
  config: AuctionConfig,
  currentBlock: number,
): bigint {
  if (currentBlock < config.start_block) return config.start_price;
  if (currentBlock >= config.end_block) return config.floor_price;

  const blocksElapsed = currentBlock - config.start_block;
  const decaySteps = BigInt(Math.floor(blocksElapsed / config.price_decay_blocks));
  const totalDecay = decaySteps * config.price_decay_amount;
  const priceRange = config.start_price - config.floor_price;

  return totalDecay < priceRange
    ? config.start_price - totalDecay
    : config.floor_price;
}

export function computePriceCurve(
  config: AuctionConfig,
): Array<{ block: number; price: bigint }> {
  const points: Array<{ block: number; price: bigint }> = [];
  const totalBlocks = config.end_block - config.start_block;
  const steps = Math.min(totalBlocks, 200);
  const step = Math.max(1, Math.floor(totalBlocks / steps));

  for (let b = config.start_block; b <= config.end_block; b += step) {
    points.push({ block: b, price: computeCurrentPrice(config, b) });
  }
  // Ensure end block is included
  if (points[points.length - 1]?.block !== config.end_block) {
    points.push({ block: config.end_block, price: config.floor_price });
  }
  return points;
}
