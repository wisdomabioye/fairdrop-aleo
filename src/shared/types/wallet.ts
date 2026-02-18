/** Shape of a record returned by the Leo wallet's requestRecords() */
export interface WalletRecord {
  id: string;
  owner: string;
  program_id: string;
  spent: boolean;
  recordName: string;
  data: Record<string, string>;
}

export function isWalletRecord(value: unknown): value is WalletRecord {
  if (typeof value !== "object" || value === null) return false;
  const r = value as Record<string, unknown>;
  return (
    typeof r["owner"] === "string" &&
    typeof r["data"] === "object" &&
    r["data"] !== null
  );
}
