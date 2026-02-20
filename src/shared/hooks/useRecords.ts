import { useState, useCallback, useEffect } from "react";
import { useWallet } from "@demox-labs/aleo-wallet-adapter-react";
import { PROGRAM_ID } from "@/constants";
import type { TokenRecord, BidRecord } from "../types/auction";
import { isWalletRecord } from "../types/wallet";
import { useRefresh } from "../context/RefreshContext";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function stripSuffix(value: string): string {
  return value.replace(/\.(private|public)$/, "");
}

function parseBigInt(value: string): bigint {
  return BigInt(stripSuffix(value).replace("u128", ""));
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useRecords({
  pollInterval,
  fetchOnMount = true,
}: {
  pollInterval?: number;
  fetchOnMount?: boolean;
} = {}) {
  const { publicKey, requestRecords } = useWallet();
  const { recordsRevision } = useRefresh();
  const [tokenRecords, setTokenRecords] = useState<TokenRecord[]>([]);
  const [bidRecords, setBidRecords] = useState<BidRecord[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchRecords = useCallback(async () => {
    if (!publicKey || !requestRecords) return;
    setLoading(true);
    try {
      const entries = await requestRecords(PROGRAM_ID);
      const tokens: TokenRecord[] = [];
      const bids: BidRecord[] = [];

      for (const entry of entries) {
        if (!isWalletRecord(entry)) continue;
        const { owner, data } = entry;
        const raw = JSON.stringify(entry);
        const recordInput: unknown = entry;

        if (entry.recordName === "Token") {
          try {
            tokens.push({
              id: entry.id,
              owner,
              token_id: stripSuffix(data["token_id"] ?? ""),
              amount: parseBigInt(data["amount"] ?? "0u128"),
              spent: entry.spent,
              _raw: raw,
              _record: recordInput,
            });
          } catch { /* skip malformed */ }
        } else if (entry.recordName === "Bid") {
          try {
            bids.push({
              id: entry.id,
              owner,
              auction_id: stripSuffix(data["auction_id"] ?? ""),
              quantity: parseBigInt(data["quantity"] ?? "0u128"),
              payment_amount: parseBigInt(data["payment_amount"] ?? "0u128"),
              spent: entry.spent,
              _raw: raw,
              _record: recordInput,
            });
          } catch { /* skip malformed */ }
        }
      }

      setTokenRecords(tokens);
      setBidRecords(bids);
    } catch (e) {
      console.error("Failed to fetch records:", e);
    } finally {
      setLoading(false);
    }
  }, [publicKey, requestRecords]);

  // Explicit mount fetch
  useEffect(() => {
    if (publicKey && fetchOnMount) fetchRecords();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [publicKey]);

  // Re-fetch on global refresh signal (skip revision 0 — that's the mount)
  useEffect(() => {
    if (publicKey && recordsRevision > 0) fetchRecords();
  }, [recordsRevision, publicKey, fetchRecords]);

  // Polling — waits for each fetch to finish before scheduling the next
  useEffect(() => {
    if (!publicKey || !pollInterval) return;
    let timeout: ReturnType<typeof setTimeout>;
    const poll = async () => {
      await fetchRecords();
      timeout = setTimeout(poll, pollInterval);
    };
    poll();
    return () => clearTimeout(timeout);
  }, [publicKey, pollInterval, fetchRecords]);

  return { tokenRecords, bidRecords, loading, fetchRecords };
}
