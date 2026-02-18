import { useState, useEffect } from "react";
import { getNetworkClient } from "../lib/networkClient";

export function useBlockHeight(pollInterval = 5000) {
  const [blockHeight, setBlockHeight] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const fetchHeight = async () => {
      try {
        const client = getNetworkClient();
        const height = await client.getLatestHeight();
        if (active) {
          setBlockHeight(Number(height));
          setLoading(false);
        }
      } catch {
        // silently retry on next poll
      }
    };

    fetchHeight();
    const id = setInterval(fetchHeight, pollInterval);
    return () => {
      active = false;
      clearInterval(id);
    };
  }, [pollInterval]);

  return { blockHeight, loading };
}
