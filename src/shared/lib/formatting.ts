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

export function formatField(field: string): string {
  const val = field.endsWith("field") ? field.slice(0, -5) : field;
  if (val.length > 16) return `${val.slice(0, 8)}...${val.slice(-6)}`;
  return val;
}
