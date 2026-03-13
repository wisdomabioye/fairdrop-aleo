import { useState, useCallback, useEffect, useRef } from "react";
import { useWallet } from "@provablehq/aleo-wallet-adaptor-react";
import { PROGRAM_ID, FEE } from "@/config/network";
import { TX_LABELS } from "@/constants";
import {
  useTrackedTransaction,
  useTransactionTracker,
  type TrackedTx,
  type TrackedTxStatus,
} from "../context/TransactionTrackerContext";
import type { ProgramFunction } from "@/constants";

export type TxStatus = "idle" | "signing" | TrackedTxStatus;

interface UseTransactionOptions {
  /** Override the target program (default: PROGRAM_ID / fairdrop.aleo) */
  programId?: string;
  /** Defaults to false (public fee) */
  privateFee?: boolean;
  /** Override the human-readable label shown in the tracker widget */
  label?: string;
  /** Fires once when the tracked transaction reaches "confirmed" on-chain */
  onConfirmed?: (txId: string) => void;
  /** Fires once when the tracked transaction reaches "failed" */
  onFailed?: (txId: string) => void;
}

interface UseTransactionResult {
  execute: (functionName: ProgramFunction, inputs: string[]) => Promise<string | null>;
  reset: () => void;
  clearError: () => void;
  status: TxStatus;
  error: string | null;
  txId: string | null;
  trackedTransaction: TrackedTx | undefined;
  isSettling: boolean;
  isSettled: boolean;
}

export function useTransaction(options: UseTransactionOptions = {}): UseTransactionResult {
  const { address, executeTransaction } = useWallet();
  const { track } = useTransactionTracker();

  const optionsRef = useRef(options);
  optionsRef.current = options;

  const [signing, setSigning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [txId, setTxId] = useState<string | null>(null);

  const trackedTransaction = useTrackedTransaction(txId);

  // Fire onConfirmed / onFailed exactly once when tracker status reaches a terminal state.
  // We use a ref to track whether we already fired so React re-renders don't re-trigger.
  const firedRef = useRef<"confirmed" | "failed" | null>(null);

  useEffect(() => {
    const s = trackedTransaction?.status;
    if (!s || !txId) return;

    if (s === "confirmed" && firedRef.current !== "confirmed") {
      firedRef.current = "confirmed";
      optionsRef.current.onConfirmed?.(txId);
    } else if (s === "failed" && firedRef.current !== "failed") {
      firedRef.current = "failed";
      setError("Transaction failed on-chain");
      optionsRef.current.onFailed?.(txId);
    }
  }, [trackedTransaction?.status, txId]);

  const status: TxStatus =
    signing ? "signing" : trackedTransaction?.status ?? "idle";

  const execute = useCallback(
    async (functionName: ProgramFunction, inputs: string[]): Promise<string | null> => {
      if (!address || !executeTransaction) return null;

      setSigning(true);
      setError(null);
      setTxId(null);
      firedRef.current = null;

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
        const result = await attempt().catch(async (e) => {
          if (!isPortError(e)) throw e;
          await new Promise((resolve) => setTimeout(resolve, 700));
          return attempt();
        });

        if (!result) throw new Error("Transaction was not submitted");

        const id = result.transactionId;
        const label =
          optionsRef.current.label ??
          TX_LABELS[functionName as ProgramFunction] ??
          functionName;

        setTxId(id);
        track(id, label);

        return id;
      } catch (e) {
        const message = e instanceof Error ? e.message : "Transaction failed";
        setError(message);
        return null;
      } finally {
        setSigning(false);
      }
    },
    [address, executeTransaction, track],
  );

  const reset = useCallback(() => {
    setTxId(null);
    setError(null);
    setSigning(false);
    firedRef.current = null;
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    execute,
    reset,
    clearError,
    status,
    error,
    txId,
    trackedTransaction,
    isSettling: status === "signing" || status === "pending",
    isSettled: status === "confirmed" || status === "failed",
  };
}
