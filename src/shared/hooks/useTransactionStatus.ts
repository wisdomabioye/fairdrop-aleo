import { useState, useCallback, useRef } from "react";
import { useWallet } from "@demox-labs/aleo-wallet-adapter-react";

export type TxStatus = "idle" | "pending" | "confirmed" | "failed";

export function useTransactionStatus() {
  const { transactionStatus } = useWallet();
  const [status, setStatus] = useState<TxStatus>("idle");
  const [txId, setTxId] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const pollStatus = useCallback(
    (id: string) => {
      setTxId(id);
      setStatus("pending");

      if (intervalRef.current) clearInterval(intervalRef.current);

      intervalRef.current = setInterval(async () => {
        if (!transactionStatus) return;
        try {
          const result = await transactionStatus(id);
          const s = typeof result === "string" ? result : String(result);
          if (s.includes("Finalized") || s.includes("Confirmed") || s.includes("Accepted") || s.includes("Completed")) {
            setStatus("confirmed");
            if (intervalRef.current) clearInterval(intervalRef.current);
          } else if (s.includes("Failed") || s.includes("Rejected")) {
            setStatus("failed");
            if (intervalRef.current) clearInterval(intervalRef.current);
          }
        } catch {
          // keep polling
        }
      }, 3000);
    },
    [transactionStatus],
  );

  const reset = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setStatus("idle");
    setTxId(null);
  }, []);

  return { status, txId, pollStatus, reset };
}
