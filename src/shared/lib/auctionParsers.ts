import { parsePlaintext, parseU128, parseU32, parseU64, parseBool, parseField } from "@/shared/utils/leo";
import type { AuctionConfig, AuctionState, Stats } from "@/shared/types/auction";
import type { TokenMetadata, TokenBalance } from "@/shared/types/token";

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

// ============================================================================
// token_registry.aleo parsers
// ============================================================================

/**
 * Parse a TokenMetadata struct from a token_registry.aleo mapping value string.
 * Source mapping: registered_tokens[token_id]
 */
export function parseTokenMetadata(text: string): TokenMetadata {
  const p = parsePlaintext(text);
  const meta: TokenMetadata = {
    token_id: parseField(p["token_id"] ?? ""),
    name: parseU128(p["name"] ?? "0u128"),
    symbol: parseU128(p["symbol"] ?? "0u128"),
    decimals: Number(parseU128(p["decimals"] ?? "0u8")),
    supply: parseU128(p["supply"] ?? "0u128"),
    max_supply: parseU128(p["max_supply"] ?? "0u128"),
    admin: parseField(p["admin"] ?? ""),
    external_authorization_required: parseBool(p["external_authorization_required"] ?? "false"),
    external_authorization_party: parseField(p["external_authorization_party"] ?? ""),
  };
  meta.nameStr = u128ToAscii(meta.name);
  meta.symbolStr = u128ToAscii(meta.symbol);
  return meta;
}

/**
 * Parse a Balance struct from a token_registry.aleo mapping value string.
 * Source mappings: authorized_balances[hash] or balances[hash]
 */
export function parseBalance(text: string): TokenBalance {
  const p = parsePlaintext(text);
  return {
    token_id: parseField(p["token_id"] ?? ""),
    account: parseField(p["account"] ?? ""),
    balance: parseU128(p["balance"] ?? "0u128"),
    authorized_until: parseU32(p["authorized_until"] ?? "0u32"),
  };
}

/**
 * Encode a human-readable ASCII string to the u128 big-endian format used by
 * token_registry.aleo for name and symbol fields.
 *
 * Max 16 characters (16 bytes × 8 bits = 128 bits).
 * Only printable ASCII (1-127) is allowed.
 *
 * @example asciiToU128("pALEO") === 482131854671n
 */
export function asciiToU128(str: string): bigint {
  if (str.length === 0) throw new Error("Name/symbol cannot be empty.");
  if (str.length > 16) throw new Error("Max 16 characters.");
  let result = 0n;
  for (const char of str) {
    const code = char.charCodeAt(0);
    if (code <= 0 || code >= 128) throw new Error(`Non-ASCII character: "${char}"`);
    result = (result << 8n) | BigInt(code);
  }
  return result;
}

/**
 * Decode a u128 ASCII-packed name or symbol back to a human-readable string.
 *
 * token_registry.aleo packs ASCII characters into a u128 value big-endian:
 *   "pALEO" → 0x70414c454f → 482131854671n
 *
 * Verified: u128ToAscii(482131854671n) === "pALEO"
 */
export function u128ToAscii(value: bigint): string {
  if (value === 0n) return "";
  const bytes: number[] = [];
  let v = value;
  while (v > 0n) {
    bytes.unshift(Number(v & 0xffn));
    v >>= 8n;
  }
  return bytes
    .filter((b) => b > 0 && b < 128)
    .map((b) => String.fromCharCode(b))
    .join("");
}
