/**
 * Payment token abstraction.
 *
 * fairdrop.aleo v2 accepts only credits.aleo as the payment token.
 * This module centralises that knowledge so the UI doesn't scatter
 * magic constants or duplicate formatting logic.
 */

import {
  CREDITS_RESERVED_TOKEN_ID,
  CREDITS_DECIMALS,
  CREDITS_SYMBOL,
  CREDITS_NAME,
} from "@/shared/types/token";

// ── Re-export protocol constants for convenience ────────────────────────────

export { CREDITS_RESERVED_TOKEN_ID, CREDITS_DECIMALS, CREDITS_SYMBOL, CREDITS_NAME };

// ── Unit conversion ──────────────────────────────────────────────────────────

/** Microcredits (u64) → display ALEO (6 decimals). */
export function microToAleo(microcredits: bigint): number {
  return Number(microcredits) / 10 ** CREDITS_DECIMALS;
}

/** Display ALEO (string or number) → microcredits bigint. Returns null on invalid input. */
export function aleoToMicro(aleo: string | number): bigint | null {
  const n = typeof aleo === "string" ? parseFloat(aleo) : aleo;
  if (!isFinite(n) || n < 0) return null;
  return BigInt(Math.round(n * 10 ** CREDITS_DECIMALS));
}

/**
 * Format microcredits for display.
 * @example formatMicrocredits(1_500_000n) → "1.5 ALEO"
 */
export function formatMicrocredits(microcredits: bigint, decimals = 6): string {
  const divisor = 10 ** decimals;
  const whole = microcredits / BigInt(divisor);
  const frac = microcredits % BigInt(divisor);
  if (frac === 0n) return `${whole} ${CREDITS_SYMBOL}`;
  const fracStr = frac.toString().padStart(decimals, "0").replace(/0+$/, "");
  return `${whole}.${fracStr} ${CREDITS_SYMBOL}`;
}

// ── Validation helpers ───────────────────────────────────────────────────────

/**
 * Verify that a token ID is credits.aleo (the only accepted payment token).
 * Used in CreateAuctionPage to guard the payment_token_id input.
 */
export function isCreditsToken(tokenId: string): boolean {
  return tokenId === CREDITS_RESERVED_TOKEN_ID;
}

/**
 * Validate a bid amount string entered by the user.
 * Returns an error message or null if valid.
 *
 * @param value  User-entered ALEO amount (display units, e.g. "1.5")
 * @param min    Minimum allowed microcredits (from auction config)
 * @param max    Maximum allowed microcredits (0n = no limit)
 * @param publicBalance  Known public credits balance in microcredits (null = unknown)
 */
export function validateBidAmount(
  value: string,
  min: bigint,
  max: bigint,
  publicBalance: bigint | null,
): string | null {
  const micros = aleoToMicro(value);
  if (micros === null || micros <= 0n) return "Enter a valid positive amount.";
  if (micros < min) return `Minimum bid is ${formatMicrocredits(min)}.`;
  if (max > 0n && micros > max) return `Maximum bid is ${formatMicrocredits(max)}.`;
  if (publicBalance !== null && micros > publicBalance)
    return `Insufficient public balance (${formatMicrocredits(publicBalance)} available).`;
  return null;
}
