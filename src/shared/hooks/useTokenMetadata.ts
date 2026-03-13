import { useState, useEffect, useCallback, useRef } from "react";
import { fetchTokenMetadata } from "@/shared/lib/tokenRegistry";
import type { TokenMetadata } from "@/shared/types/token";

/**
 * Fetch and cache TokenMetadata for one or more token IDs.
 *
 * Usage — single token:
 *   const { metadata, loading } = useTokenMetadata(tokenId);
 *
 * Usage — multiple tokens:
 *   const { metadataMap, loading } = useTokenMetadata(tokenIds);
 */

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

  // Stabilize array input: serialize to a string so the effect only re-runs
  // when the actual IDs change, not on every render (new array reference).
  const stableKey = isArray
    ? (input as string[]).slice().sort().join("\n")
    : (input ?? "");

  const [metadata, setMetadata] = useState<TokenMetadata | null>(null);
  const [metadataMap, setMetadataMap] = useState<Map<string, TokenMetadata>>(new Map());
  const [loading, setLoading] = useState(false);

  // Cache: tokenId → TokenMetadata (lives for the lifetime of this hook instance)
  const cache = useRef<Map<string, TokenMetadata>>(new Map());

  const [revision, setRevision] = useState(0);

  useEffect(() => {
    if (!stableKey) return;
    let cancelled = false;

    (async () => {
      setLoading(true);
      try {
        if (isArray) {
          const ids = stableKey.split("\n").filter(Boolean);
          const uncached = ids.filter((id) => !cache.current.has(id));

          if (uncached.length > 0) {
            const results = await Promise.all(uncached.map((id) => fetchTokenMetadata(id)));
            uncached.forEach((id, i) => {
              if (results[i]) cache.current.set(id, results[i]!);
            });
          }

          if (cancelled) return;
          const next = new Map<string, TokenMetadata>();
          for (const id of ids) {
            const m = cache.current.get(id);
            if (m) next.set(id, m);
          }
          setMetadataMap(next);
        } else {
          const id = stableKey;
          if (cache.current.has(id)) {
            if (!cancelled) setMetadata(cache.current.get(id)!);
          } else {
            const m = await fetchTokenMetadata(id);
            if (!cancelled) {
              if (m) cache.current.set(id, m);
              setMetadata(m);
            }
          }
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stableKey, isArray, revision]);

  const refresh = useCallback(() => {
    cache.current.clear();
    setRevision((r) => r + 1);
  }, []);

  return isArray ? { metadataMap, loading, refresh } : { metadata, loading, refresh };
}
