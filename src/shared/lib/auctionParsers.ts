import { parsePlaintext, parseU128, parseU32, parseU64, parseBool, parseField } from "@/shared/utils/leo";
import type { AuctionConfig, AuctionState, Stats } from "@/shared/types/auction";

export function parseAuctionConfig(text: string): AuctionConfig {
  const p = parsePlaintext(text);
  return {
    auction_id: parseField(p["auction_id"] ?? ""),
    creator: parseField(p["creator"] ?? ""),
    sale_token_id: parseField(p["sale_token_id"] ?? ""),
    payment_token_id: parseField(p["payment_token_id"] ?? ""),
    supply: parseU128(p["supply"] ?? "0u128"),
    start_price: parseU128(p["start_price"] ?? "0u128"),
    floor_price: parseU128(p["floor_price"] ?? "0u128"),
    start_block: parseU32(p["start_block"] ?? "0u32"),
    end_block: parseU32(p["end_block"] ?? "0u32"),
    price_decay_blocks: parseU32(p["price_decay_blocks"] ?? "0u32"),
    price_decay_amount: parseU128(p["price_decay_amount"] ?? "0u128"),
    max_bid_amount: parseU128(p["max_bid_amount"] ?? "0u128"),
    min_bid_amount: parseU128(p["min_bid_amount"] ?? "0u128"),
  };
}

export function parseAuctionState(text: string): AuctionState {
  const p = parsePlaintext(text);
  return {
    total_committed: parseU128(p["total_committed"] ?? "0u128"),
    total_payments: parseU128(p["total_payments"] ?? "0u128"),
    supply_met: parseBool(p["supply_met"] ?? "false"),
    ended_at_block: parseU32(p["ended_at_block"] ?? "0u32"),
    cleared: parseBool(p["cleared"] ?? "false"),
    clearing_price: parseU128(p["clearing_price"] ?? "0u128"),
    creator_revenue: parseU128(p["creator_revenue"] ?? "0u128"),
  };
}

export function parseStats(text: string): Stats {
  const p = parsePlaintext(text);
  return {
    total_auctions: parseU64(p["total_auctions"] ?? "0u64"),
    total_bids: parseU64(p["total_bids"] ?? "0u64"),
  };
}
