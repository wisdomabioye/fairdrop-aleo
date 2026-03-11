/** Shape of a record returned by requestRecords(program, true) in the @provablehq adapter */
export interface WalletRecord {
  commitment: string;
  tag: string;
  recordName: string;
  recordPlaintext: string;
  recordCiphertext: string;
  programName: string;
  /** Encrypted field element — NOT the bech32 address. Parse owner from recordPlaintext. */
  owner: string;
  spent: boolean;
  blockHeight: number;
  blockTimestamp: number;
  transactionId: string;
  functionName: string;
  outputIndex: number;
  transitionId: string;
  transitionIndex: number;
  transactionIndex: number;
  sender: string;
}

export function isWalletRecord(value: unknown): value is WalletRecord {
  if (typeof value !== "object" || value === null) return false;
  const r = value as Record<string, unknown>;
  return (
    typeof r["recordName"] === "string" &&
    typeof r["recordPlaintext"] === "string" &&
    typeof r["spent"] === "boolean"
  );
}
