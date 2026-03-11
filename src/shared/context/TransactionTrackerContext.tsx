import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
  type ReactNode,
} from "react";
import { useWallet } from "@provablehq/aleo-wallet-adaptor-react";
import { TransactionStatus } from "@provablehq/aleo-types";
import { useRefresh } from "./RefreshContext";

export type TxStatus = "pending" | "confirmed" | "failed";

export interface TrackedTx {
  id: string;
  /** Wallet-internal transaction ID returned by executeTransaction */
  txId: string;
  /** On-chain Aleo transaction ID (at1…) — available as soon as the wallet indexes it */
  aleoId?: string;
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
  const { transactionStatus } = useWallet();
  const { refreshAll } = useRefresh();

  const [transactions, setTransactions] = useState<TrackedTx[]>([]);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const attemptsRef = useRef<Map<string, number>>(new Map());
  // Stable refs so interval callbacks always see the latest values without re-creating pollPending
  const transactionsRef = useRef<TrackedTx[]>([]);
  transactionsRef.current = transactions;
  const transactionStatusRef = useRef(transactionStatus);
  transactionStatusRef.current = transactionStatus;

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
          const statusFn = transactionStatusRef.current;
          if (!statusFn) return;
          const result = await statusFn(txId);
          const s = result.status.toLowerCase();

          // Store the on-chain ID as soon as the wallet returns it (even while pending)
          // so the explorer link appears in the widget immediately.
          if (result.transactionId) {
            setTransactions((prev) =>
              prev.map((t) =>
                t.txId === txId && !t.aleoId ? { ...t, aleoId: result.transactionId } : t
              )
            );
          }

          if (s === TransactionStatus.ACCEPTED) {
            confirmTx(txId, result.transactionId);
          } else if (s === TransactionStatus.FAILED || s === TransactionStatus.REJECTED) {
            failTx(txId);
          }
        } catch {
          /* network / wallet error — retry next tick */
        }
      })
    );
  }, [confirmTx, failTx]);

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
