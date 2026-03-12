/**
 * Utilities for parsing Leo/Aleo plaintext values.
 *
 * Leo record plaintexts look like:
 *   {
 *     owner: aleo1sn8ns4...,
 *     amount: 1000u128.private,
 *     _nonce: 2704077...group.public
 *   }
 *
 * Mapping values look like the same format but without .private/.public suffixes:
 *   {
 *     supply: 1000000u128,
 *     start_block: 14500000u32
 *   }
 *
 * parsePlaintext turns either format into a plain Record<string, string>
 * so callers can do: parsePlaintext(pt)["amount"] → "1000u128.private"
 * and then pass to parseU128 which handles the suffix automatically.
 */

/** Strip the .private / .public visibility suffix from a Leo value. */
export function stripVisibility(value: string): string {
  return value.replace(/\.(private|public)$/, "");
}

/**
 * Parse a Leo record or struct plaintext into key → value pairs.
 * Works on both single-line and multi-line formats.
 * Values retain their visibility suffix (.private / .public).
 */
export function parsePlaintext(text: string): Record<string, string> {
  const result: Record<string, string> = {};
  const pattern = /\b(\w+):\s*([^,}\s]+)/g;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(text)) !== null) {
    result[match[1]] = match[2];
  }
  return result;
}

/** "123u128.private", "123u128", "6u8", etc. → 123n */
export function parseU128(value: string): bigint {
  return BigInt(stripVisibility(value).replace(/u\d+$/, ""));
}

/** "5u32.private", "5u32", "5u8", etc. → 5 */
export function parseU32(value: string): number {
  return Number(stripVisibility(value).replace(/u\d+$/, ""));
}

/** "5u64.private", "5u64", etc. → 5 */
export function parseU64(value: string): number {
  return Number(stripVisibility(value).replace(/u\d+$/, ""));
}

/** "true.private" or "true" → true */
export function parseBool(value: string): boolean {
  return stripVisibility(value).trim() === "true";
}

/** "1field.private" or "1field" → "1field" */
export function parseField(value: string): string {
  return stripVisibility(value);
}
