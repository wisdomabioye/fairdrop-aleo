import { useState, useEffect, useCallback } from "react";
import { useWallet } from "@provablehq/aleo-wallet-adaptor-react";
import { fetchTokenBalance, fetchCreditsBalance } from "@/shared/lib/tokenRegistry";
import { CREDITS_RESERVED_TOKEN_ID } from "@/shared/types/token";

interface Options {
  /** Poll interval in ms. Omit to fetch once on mount. */
  pollInterval?: number;
}

interface Result {
  /** Raw balance in the token's smallest unit (bigint). null = not loaded yet or no balance. */
  balance: bigint | null;
  loading: boolean;
  refresh: () => void;
}

/**
 * Fetch the connected wallet's public balance for any ARC-21 token.
 *
 * For CREDITS_RESERVED_TOKEN_ID, queries credits.aleo/account directly (microcredits).
 * For all other tokens, queries token_registry.aleo/authorized_balances → balances.
 *
 * Returns null when wallet is disconnected, balance is zero, or lookup fails.
 */
export function useTokenBalance(tokenId: string | null | undefined, opts: Options = {}): Result {
  const { address } = useWallet();
  const { pollInterval } = opts;

  const [balance, setBalance] = useState<bigint | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchBalance = useCallback(async () => {
    if (!address || !tokenId) {
      setBalance(null);
      return;
    }
    setLoading(true);
    try {
      let result: bigint | null = null;
      if (tokenId === CREDITS_RESERVED_TOKEN_ID) {
        result = await fetchCreditsBalance(address);
      } else {
        const bal = await fetchTokenBalance(address, tokenId);
        result = bal?.balance ?? null;
      }
      setBalance(result);
    } finally {
      setLoading(false);
    }
  }, [address, tokenId]);

  useEffect(() => {
    fetchBalance();
  }, [fetchBalance]);

  useEffect(() => {
    if (!address || !tokenId || !pollInterval) return;
    let timeout: ReturnType<typeof setTimeout>;
    const poll = async () => {
      await fetchBalance();
      timeout = setTimeout(poll, pollInterval);
    };
    poll();
    return () => clearTimeout(timeout);
  }, [address, tokenId, pollInterval, fetchBalance]);

  return { balance, loading, refresh: fetchBalance };
}
