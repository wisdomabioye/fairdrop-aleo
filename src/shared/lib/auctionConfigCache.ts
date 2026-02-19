/**
 * Persistent cache for `auction_configs` mapping values.
 *
 * AuctionConfig is write-once on-chain (no transition updates it after creation),
 * so cached values never go stale. The version suffix in the key allows a clean
 * bust if the AuctionConfig struct shape ever changes after a redeploy.
 *
 * Stored as: Record<auction_id, raw_config_string>
 */

const KEY = "fairdrop_configs_v1";

type RawConfigMap = Record<string, string>;

function load(): RawConfigMap {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as RawConfigMap) : {};
  } catch {
    return {};
  }
}

function save(map: RawConfigMap): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(map));
  } catch {
    // Quota exceeded — cache is best-effort, silently skip
  }
}

/** Read a single cached config string. Returns null if not cached. */
export function getCachedConfig(auctionId: string): string | null {
  return load()[auctionId] ?? null;
}

/**
 * Given a list of auction IDs, returns two groups:
 *  - `hit`: ids that are already cached, with their raw config strings
 *  - `miss`: ids not yet in cache (need to be fetched from RPC)
 */
export function partitionByCache(ids: string[]): {
  hit: Record<string, string>;
  miss: string[];
} {
  const map = load();
  const hit: Record<string, string> = {};
  const miss: string[] = [];
  for (const id of ids) {
    if (map[id]) {
      hit[id] = map[id];
    } else {
      miss.push(id);
    }
  }
  return { hit, miss };
}

/** Persist newly fetched config strings into the cache. */
export function cacheConfigs(entries: Record<string, string>): void {
  if (Object.keys(entries).length === 0) return;
  const map = load();
  Object.assign(map, entries);
  save(map);
}
