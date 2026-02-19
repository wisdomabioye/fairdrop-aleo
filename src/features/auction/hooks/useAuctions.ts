import { useState, useCallback, useEffect } from "react";
import {
  getStats,
  getAuctionIndex,
  getAuctionConfig,
  getAuctionState,
} from "@/shared/lib/mappings";
import {
  parseStats,
  parseAuctionConfig,
  parseAuctionState,
  type AuctionConfig,
  type AuctionState,
} from "@/shared/types/auction";

export interface AuctionEntry {
  config: AuctionConfig;
  state: AuctionState | null;
}

interface UseAuctionsOptions {
  /** If set, only returns auctions created by this address. */
  creatorFilter?: string;
  /** Maximum auctions to load (newest first). Default: 50. */
  limit?: number;
}

/**
 * Enumerates all on-chain auctions using the `auction_index` mapping.
 *
 * Flow:
 *  1. Read `stats` → get total_auctions count
 *  2. Batch-fetch `auction_index[n-1..0]` (newest first) → get auction IDs
 *  3. Batch-fetch `auction_configs` + `auction_states` for each ID
 *  4. Optionally filter by creator address
 *
 * Falls back to an empty list if the `auction_index` mapping hasn't been
 * deployed yet (program upgrade required).
 */
export function useAuctions(options: UseAuctionsOptions = {}) {
  const { creatorFilter, limit = 50 } = options;

  const [auctions, setAuctions] = useState<AuctionEntry[]>([]);
  const [total, setTotal] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // 1. Get total auction count
      const statsRaw = await getStats();
      if (!statsRaw) {
        setAuctions([]);
        setTotal(0);
        return;
      }
      const stats = parseStats(statsRaw);
      const count = stats.total_auctions;
      setTotal(count);

      if (count === 0) {
        setAuctions([]);
        return;
      }

      // 2. Build index list — newest first, capped at limit
      const startIdx = Math.max(0, count - limit);
      const indices = Array.from(
        { length: count - startIdx },
        (_, i) => count - 1 - i  // descending: newest first
      );

      // 3. Batch-fetch auction IDs from the index
      const idResults = await Promise.all(indices.map((i) => getAuctionIndex(i)));

      // 4. Batch-fetch config + state for all valid IDs
      const validIds = idResults.filter((id): id is string => !!id);
      const entries = await Promise.all(
        validIds.map(async (id): Promise<AuctionEntry | null> => {
          try {
            const [configRaw, stateRaw] = await Promise.all([
              getAuctionConfig(id),
              getAuctionState(id),
            ]);
            if (!configRaw) return null;
            return {
              config: parseAuctionConfig(configRaw),
              state: stateRaw ? parseAuctionState(stateRaw) : null,
            };
          } catch {
            return null;
          }
        })
      );

      let result = entries.filter((e): e is AuctionEntry => e !== null);

      // 5. Apply creator filter if requested
      if (creatorFilter) {
        result = result.filter((e) => e.config.creator === creatorFilter);
      }

      setAuctions(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load auctions");
    } finally {
      setLoading(false);
    }
  }, [creatorFilter, limit]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { auctions, total, loading, error, refetch: fetch };
}
