import { BHP256, Plaintext } from "@provablehq/sdk";
import { TOKEN_REGISTRY_PROGRAM_ID, CREDITS_PROGRAM_ID, FAIRDROP_PROGRAM_ADDRESS } from "@/config/network";
import { getNetworkClient } from "./networkClient";
import { parseTokenMetadata, parseBalance } from "./auctionParsers";
import type { TokenMetadata, TokenBalance } from "@/shared/types/token";
import { MINTER_ROLE, SUPPLY_MANAGER_ROLE } from "@/shared/types/token";

// ============================================================================
// Internal helpers
// ============================================================================

async function getRegistryValue(mapping: string, key: string): Promise<string | null> {
  try {
    const client = getNetworkClient();
    const value = await client.getProgramMappingValue(TOKEN_REGISTRY_PROGRAM_ID, mapping, key);
    return value ? String(value) : null;
  } catch {
    return null;
  }
}

/**
 * Compute the mapping key used by token_registry.aleo for (account, token_id) pairs.
 *
 * Mirrors: BHP256::hash_to_field(TokenOwner { account, token_id })
 *
 * Struct field order matches the Leo definition:
 *   struct TokenOwner { account: address, token_id: field }
 */
function computeTokenOwnerKey(account: string, tokenId: string): string {
  const struct = Plaintext.fromString(`{ account: ${account}, token_id: ${tokenId} }`);
  const bits = struct.toBitsLe();
  const bhp = new BHP256();
  const field = bhp.hash(bits);
  const key = field.toString();
  field.free();
  bhp.free();
  struct.free();
  return key;
}

// ============================================================================
// Public API
// ============================================================================

/**
 * Fetch token metadata from the registry's `registered_tokens` mapping.
 * Key is the token_id field element — no hash required.
 */
export async function fetchTokenMetadata(tokenId: string): Promise<TokenMetadata | null> {
  const raw = await getRegistryValue("registered_tokens", tokenId);
  if (!raw) return null;
  try {
    return parseTokenMetadata(raw);
  } catch {
    return null;
  }
}

/**
 * Fetch the public balance for (account, tokenId).
 * Tries `authorized_balances` first (most ARC-20 tokens), falls back to `balances`.
 * Returns null if the account has no balance or if the hash computation fails.
 */
export async function fetchTokenBalance(
  account: string,
  tokenId: string,
): Promise<TokenBalance | null> {
  let key: string;
  try {
    key = computeTokenOwnerKey(account, tokenId);
  } catch (e) {
    console.warn("[tokenRegistry] BHP256 hash failed:", e);
    return null;
  }
  const raw =
    (await getRegistryValue("authorized_balances", key)) ??
    (await getRegistryValue("balances", key));
  if (!raw) return null;
  try {
    return parseBalance(raw);
  } catch {
    return null;
  }
}

/**
 * Fetch the role number assigned to `account` for `tokenId`.
 * Returns: 1 = MINTER_ROLE, 2 = BURNER_ROLE, 3 = SUPPLY_MANAGER_ROLE, null = no role.
 */
export async function fetchTokenRole(account: string, tokenId: string): Promise<number | null> {
  let key: string;
  try {
    key = computeTokenOwnerKey(account, tokenId);
    console.debug("[fetchTokenRole] key", key, "for", account, tokenId);
  } catch (e) {
    console.warn("[fetchTokenRole] BHP256 hash failed:", e);
    return null;
  }
  const raw = await getRegistryValue("roles", key);
  console.debug("[fetchTokenRole] raw role value", raw);
  if (!raw) return null;
  const n = parseInt(raw.replace(/u\d+$/, ""), 10);
  return isNaN(n) ? null : n;
}

/**
 * Check whether fairdrop.aleo has MINTER_ROLE or SUPPLY_MANAGER_ROLE for `tokenId`.
 * Call this in CreateAuction to validate the program can mint the sale token at claim time.
 */
export async function hasMinterRole(tokenId: string): Promise<boolean> {
  const role = await fetchTokenRole(FAIRDROP_PROGRAM_ADDRESS, tokenId);
  return role === MINTER_ROLE || role === SUPPLY_MANAGER_ROLE;
}

/**
 * Fetch the public credits.aleo balance for an address.
 * Returns microcredits (u64) or null if the address has no public balance.
 */
export async function fetchCreditsBalance(account: string): Promise<bigint | null> {
  try {
    const client = getNetworkClient();
    const value = await client.getProgramMappingValue(CREDITS_PROGRAM_ID, "account", account);
    if (!value) return null;
    const s = String(value).replace(/u64$/, "");
    return BigInt(s);
  } catch {
    return null;
  }
}
