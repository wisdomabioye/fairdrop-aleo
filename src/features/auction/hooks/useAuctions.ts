import { useState, useCallback, useEffect } from "react";
import {
  getStats,
  getAuctionIndex,
  getAuctionConfig,
  getAuctionState,
} from "@/shared/lib/mappings";
import { partitionByCache, cacheConfigs } from "@/shared/lib/auctionConfigCache";
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
 *  3. Configs: serve from localStorage cache; only RPC-fetch what's missing
 *     (configs are immutable after creation, so cached values never go stale)
 *  4. States: always fetched fresh (mutate throughout the auction lifecycle)
 *  5. Optionally filter by creator address
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

      // 4. Fetch configs (cache-first) + states (always fresh)
      const validIds = idResults.filter((id): id is string => !!id);

      // Configs are immutable after creation — serve from cache where possible
      const { hit: cachedConfigs, miss: uncachedIds } = partitionByCache(validIds);

      // Only go to RPC for configs we don't have locally
      const fetchedConfigPairs = await Promise.all(
        uncachedIds.map(async (id) => {
          const raw = await getAuctionConfig(id);
          return [id, raw] as const;
        })
      );
      const newlyFetched: Record<string, string> = {};
      for (const [id, raw] of fetchedConfigPairs) {
        if (raw) newlyFetched[id] = raw;
      }
      cacheConfigs(newlyFetched); // persist for next load

      // Merge cache hits + freshly fetched into one lookup
      const allConfigRaws: Record<string, string> = { ...cachedConfigs, ...newlyFetched };

      // States always fetched fresh (they mutate throughout the auction lifecycle)
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
