import { useState, useCallback, useEffect } from "react";
import { useWallet } from "@demox-labs/aleo-wallet-adapter-react";
import {
  getCreatorAuctionCount,
  getCreatorLatestAuction,
  getAuctionPrevByCreator,
  getAuctionConfig,
  getAuctionState,
} from "@/shared/lib/mappings";
import {
  partitionByCache,
  cacheConfigs,
  getCachedCreatorIds,
  cacheCreatorIds,
} from "@/shared/lib/auctionConfigCache";
import {
  parseAuctionConfig,
  parseAuctionState,
  type AuctionConfig,
  type AuctionState,
} from "@/shared/types/auction";

export interface AuctionEntry {
  config: AuctionConfig;
  state: AuctionState | null;
}

/**
 * Fetches only the connected user's own auctions using a per-creator linked
 * list stored on-chain — no global scan, no BHP256.
 *
 * Flow:
 *  1. creator_auction_count[address] → K  (instant zero-check)
 *  2. creator_latest_auction[address] → head auction_id
 *  3. auction_prev_by_creator[id] → prev id → ... until 0field  (K sequential steps)
 *  4. Configs: cache-first. States: always fresh.
 */
export function useUserAuctions() {
  const { publicKey } = useWallet();
  const [auctions, setAuctions] = useState<AuctionEntry[]>([]);
  const [count, setCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    if (!publicKey) {
      setAuctions([]);
      setCount(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // 1. Quick count — skip everything if zero
      const k = await getCreatorAuctionCount(publicKey);
      setCount(k);
      if (k === 0) {
        setAuctions([]);
        return;
      }

      // 2. Use cached ID list if count matches — skip linked list traversal entirely.
      //    If count differs (new auction created), traverse to get updated list.
      let ids: string[];
      const cachedIds = getCachedCreatorIds(publicKey);

      if (cachedIds && cachedIds.length === k) {
        ids = cachedIds;
      } else {
        ids = [];
        let cursor = await getCreatorLatestAuction(publicKey);
        while (cursor && cursor !== "0field" && ids.length < k) {
          ids.push(cursor);
          cursor = await getAuctionPrevByCreator(cursor);
        }
        cacheCreatorIds(publicKey, ids);
      }

      if (ids.length === 0) {
        setAuctions([]);
        return;
      }

      // 3. Configs: cache-first (immutable after creation)
      const { hit: cachedConfigs, miss: uncachedIds } = partitionByCache(ids);
      const fetchedPairs = await Promise.all(
        uncachedIds.map(async (id) => [id, await getAuctionConfig(id)] as const)
      );
      const newlyFetched: Record<string, string> = {};
      for (const [id, raw] of fetchedPairs) {
        if (raw) newlyFetched[id] = raw;
      }
      cacheConfigs(newlyFetched);
      const allConfigRaws = { ...cachedConfigs, ...newlyFetched };

      // 4. States: always fresh (parallel)
      const entries = await Promise.all(
        ids.map(async (id): Promise<AuctionEntry | null> => {
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
      setError(e instanceof Error ? e.message : "Failed to load your auctions");
    } finally {
      setLoading(false);
    }
  }, [publicKey]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { auctions, count, loading, error, refetch: fetch };
}
