import { useState, useCallback, useEffect, useRef } from "react";
import { useWallet } from "@provablehq/aleo-wallet-adaptor-react";
import { PROGRAM_ID, FEE } from "@/config/network";
import { TX_LABELS } from "@/constants";
import { useTransactionTracker } from "../context/TransactionTrackerContext";
import type { ProgramFunction } from "@/constants";

export type TxStatus = "idle" | "signing" | "submitted" | "error";

interface UseTransactionOptions {
  /** Override the target program (default: PROGRAM_ID / fairdrop.aleo) */
  programId?: string;
  /** Defaults to false (public fee) */
  privateFee?: boolean;
  /** Override the human-readable label shown in the tracker widget */
  label?: string;
}

export function useTransaction(options: UseTransactionOptions = {}) {
  const { address, executeTransaction } = useWallet();
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
    async (functionName: ProgramFunction, inputs: string[]): Promise<string | null> => {
      if (!address || !executeTransaction) return null;

      setLoading(true);
      setStatus("signing");
      setError(null);
      setTxId(null);
      const isPortError = (e: unknown) =>
        e instanceof Error && e.message.includes("Receiving end does not exist");

      const attempt = () =>
        executeTransaction({
          program: optionsRef.current.programId ?? PROGRAM_ID,
          function: functionName,
          inputs,
          fee: FEE,
          privateFee: optionsRef.current.privateFee ?? false,
        });

      try {
        let result = await attempt().catch(async (e) => {
          // Shield extension port not yet ready — wait and retry once.
          if (!isPortError(e)) throw e;
          await new Promise((r) => setTimeout(r, 700));
          return attempt();
        });

        if (!result) throw new Error("Transaction was not submitted");
        const id = result.transactionId;
        setTxId(id);
        setStatus("submitted");

        // Register in the global tracker so the widget picks it up
        const label =
          optionsRef.current.label ??
          TX_LABELS[functionName as ProgramFunction] ??
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
    [address, executeTransaction, addTransaction],
  );

  const clearError = useCallback(() => {
    setError(null);
    setStatus("idle");
  }, []);

  return { execute, loading, status, error, txId, clearError };
}
