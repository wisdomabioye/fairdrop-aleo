// Re-exported for backwards compatibility — import directly from token.ts in new code.
export type { TokenRecord } from "@/shared/types/token";

export interface AuctionConfig {
  auction_id: string;
  creator: string;
  sale_token_id: string;
  payment_token_id: string;
  supply: bigint;
  start_price: bigint;
  floor_price: bigint;
  start_block: number;
  end_block: number;
  price_decay_blocks: number;
  price_decay_amount: bigint;
  max_bid_amount: bigint;
  min_bid_amount: bigint;
  sale_scale?: bigint;
}

export interface AuctionState {
  total_committed: bigint;
  total_payments: bigint;
  supply_met: boolean;
  ended_at_block: number;
  cleared: boolean;
  clearing_price: bigint;
  creator_revenue: bigint;
}

export interface Stats {
  total_auctions: number;
  total_bids: number;
  total_payment_collected: number;
}

export interface BidRecord {
  /** Stable unique ID — the record commitment field element */
  id: string;
  owner: string;
  auction_id: string;
  quantity: bigint;
  payment_amount: bigint;
  /** Locally marked as spent after a successful transaction (wallet indexer may lag) */
  spent?: boolean;
  /** Record plaintext string — passed directly as a transaction input */
  _record: string;
}

export type AuctionStatus =
  | "upcoming"
  | "active"
  | "ending"
  | "supply_met"
  | "ended"
  | "cleared";
