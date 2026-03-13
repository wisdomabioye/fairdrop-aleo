export function truncateAddress(address: string, chars = 6): string {
  if (address.length <= chars * 2 + 3) return address;
  return `${address.slice(0, chars)}...${address.slice(-chars)}`;
}

export function formatAmount(amount: bigint, decimals = 0): string {
  if (decimals === 0) return amount.toLocaleString();
  const divisor = 10n ** BigInt(decimals);
  const whole = amount / divisor;
  const frac = amount % divisor;
  const fracStr = frac.toString().padStart(decimals, "0").replace(/0+$/, "");
  return fracStr ? `${whole.toLocaleString()}.${fracStr}` : whole.toLocaleString();
}

/**
 * Format a raw on-chain token amount to human-readable form using metadata decimals.
 * Falls back to raw integer display when metadata is unavailable.
 */
export function formatTokenAmount(
  amount: bigint,
  meta: { decimals: number } | null | undefined,
): string {
  return formatAmount(amount, meta?.decimals ?? 0);
}

/**
 * Parse a human-readable token amount string into a raw on-chain bigint.
 * Inverse of formatTokenAmount.
 * "1.5" + 6 decimals → 1500000n
 * "100" + 0 decimals → 100n
 * Invalid / empty → 0n
 */
export function parseTokenAmount(
  input: string,
  decimals: number,
): bigint {
  const trimmed = input.trim();
  if (!trimmed) return 0n;

  // Match optional digits, optional dot + fractional digits
  const match = trimmed.match(/^(\d+)(?:\.(\d+))?$/);
  if (!match) return 0n;

  const whole = match[1];
  const frac = (match[2] ?? "").slice(0, decimals).padEnd(decimals, "0");

  try {
    return BigInt(whole + frac);
  } catch {
    return 0n;
  }
}

/**
 * Convert a raw bigint to a plain numeric string (no locale separators).
 * Used for populating input fields where commas would be invalid.
 */
export function toPlainAmount(amount: bigint, decimals: number): string {
  if (decimals === 0) return amount.toString();
  const divisor = 10n ** BigInt(decimals);
  const whole = amount / divisor;
  const frac = amount % divisor;
  const fracStr = frac.toString().padStart(decimals, "0").replace(/0+$/, "");
  return fracStr ? `${whole}.${fracStr}` : whole.toString();
}

export function formatField(field: string): string {
  const val = field.endsWith("field") ? field.slice(0, -5) : field;
  if (val.length > 16) return `${val.slice(0, 8)}...${val.slice(-6)}`;
  return val;
}
