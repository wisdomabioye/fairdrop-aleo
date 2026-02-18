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
}

export interface TokenRecord {
  id: string;
  owner: string;
  token_id: string;
  amount: bigint;
  /** Locally marked as spent after a successful transaction (wallet indexer may lag) */
  spent?: boolean;
  /** JSON.stringify of wallet record — used for identity comparison in UI */
  _raw: string;
  /** Original wallet record object — passed directly to transaction inputs */
  _record: unknown;
}

export interface BidRecord {
  id: string;
  owner: string;
  auction_id: string;
  quantity: bigint;
  payment_amount: bigint;
  /** Locally marked as spent after a successful transaction (wallet indexer may lag) */
  spent?: boolean;
  /** JSON.stringify of wallet record — used for identity comparison in UI */
  _raw: string;
  /** Original wallet record object — passed directly to transaction inputs */
  _record: unknown;
}

export type AuctionStatus =
  | "upcoming"
  | "active"
  | "ending"
  | "supply_met"
  | "ended"
  | "cleared";

// Parse Aleo u128 value like "123u128" → bigint
function parseU128(val: string): bigint {
  return BigInt(val.replace("u128", ""));
}

// Parse Aleo u32 value like "123u32" → number
function parseU32(val: string): number {
  return Number(val.replace("u32", ""));
}

// Parse Aleo u64 value like "123u64" → number
function parseU64(val: string): number {
  return Number(val.replace("u64", ""));
}

// Parse Aleo bool value
function parseBool(val: string): boolean {
  return val.trim() === "true";
}

// Extract field value from Aleo struct plaintext
function extractField(text: string, name: string): string {
  const regex = new RegExp(`${name}:\\s*([^,}\\s]+)`);
  const match = text.match(regex);
  return match ? match[1].trim() : "";
}

export function parseAuctionConfig(text: string): AuctionConfig {
  return {
    auction_id: extractField(text, "auction_id"),
    creator: extractField(text, "creator"),
    sale_token_id: extractField(text, "sale_token_id"),
    payment_token_id: extractField(text, "payment_token_id"),
    supply: parseU128(extractField(text, "supply")),
    start_price: parseU128(extractField(text, "start_price")),
    floor_price: parseU128(extractField(text, "floor_price")),
    start_block: parseU32(extractField(text, "start_block")),
    end_block: parseU32(extractField(text, "end_block")),
    price_decay_blocks: parseU32(extractField(text, "price_decay_blocks")),
    price_decay_amount: parseU128(extractField(text, "price_decay_amount")),
    max_bid_amount: parseU128(extractField(text, "max_bid_amount")),
    min_bid_amount: parseU128(extractField(text, "min_bid_amount")),
  };
}

export function parseAuctionState(text: string): AuctionState {
  return {
    total_committed: parseU128(extractField(text, "total_committed")),
    total_payments: parseU128(extractField(text, "total_payments")),
    supply_met: parseBool(extractField(text, "supply_met")),
    ended_at_block: parseU32(extractField(text, "ended_at_block")),
    cleared: parseBool(extractField(text, "cleared")),
    clearing_price: parseU128(extractField(text, "clearing_price")),
    creator_revenue: parseU128(extractField(text, "creator_revenue")),
  };
}

export function parseStats(text: string): Stats {
  return {
    total_auctions: parseU64(extractField(text, "total_auctions")),
    total_bids: parseU64(extractField(text, "total_bids")),
  };
}

export function parseTokenRecord(raw: string): TokenRecord {
  return {
    id: "",
    owner: extractField(raw, "owner"),
    token_id: extractField(raw, "token_id"),
    amount: parseU128(extractField(raw, "amount")),
    _raw: raw,
    _record: raw,
  };
}

export function parseBidRecord(raw: string): BidRecord {
  return {
    id: "",
    owner: extractField(raw, "owner"),
    auction_id: extractField(raw, "auction_id"),
    quantity: parseU128(extractField(raw, "quantity")),
    payment_amount: parseU128(extractField(raw, "payment_amount")),
    _raw: raw,
    _record: raw,
  };
}
