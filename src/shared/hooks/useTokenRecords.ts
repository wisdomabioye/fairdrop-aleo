import { useMemo } from "react";
import { TOKEN_REGISTRY_PROGRAM_ID } from "@/config/network";
import type { TokenRecord } from "@/shared/types/token";
import { parsePlaintext, parseU128, parseU32, parseField, parseBool } from "@/shared/utils/leo";
import { useWalletRecords } from "./useWalletRecords";

interface Options {
  pollInterval?: number;
  fetchOnMount?: boolean;
}

/** Fetches token_registry.aleo Token records owned by the connected wallet. */
export function useTokenRecords(opts: Options = {}) {
  const { entries, loading, fetchRecords } = useWalletRecords(TOKEN_REGISTRY_PROGRAM_ID, opts);

  const tokenRecords = useMemo<TokenRecord[]>(() => {
    const result: TokenRecord[] = [];
    for (const entry of entries) {
      if (entry.recordName !== "Token") continue;
      try {
        const fields = parsePlaintext(entry.recordPlaintext);
        result.push({
          id:                              entry.commitment,
          owner:                           parseField(fields["owner"]     ?? ""),
          token_id:                        parseField(fields["token_id"]  ?? ""),
          amount:                          parseU128(fields["amount"]     ?? "0u128"),
          external_authorization_required: parseBool(fields["external_authorization_required"] ?? "false"),
          authorized_until:                parseU32(fields["authorized_until"] ?? "0u32"),
          spent:                           entry.spent,
          _record:                         entry.recordPlaintext,
        });
      } catch { /* skip malformed */ }
    }
    return result;
  }, [entries]);

  return { tokenRecords, loading, fetchRecords };
}
