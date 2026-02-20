import { useState, useCallback, useEffect, useRef } from "react";
import { useWallet } from "@demox-labs/aleo-wallet-adapter-react";
import {
  Transaction,
  WalletAdapterNetwork,
} from "@demox-labs/aleo-wallet-adapter-base";
import { PROGRAM_ID, FEE, TX_LABELS } from "@/constants";
import { useTransactionTracker } from "../context/TransactionTrackerContext";

export type TxStatus = "idle" | "signing" | "submitted" | "error";

interface UseTransactionOptions {
  /** Defaults to false (public fee) */
  privateFee?: boolean;
  /** Override the human-readable label shown in the tracker widget */
  label?: string;
}

export function useTransaction(options: UseTransactionOptions = {}) {
  const { publicKey, requestTransaction } = useWallet();
  const { addTransaction } = useTransactionTracker();

  // Keep options accessible inside execute without adding them to its deps
  const optionsRef = useRef(options);
  useEffect(() => { optionsRef.current = options; });

  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<TxStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [txId, setTxId] = useState<string | null>(null);

  // Auto-reset "submitted" → "idle" after 3 s so buttons return to their normal state
  useEffect(() => {
    if (status !== "submitted") return;
    const timer = setTimeout(() => setStatus("idle"), 3_000);
    return () => clearTimeout(timer);
  }, [status]);

  const execute = useCallback(
    async (functionName: string, inputs: unknown[]): Promise<string | null> => {
      if (!publicKey || !requestTransaction) return null;

      setLoading(true);
      setStatus("signing");
      setError(null);
      setTxId(null);
      try {
        const tx = Transaction.createTransaction(
          publicKey,
          WalletAdapterNetwork.TestnetBeta,
          PROGRAM_ID,
          functionName,
          inputs,
          FEE,
          optionsRef.current.privateFee ?? false,
        );

        const id = await requestTransaction(tx);
        setTxId(id);
        setStatus("submitted");

        // Register in the global tracker so the widget picks it up
        const label =
          optionsRef.current.label ??
          TX_LABELS[functionName] ??
          functionName;
        addTransaction(id, label);

        return id;
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Transaction failed";
        setError(msg);
        setStatus("error");
        return null;
      } finally {
        setLoading(false);
      }
    },
    [publicKey, requestTransaction, addTransaction],
  );

  const clearError = useCallback(() => {
    setError(null);
    setStatus("idle");
  }, []);

  return { execute, loading, status, error, txId, clearError };
}
