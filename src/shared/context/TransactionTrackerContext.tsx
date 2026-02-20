import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
  type ReactNode,
} from "react";
import { useWallet } from "@demox-labs/aleo-wallet-adapter-react";
import { useRefresh } from "./RefreshContext";

export type TxStatus = "pending" | "confirmed" | "failed";

export interface TrackedTx {
  /** Internal React key */
  id: string;
  /** Wallet-internal UUID returned by requestTransaction */
  txId: string;
  /**
   * Resolved on-chain Aleo transaction ID (at1…).
   * Populated after confirmation if the RPC can map the wallet UUID to the real hash.
   */
  aleoId?: string;
  /** Human-readable label e.g. "Join Records" */
  label: string;
  status: TxStatus;
  timestamp: number;
}

interface ContextValue {
  transactions: TrackedTx[];
  addTransaction: (txId: string, label: string) => void;
  clearCompleted: () => void;
}

const TransactionTrackerContext = createContext<ContextValue | null>(null);

const MAX_POLL_ATTEMPTS = 72; // 72 × 5 s ≈ 6 min before marking failed

export function TransactionTrackerProvider({ children }: { children: ReactNode }) {
  // transactionStatus is the wallet-native status checker — accepts UUIDs correctly
  const { transactionStatus } = useWallet();
  const { refreshAll } = useRefresh();

  const [transactions, setTransactions] = useState<TrackedTx[]>([]);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const attemptsRef = useRef<Map<string, number>>(new Map());
  // Stable ref so the interval callback always sees the latest list
  const transactionsRef = useRef<TrackedTx[]>([]);
  transactionsRef.current = transactions;

  const confirmTx = useCallback((txId: string, aleoId?: string) => {
    setTransactions((prev) =>
      prev.map((t) =>
        t.txId === txId ? { ...t, status: "confirmed", ...(aleoId ? { aleoId } : {}) } : t
      )
    );
    attemptsRef.current.delete(txId);
    refreshAll();
  }, [refreshAll]);

  const failTx = useCallback((txId: string) => {
    setTransactions((prev) =>
      prev.map((t) => (t.txId === txId ? { ...t, status: "failed" } : t))
    );
    attemptsRef.current.delete(txId);
  }, []);

  const pollPending = useCallback(async () => {
    const pending = transactionsRef.current.filter((t) => t.status === "pending");
    if (pending.length === 0) return;

    await Promise.all(
      pending.map(async ({ txId }) => {
        const attempts = (attemptsRef.current.get(txId) ?? 0) + 1;
        attemptsRef.current.set(txId, attempts);

        if (attempts > MAX_POLL_ATTEMPTS) {
          failTx(txId);
          return;
        }

        try {
          if (!transactionStatus) return;
          // Use the wallet's native status API — correctly handles UUID-format txIds
          const result = await transactionStatus(txId);
          const s = typeof result === "string" ? result : String(result);

          if (s.includes("Finalized") || s.includes("Confirmed") || s.includes("Accepted") || s.includes("Completed")) {
            // Attempt to resolve the actual on-chain Aleo hash (at1…) for the explorer link.
            // The Provable API may map the wallet UUID to the real transaction if submitted
            // through the same gateway; if not it returns 4xx and we skip gracefully.
            let aleoId: string | undefined;
         
            confirmTx(txId, aleoId);
          } else if (s.includes("Failed") || s.includes("Rejected")) {
            failTx(txId);
          }
        } catch {
          /* network / wallet error — retry next tick */
        }
      })
    );
  }, [transactionStatus, confirmTx, failTx]);

  // Start/stop polling based on whether there are pending transactions
  const hasPending = transactions.some((t) => t.status === "pending");

  useEffect(() => {
    if (!hasPending) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    if (!intervalRef.current) {
      intervalRef.current = setInterval(pollPending, 5_000);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [hasPending, pollPending]);

  const addTransaction = useCallback((txId: string, label: string) => {
    attemptsRef.current.set(txId, 0);
    setTransactions((prev) => [
      ...prev,
      { id: crypto.randomUUID(), txId, label, status: "pending", timestamp: Date.now() },
    ]);
  }, []);

  const clearCompleted = useCallback(() => {
    setTransactions((prev) => prev.filter((t) => t.status === "pending"));
  }, []);

  return (
    <TransactionTrackerContext.Provider value={{ transactions, addTransaction, clearCompleted }}>
      {children}
    </TransactionTrackerContext.Provider>
  );
}

export function useTransactionTracker() {
  const ctx = useContext(TransactionTrackerContext);
  if (!ctx) {
    return {
      transactions: [] as TrackedTx[],
      addTransaction: (_txId: string, _label: string) => {},
      clearCompleted: () => {},
    };
  }
  return ctx;
}
