import { useState, useEffect, useCallback, useRef } from "react";
import { getAuctionConfig, getAuctionState } from "@/shared/lib/mappings";
import {
  parseAuctionConfig,
  parseAuctionState,
  type AuctionConfig,
  type AuctionState,
} from "@/shared/types/auction";
import { useRefresh } from "@/shared/context/RefreshContext";

export function useAuction(
  auctionId: string | undefined,
  { pollInterval }: { pollInterval?: number } = {},
) {
  const { auctionsRevision } = useRefresh();
  const [config, setConfig] = useState<AuctionConfig | null>(null);
  const [state, setState] = useState<AuctionState | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const hasDataRef = useRef(false);

  // Returns the freshly-parsed state so polling can inspect it without relying
  // on React state (which is batched and may not reflect yet at call time).
  const fetch = useCallback(async (): Promise<AuctionState | null> => {
    if (!auctionId) return null;
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
        return null;
      }

      const parsedState = stateRaw ? parseAuctionState(stateRaw) : null;
      hasDataRef.current = true;
      setConfig(parseAuctionConfig(configRaw));
      setState(parsedState);
      return parsedState;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to fetch auction");
      return null;
    } finally {
      setLoading(false);
    }
  }, [auctionId]);

  // Reset on auction switch
  useEffect(() => {
    hasDataRef.current = false;
  }, [auctionId]);

  // Fetch on mount and on global refresh signal
  useEffect(() => {
    fetch();
  }, [fetch, auctionsRevision]);

  // Intelligent polling — stops automatically once the auction is cleared
  // (terminal state: no further mapping changes possible)
  useEffect(() => {
    if (!auctionId || !pollInterval) return;
    let timeout: ReturnType<typeof setTimeout>;

    const poll = async () => {
      const latestState = await fetch();
      // Cleared = terminal state, no more on-chain changes expected
      if (!latestState?.cleared) {
        timeout = setTimeout(poll, pollInterval);
      }
    };

    timeout = setTimeout(poll, pollInterval);
    return () => clearTimeout(timeout);
  }, [auctionId, pollInterval, fetch]);

  return { config, state, loading, error, refetch: fetch };
}
