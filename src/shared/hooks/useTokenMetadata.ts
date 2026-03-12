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

  const [metadata, setMetadata] = useState<TokenMetadata | null>(null);
  const [metadataMap, setMetadataMap] = useState<Map<string, TokenMetadata>>(new Map());
  const [loading, setLoading] = useState(false);

  // Cache: tokenId → TokenMetadata (lives for the lifetime of this hook instance)
  const cache = useRef<Map<string, TokenMetadata>>(new Map());

  const fetch = useCallback(async () => {
    if (!input || (isArray && (input as string[]).length === 0)) return;

    setLoading(true);
    try {
      if (isArray) {
        const ids = input as string[];
        const uncached = ids.filter((id) => !cache.current.has(id));

        // Fetch all uncached IDs in parallel
        const results = await Promise.all(uncached.map((id) => fetchTokenMetadata(id)));
        uncached.forEach((id, i) => {
          if (results[i]) cache.current.set(id, results[i]!);
        });

        const next = new Map<string, TokenMetadata>();
        for (const id of ids) {
          const m = cache.current.get(id);
          if (m) next.set(id, m);
        }
        setMetadataMap(next);
      } else {
        const id = input as string;
        if (cache.current.has(id)) {
          setMetadata(cache.current.get(id)!);
        } else {
          const m = await fetchTokenMetadata(id);
          if (m) cache.current.set(id, m);
          setMetadata(m);
        }
      }
    } finally {
      setLoading(false);
    }
  }, [input, isArray]);

  // Bust cache on refresh so stale supply/decimals are re-read
  const refresh = useCallback(() => {
    cache.current.clear();
    fetch();
  }, [fetch]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return isArray ? { metadataMap, loading, refresh } : { metadata, loading, refresh };
}
