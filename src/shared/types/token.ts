// ============================================================================
// token_registry.aleo types
// Pure interfaces — no parsing logic. See shared/lib/auctionParsers.ts for parsers.
// ============================================================================

// Mirrors the token_registry.aleo/Token record.
// Parsed from recordPlaintext returned by the wallet adapter (requestRecords).
export interface TokenRecord {
  /** Stable unique ID — the record commitment field element */
  id: string;
  /** Encrypted field element (not a bech32 address — from wallet adapter) */
  owner: string;
  amount: bigint;
  token_id: string;
  external_authorization_required: boolean;
  /** Block height until which the token is authorized (u32). 4294967295 = no expiry. */
  authorized_until: number;
  spent?: boolean;
  /** Record plaintext string — passed directly as a transaction input */
  _record: string;
}

// Mirrors the token_registry.aleo/TokenMetadata struct.
// Retrieved from the registered_tokens mapping.
export interface TokenMetadata {
  token_id: string;
  /** Raw u128 ASCII-packed value — use u128ToAscii() for display */
  name: bigint;
  /** Raw u128 ASCII-packed value — use u128ToAscii() for display */
  symbol: bigint;
  decimals: number;
  supply: bigint;
  max_supply: bigint;
  admin: string;
  external_authorization_required: boolean;
  external_authorization_party: string;
  // Derived display fields populated after decoding
  nameStr?: string;
  symbolStr?: string;
}

// Mirrors the credits.aleo/credits record.
export interface CreditRecord {
  /** Record commitment — stable unique ID */
  id: string;
  owner: string;
  /** Amount in microcredits */
  microcredits: bigint;
  spent?: boolean;
  _record: string;
}

// Mirrors the token_registry.aleo/Balance struct.
// Retrieved from the authorized_balances or balances mappings.
export interface TokenBalance {
  token_id: string;
  account: string;
  balance: bigint;
  /** Block height until which the balance is authorized. 4294967295 = no expiry. */
  authorized_until: number;
}

// ============================================================================
// Protocol constants
// ============================================================================

/** ALEO credits registered in token_registry.aleo */
export const CREDITS_RESERVED_TOKEN_ID =
  "3443843282313283355522573239085696902919850365217539366784739393210722344986field";

export const CREDITS_DECIMALS = 6;
export const CREDITS_SYMBOL = "ALEO";
export const CREDITS_NAME = "Aleo Credits";

/** token_registry.aleo role constants */
export const MINTER_ROLE = 1;
export const BURNER_ROLE = 2;
export const SUPPLY_MANAGER_ROLE = 3;

/** u32 max — used as "no expiry" in authorized_until fields */
export const NO_EXPIRY = 4294967295;
