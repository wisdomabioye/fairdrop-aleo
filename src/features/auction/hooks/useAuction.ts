import { useState, useEffect, useCallback, useRef } from "react";
import { getAuctionConfig, getAuctionState } from "@/shared/lib/mappings";
import {
  parseAuctionConfig,
  parseAuctionState,
  type AuctionConfig,
  type AuctionState,
} from "@/shared/types/auction";
import { useRefresh } from "@/shared/context/RefreshContext";

export function useAuction(auctionId: string | undefined) {
  const { auctionsRevision } = useRefresh();
  const [config, setConfig] = useState<AuctionConfig | null>(null);
  const [state, setState] = useState<AuctionState | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const hasDataRef = useRef(false);

  const fetch = useCallback(async () => {
    if (!auctionId) return;
    // Only show loading spinner on first fetch — background re-fetches are silent
    if (!hasDataRef.current) setLoading(true);
    setError(null);

    try {
      const [configRaw, stateRaw] = await Promise.all([
        getAuctionConfig(auctionId),
        getAuctionState(auctionId),
      ]);

      if (!configRaw) {
        setError("Auction not found");
        setConfig(null);
        setState(null);
      } else {
        hasDataRef.current = true;
        setConfig(parseAuctionConfig(configRaw));
        setState(stateRaw ? parseAuctionState(stateRaw) : null);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to fetch auction");
    } finally {
      setLoading(false);
    }
  }, [auctionId]);

  // Reset "has data" flag when switching to a different auction
  useEffect(() => {
    hasDataRef.current = false;
  }, [auctionId]);

  useEffect(() => {
    fetch();
  }, [fetch, auctionsRevision]);

  return { config, state, loading, error, refetch: fetch };
}
