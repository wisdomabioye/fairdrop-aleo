import { useMemo } from "react";
import { PROGRAM_ID } from "@/config/network";
import type { BidRecord } from "@/shared/types/auction";
import { parsePlaintext, parseU128, parseField } from "@/shared/utils/leo";
import { useWalletRecords } from "./useWalletRecords";

interface Options {
  pollInterval?: number;
  fetchOnMount?: boolean;
}

/** Fetches fairdrop.aleo Bid records owned by the connected wallet. */
export function useBidRecords(opts: Options = {}) {
  const { entries, loading, fetchRecords } = useWalletRecords(PROGRAM_ID, opts);

  const bidRecords = useMemo<BidRecord[]>(() => {
    const result: BidRecord[] = [];
    for (const entry of entries) {
      if (entry.recordName !== "Bid") continue;
      try {
        const fields = parsePlaintext(entry.recordPlaintext);
        result.push({
          id:             entry.commitment,
          owner:          parseField(fields["owner"]         ?? ""),
          auction_id:     parseField(fields["auction_id"]    ?? ""),
          quantity:       parseU128(fields["quantity"]       ?? "0u128"),
          payment_amount: parseU128(fields["payment_amount"] ?? "0u128"),
          spent:          entry.spent,
          _record:        entry.recordPlaintext,
        });
      } catch { /* skip malformed */ }
    }
    return result;
  }, [entries]);

  return { bidRecords, loading, fetchRecords };
}
