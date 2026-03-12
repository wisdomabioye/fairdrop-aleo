import { useMemo } from "react";
import { useTokenRecords } from "./useTokenRecords";
import { useTokenMetadata } from "./useTokenMetadata";
import type { TokenMetadata } from "@/shared/types/token";

export interface CreatorToken {
  tokenId: string;
  metadata: TokenMetadata | null;
  /** Sum of unspent Token record amounts in the connected wallet. */
  ownedAmount: bigint;
}

/**
 * Returns all tokens for which the wallet holds unspent records,
 * enriched with metadata (symbol/name) and SUPPLY_MANAGER_ROLE status.
 */
export function useCreatorTokens() {
  const { tokenRecords, loading: recordsLoading } = useTokenRecords();
  // Stable array of unique token IDs from unspent records
  const uniqueTokenIds = useMemo(
    () => Array.from(new Set(tokenRecords.filter((r) => !r.spent).map((r) => r.token_id))),
    [tokenRecords],
  );

  const { metadataMap, loading: metaLoading } = useTokenMetadata(uniqueTokenIds);

  const creatorTokens = useMemo<CreatorToken[]>(
    () => uniqueTokenIds.map((id) => ({
      tokenId:    id,
      metadata:   metadataMap.get(id) ?? null,
      ownedAmount: tokenRecords
        .filter((r) => r.token_id === id && !r.spent)
        .reduce((sum, r) => sum + r.amount, 0n),
    })),
    [uniqueTokenIds, metadataMap, tokenRecords],
  );

  return {
    creatorTokens,
    metadataMap,
    loading: recordsLoading || metaLoading,
    refresh: () => {},
  };
}
