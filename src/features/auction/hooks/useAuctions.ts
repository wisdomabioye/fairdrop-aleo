import { useState, useCallback, useEffect } from "react";
import {
  getStats,
  getAuctionIndex,
  getAuctionConfig,
  getAuctionState,
} from "@/shared/lib/mappings";
import {
  partitionByCache,
  cacheConfigs,
  getCachedGlobalIds,
  cacheGlobalIds,
} from "@/shared/lib/auctionConfigCache";
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
  /** Maximum auctions to load (newest first). Default: 50. */
  limit?: number;
}

/**
 * Enumerates all on-chain auctions using the global `auction_index` mapping.
 * Use this for the public dashboard view.
 *
 * For the connected user's own auctions, use `useUserAuctions` instead —
 * it traverses the per-creator linked list and avoids scanning all auctions.
 *
 * Flow:
 *  1. Read `stats` → get total_auctions count
 *  2. Batch-fetch `auction_index[n-1..0]` (newest first, up to limit)
 *  3. Configs: cache-first (immutable after creation)
 *  4. States: always fresh
 */
export function useAuctions(options: UseAuctionsOptions = {}) {
  const { limit = 50 } = options;

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

      // 2. Fetch auction IDs newest-first — use cache if count hasn't changed.
      //    Cache is keyed by count so any new auction automatically invalidates it.
      let validIds: string[];
      const cachedIds = getCachedGlobalIds(count);

      if (cachedIds) {
        validIds = cachedIds.slice(0, limit);
      } else {
        const startIdx = Math.max(0, count - limit);
        const indices = Array.from(
          { length: count - startIdx },
          (_, i) => count - 1 - i,
        );
        const idResults = await Promise.all(indices.map((i) => getAuctionIndex(i)));
        validIds = idResults.filter((id): id is string => !!id);
        cacheGlobalIds(count, validIds);
      }

      // 3. Configs: cache-first
      const { hit: cachedConfigs, miss: uncachedIds } = partitionByCache(validIds);
      const fetchedPairs = await Promise.all(
        uncachedIds.map(async (id) => [id, await getAuctionConfig(id)] as const)
      );
      const newlyFetched: Record<string, string> = {};
      for (const [id, raw] of fetchedPairs) {
        if (raw) newlyFetched[id] = raw;
      }
      cacheConfigs(newlyFetched);
      const allConfigRaws: Record<string, string> = { ...cachedConfigs, ...newlyFetched };

      // 4. States: always fresh (parallel)
      const entries = await Promise.all(
        validIds.map(async (id): Promise<AuctionEntry | null> => {
          const configRaw = allConfigRaws[id];
          if (!configRaw) return null;
          try {
            const stateRaw = await getAuctionState(id);
            return {
              config: parseAuctionConfig(configRaw),
              state: stateRaw ? parseAuctionState(stateRaw) : null,
            };
          } catch {
            return null;
          }
        })
      );

      setAuctions(entries.filter((e): e is AuctionEntry => e !== null));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load auctions");
    } finally {
      setLoading(false);
    }
  }, [limit]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { auctions, total, loading, error, refetch: fetch };
}
