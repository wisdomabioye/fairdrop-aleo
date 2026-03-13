import { useState, useEffect, useCallback } from "react";
import { fetchTokenMetadata } from "@/shared/lib/tokenRegistry";
import type { TokenMetadata } from "@/shared/types/token";

/**
 * Fetch and cache TokenMetadata for one or more token IDs.
 * Cache is module-level — shared across all hook instances so each
 * token ID is fetched at most once per page load.
 *
 * Usage — single token:
 *   const { metadata, loading } = useTokenMetadata(tokenId);
 *
 * Usage — multiple tokens:
 *   const { metadataMap, loading } = useTokenMetadata(tokenIds);
 */

// Module-level cache: tokenId → TokenMetadata (shared across all consumers)
const globalCache = new Map<string, TokenMetadata>();

// In-flight fetch promises to deduplicate concurrent requests for the same ID
const inflight = new Map<string, Promise<TokenMetadata | null>>();

function fetchOnce(tokenId: string): Promise<TokenMetadata | null> {
  const cached = globalCache.get(tokenId);
  if (cached) return Promise.resolve(cached);

  let pending = inflight.get(tokenId);
  if (!pending) {
    pending = fetchTokenMetadata(tokenId).then((m) => {
      inflight.delete(tokenId);
      if (m) globalCache.set(tokenId, m);
      return m;
    });
    inflight.set(tokenId, pending);
  }
  return pending;
}

// ── Single token overload ────────────────────────────────────────────────────

export function useTokenMetadata(tokenId: string | null | undefined): {
  metadata: TokenMetadata | null;
  loading: boolean;
  refresh: () => void;
};

// ── Multiple tokens overload ─────────────────────────────────────────────────

export function useTokenMetadata(tokenIds: string[]): {
  metadataMap: Map<string, TokenMetadata>;
  loading: boolean;
  refresh: () => void;
};

// ── Implementation ───────────────────────────────────────────────────────────

export function useTokenMetadata(
  input: string | string[] | null | undefined,
): {
  metadata?: TokenMetadata | null;
  metadataMap?: Map<string, TokenMetadata>;
  loading: boolean;
  refresh: () => void;
} {
  const isArray = Array.isArray(input);

  // Stabilize array input so the effect only re-runs when actual IDs change.
  const stableKey = isArray
    ? (input as string[]).slice().sort().join("\n")
    : (input ?? "");

  const [metadata, setMetadata] = useState<TokenMetadata | null>(null);
  const [metadataMap, setMetadataMap] = useState<Map<string, TokenMetadata>>(new Map());
  const [loading, setLoading] = useState(false);

  const [revision, setRevision] = useState(0);

  useEffect(() => {
    if (!stableKey) return;
    let cancelled = false;

    (async () => {
      setLoading(true);
      try {
        if (isArray) {
          const ids = stableKey.split("\n").filter(Boolean);
          await Promise.all(ids.map((id) => fetchOnce(id)));

          if (cancelled) return;
          const next = new Map<string, TokenMetadata>();
          for (const id of ids) {
            const m = globalCache.get(id);
            if (m) next.set(id, m);
          }
          setMetadataMap(next);
        } else {
          const m = await fetchOnce(stableKey);
          if (!cancelled) setMetadata(m);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stableKey, isArray, revision]);

  const refresh = useCallback(() => {
    globalCache.clear();
    inflight.clear();
    setRevision((r) => r + 1);
  }, []);

  return isArray ? { metadataMap, loading, refresh } : { metadata, loading, refresh };
}
