/**
 * Network configuration — all values are read from environment variables.
 * A missing variable throws at module load time so misconfiguration is caught early.
 */

import { Network } from "@provablehq/aleo-types";

function requireEnv(key: string): string {
  const value = (import.meta.env as Record<string, string | undefined>)[key];
  if (!value) throw new Error(`Missing required environment variable: ${key}`);
  return value;
}

// ── Core network ─────────────────────────────────────────────────────────────
export const NETWORK_URL     = requireEnv("VITE_NETWORK_URL");
export const NETWORK         = requireEnv("VITE_NETWORK");
export const EXPLORER_TX_URL = requireEnv("VITE_EXPLORER_TX_URL");
export const FEE             = Number(requireEnv("VITE_FEE"));

export const WALLET_NETWORK: Network =
  NETWORK === "mainnet" ? Network.MAINNET :
  NETWORK === "canary"  ? Network.CANARY  :
                          Network.TESTNET;

// ── Program IDs ──────────────────────────────────────────────────────────────
/** fairdrop.aleo — the auction program */
export const PROGRAM_ID              = requireEnv("VITE_PROGRAM_ID");
/** token_registry.aleo — ARC-20 token registry */
export const TOKEN_REGISTRY_PROGRAM_ID = requireEnv("VITE_TOKEN_REGISTRY_PROGRAM_ID");
/** credits.aleo — native ALEO credits program */
export const CREDITS_PROGRAM_ID      = "credits.aleo";

/**
 * The bech32 program address of fairdrop.aleo.
 * Used in the Token Launch wizard "Authorize Auction" step when calling
 * token_registry.aleo/set_role(token_id, FAIRDROP_PROGRAM_ADDRESS, MINTER_ROLE).
 * Determined from the program name.
 */
export const FAIRDROP_PROGRAM_ADDRESS = requireEnv("VITE_FAIRDROP_PROGRAM_ADDRESS");

console.log("[network config]", {
  NETWORK,
  NETWORK_URL,
  EXPLORER_TX_URL,
  PROGRAM_ID,
  TOKEN_REGISTRY_PROGRAM_ID,
  FAIRDROP_PROGRAM_ADDRESS,
  FEE,
});
