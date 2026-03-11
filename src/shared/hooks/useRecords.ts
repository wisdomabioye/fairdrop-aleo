import { useState, useCallback, useEffect } from "react";
import { useWallet } from "@provablehq/aleo-wallet-adaptor-react";
import { PROGRAM_ID } from "@/config/network";
import type { TokenRecord, BidRecord } from "@/shared/types/auction";
import { isWalletRecord } from "@/shared/types/wallet";
import { parsePlaintext, parseU128, parseField } from "@/shared/utils/leo";
import { useRefresh } from "@/shared/context/RefreshContext";

export function useRecords({
  pollInterval,
  fetchOnMount = true,
}: {
  pollInterval?: number;
  fetchOnMount?: boolean;
} = {}) {
  const { address, requestRecords } = useWallet();
  const { recordsRevision } = useRefresh();
  const [tokenRecords, setTokenRecords] = useState<TokenRecord[]>([]);
  const [bidRecords, setBidRecords] = useState<BidRecord[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchRecords = useCallback(async () => {
    if (!address || !requestRecords) return;
    setLoading(true);
    try {
      const entries = await requestRecords(PROGRAM_ID, true);
      const tokens: TokenRecord[] = [];
      const bids: BidRecord[] = [];

      for (const entry of entries) {
        if (!isWalletRecord(entry)) continue;

        const fields = parsePlaintext(entry.recordPlaintext);

        if (entry.recordName === "Token") {
          try {
            tokens.push({
              id:       entry.commitment,
              owner:    parseField(fields["owner"]    ?? ""),
              token_id: parseField(fields["token_id"] ?? ""),
              amount:   parseU128(fields["amount"]    ?? "0u128"),
              spent:    entry.spent,
              _record:  entry.recordPlaintext,
            });
          } catch { /* skip malformed */ }
        } else if (entry.recordName === "Bid") {
          try {
            bids.push({
              id:              entry.commitment,
              owner:           parseField(fields["owner"]          ?? ""),
              auction_id:      parseField(fields["auction_id"]     ?? ""),
              quantity:        parseU128(fields["quantity"]        ?? "0u128"),
              payment_amount:  parseU128(fields["payment_amount"]  ?? "0u128"),
              spent:           entry.spent,
              _record:         entry.recordPlaintext,
            });
          } catch { /* skip malformed */ }
        }
      }

      setTokenRecords(tokens);
      setBidRecords(bids);
    } catch (e) {
      // WalletNotConnectedError is expected after transaction submission — suppress it
      if (!(e instanceof Error && e.name === "WalletNotConnectedError")) {
        console.error("Failed to fetch records:", e);
      }
    } finally {
      setLoading(false);
    }
  }, [address, requestRecords]);

  // Fetch on mount
  useEffect(() => {
    if (address && fetchOnMount) fetchRecords();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [address]);

  // Re-fetch on global refresh signal (skip revision 0 — that's the mount)
  useEffect(() => {
    if (address && recordsRevision > 0) fetchRecords();
  }, [recordsRevision, address, fetchRecords]);

  // Polling — waits for each fetch to finish before scheduling the next
  useEffect(() => {
    if (!address || !pollInterval) return;
    let timeout: ReturnType<typeof setTimeout>;
    const poll = async () => {
      await fetchRecords();
      timeout = setTimeout(poll, pollInterval);
    };
    poll();
    return () => clearTimeout(timeout);
  }, [address, pollInterval, fetchRecords]);

  return { tokenRecords, bidRecords, loading, fetchRecords };
}
