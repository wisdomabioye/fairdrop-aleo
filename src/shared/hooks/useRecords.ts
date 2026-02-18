import { useState, useCallback } from "react";
import { useWallet } from "@demox-labs/aleo-wallet-adapter-react";
import { PROGRAM_ID } from "../../constants";
import type { TokenRecord, BidRecord } from "../types/auction";
import { isWalletRecord } from "../types/wallet";

// ─── Local spent tracking ─────────────────────────────────────────────────────
// The Leo wallet's record indexer can lag minutes behind on-chain state.
// We persist spent record IDs in localStorage so we can show them as visually
// spent across page refreshes, rather than making them vanish abruptly.

const SPENT_KEY = "fairdrop_spent";

function getLocalSpent(): Set<string> {
  try {
    const raw = localStorage.getItem(SPENT_KEY);
    return new Set(raw ? (JSON.parse(raw) as string[]) : []);
  } catch {
    return new Set();
  }
}

function saveLocalSpent(ids: Set<string>): void {
  try {
    localStorage.setItem(SPENT_KEY, JSON.stringify([...ids]));
  } catch { /* quota errors — silently ignore */ }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function stripSuffix(value: string): string {
  return value.replace(/\.(private|public)$/, "");
}

function parseBigInt(value: string): bigint {
  return BigInt(stripSuffix(value).replace("u128", ""));
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useRecords() {
  const { publicKey, requestRecords } = useWallet();
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

      const localSpent = getLocalSpent();
      const walletReturnedIds = new Set<string>();

      for (const entry of entries) {
        if (!isWalletRecord(entry)) continue;
        walletReturnedIds.add(entry.id);

        // A record is spent if the wallet confirms it (entry.spent) OR if we
        // locally marked it after a transaction. Either way, keep it visible
        // with a "Spent" indicator until the wallet stops returning it entirely
        // (i.e. the indexer fully drops it from its list).
        const isSpent = entry.spent || localSpent.has(entry.id);
        const { owner, data } = entry;
        const raw = JSON.stringify(entry);
        const recordInput: unknown = entry;

        const tokenId  = data["token_id"]  ? stripSuffix(data["token_id"])  : "";
        const auctionId = data["auction_id"] ? stripSuffix(data["auction_id"]) : "";

        if (tokenId && !auctionId) {
          try {
            tokens.push({
              id: entry.id,
              owner,
              token_id: tokenId,
              amount: parseBigInt(data["amount"] ?? "0u128"),
              spent: isSpent,
              _raw: raw,
              _record: recordInput,
            });
          } catch { /* skip malformed */ }
        } else if (auctionId) {
          try {
            bids.push({
              id: entry.id,
              owner,
              auction_id: auctionId,
              quantity: parseBigInt(data["quantity"] ?? "0u128"),
              payment_amount: parseBigInt(data["payment_amount"] ?? "0u128"),
              spent: isSpent,
              _raw: raw,
              _record: recordInput,
            });
          } catch { /* skip malformed */ }
        }
      }

      // Cleanup: once the wallet stops returning a record at all, it is truly
      // gone from the index — safe to remove from local tracking.
      const cleaned = new Set([...localSpent].filter((id) => walletReturnedIds.has(id)));
      saveLocalSpent(cleaned);

      setTokenRecords(tokens);
      setBidRecords(bids);
    } catch (e) {
      console.error("Failed to fetch records:", e);
    } finally {
      setLoading(false);
    }
  }, [publicKey, requestRecords]);

  /**
   * Mark records as spent after a successful transaction.
   *
   * Records are NOT immediately removed — they stay visible with a "Spent"
   * indicator so the user can see what was consumed. They disappear naturally
   * on the next fetchRecords once the wallet's indexer confirms them as spent.
   *
   * IDs are persisted to localStorage so the spent state survives page refreshes
   * during the wallet's indexer lag window.
   */
  const markSpent = useCallback((ids: string[]) => {
    const current = getLocalSpent();
    ids.forEach((id) => current.add(id));
    saveLocalSpent(current);

    const idSet = new Set(ids);
    setTokenRecords((prev) => prev.map((r) => (idSet.has(r.id) ? { ...r, spent: true } : r)));
    setBidRecords((prev)   => prev.map((r) => (idSet.has(r.id) ? { ...r, spent: true } : r)));
  }, []);

  return { tokenRecords, bidRecords, loading, fetchRecords, markSpent };
}
