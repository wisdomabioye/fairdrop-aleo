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

export const NETWORK_URL     = requireEnv("VITE_NETWORK_URL");
export const NETWORK         = requireEnv("VITE_NETWORK");
export const EXPLORER_TX_URL = requireEnv("VITE_EXPLORER_TX_URL");
export const PROGRAM_ID      = requireEnv("VITE_PROGRAM_ID");
export const FEE             = Number(requireEnv("VITE_FEE"));

export const WALLET_NETWORK: Network =
  NETWORK === "mainnet" ? Network.MAINNET :
  NETWORK === "canary"  ? Network.CANARY  :
                          Network.TESTNET;

console.log("[network config]", {
  NETWORK,
  NETWORK_URL,
  EXPLORER_TX_URL,
  PROGRAM_ID,
  FEE,
});
