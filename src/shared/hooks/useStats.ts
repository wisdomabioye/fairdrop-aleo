import { useState, useEffect, useCallback, useRef } from "react";
import { getStats } from "@/shared/lib/mappings";
import { parseStats } from "@/shared/lib/auctionParsers";
import { useRefresh } from "@/shared/context/RefreshContext";
import type { Stats } from "@/shared/types/auction";

const POLL_INTERVAL = 15_000;

export function useStats() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const { auctionsRevision } = useRefresh();
  const activeRef = useRef(true);

  const fetchStats = useCallback(async () => {
    try {
      const raw = await getStats();
      if (activeRef.current && raw) setStats(parseStats(raw));
    } catch {
      // silently retry on next poll
    } finally {
      if (activeRef.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    activeRef.current = true;

    let timer: ReturnType<typeof setTimeout>;

    const poll = async () => {
      await fetchStats();
      if (activeRef.current) {
        timer = setTimeout(poll, POLL_INTERVAL);
      }
    };

    poll();

    return () => {
      activeRef.current = false;
      clearTimeout(timer);
    };
  }, [fetchStats, auctionsRevision]);

  return { stats, loading, refetch: fetchStats };
}
