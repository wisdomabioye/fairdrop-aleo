import { useState, useCallback, useEffect } from "react";
import { useWallet } from "@provablehq/aleo-wallet-adaptor-react";
import type { WalletRecord } from "@/shared/types/wallet";
import { isWalletRecord } from "@/shared/types/wallet";
import { useRefresh } from "@/shared/context/RefreshContext";

interface Options {
  pollInterval?: number;
  fetchOnMount?: boolean;
}

/**
 * Base primitive: fetches all decrypted records for one program.
 * Build domain-specific hooks (useTokenRecords, useBidRecords, …) on top of this.
 */
export function useWalletRecords(
  programId: string,
  { pollInterval, fetchOnMount = true }: Options = {},
) {
  const { address, requestRecords } = useWallet();
  const { recordsRevision } = useRefresh();
  const [entries, setEntries] = useState<WalletRecord[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchRecords = useCallback(async () => {
    if (!address || !requestRecords) return;
    setLoading(true);
    try {
      const raw = await requestRecords(programId, true);
      setEntries(raw.filter(isWalletRecord) as WalletRecord[]);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      const silent = e instanceof Error && (
        e.name === "WalletNotConnectedError" ||
        msg.includes("No response")
      );
      if (!silent) console.error(`[useWalletRecords:${programId}]`, e);
    } finally {
      setLoading(false);
    }
  }, [address, requestRecords, programId]);

  useEffect(() => {
    if (address && fetchOnMount) fetchRecords();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [address]);

  useEffect(() => {
    if (address && recordsRevision > 0) fetchRecords();
  }, [recordsRevision, address, fetchRecords]);

  useEffect(() => {
    if (!address || !pollInterval) return;
    let timeout: ReturnType<typeof setTimeout>;
    const poll = async () => {
      await fetchRecords();
      timeout = setTimeout(poll, pollInterval);
    };
    poll();
    return () => clearTimeout(timeout);
  }, [address, pollInterval, fetchRecords]);

  return { entries, loading, fetchRecords };
}
