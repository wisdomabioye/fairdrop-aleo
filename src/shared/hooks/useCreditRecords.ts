import { useMemo } from "react";
import { CREDITS_PROGRAM_ID } from "@/config/network";
import type { CreditRecord } from "@/shared/types/token";
import { parsePlaintext, parseField, stripVisibility } from "@/shared/utils/leo";
import { useWalletRecords } from "./useWalletRecords";

interface Options {
  pollInterval?: number;
  fetchOnMount?: boolean;
}

/** Fetches credits.aleo private credits records owned by the connected wallet. */
export function useCreditRecords(opts: Options = {}) {
  const { entries, loading, fetchRecords } = useWalletRecords(CREDITS_PROGRAM_ID, opts);

  const creditRecords = useMemo<CreditRecord[]>(() => {
    const result: CreditRecord[] = [];
    for (const entry of entries) {
      if (entry.recordName !== "credits") continue;
      try {
        const fields = parsePlaintext(entry.recordPlaintext);
        const raw = stripVisibility(fields["microcredits"] ?? "0u64").replace(/u64$/, "");
        result.push({
          id:           entry.commitment,
          owner:        parseField(fields["owner"] ?? ""),
          microcredits: BigInt(raw),
          spent:        entry.spent,
          _record:      entry.recordPlaintext,
        });
      } catch { /* skip malformed */ }
    }
    return result;
  }, [entries]);

  return { creditRecords, loading, fetchRecords };
}
