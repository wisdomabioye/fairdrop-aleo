import { type ButtonHTMLAttributes } from "react";
import { Check } from "lucide-react";
import { Button } from "./ui/Button";
import type { TxStatus } from "../hooks/useTransaction";

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Pass useTransaction().status for tracker-backed transaction appearance */
  txStatus?: TxStatus;
  loadingText?: string;
  variant?: "primary" | "accent" | "success" | "warning";
}

export function TransactionButton({
  txStatus,
  loadingText = "Approving…",
  variant = "primary",
  children,
  className = "",
  disabled,
  ...props
}: Props) {
  const isSigning = txStatus === "signing";
  const isPending = txStatus === "pending";
  const isConfirmed = txStatus === "confirmed";
  const isFailed = txStatus === "failed";
  const isBusy = isSigning || isPending;

  return (
    <Button
      variant={isConfirmed ? "success" : isFailed ? "warning" : variant}
      size="lg"
      loading={isBusy}
      loadingText={isSigning ? loadingText : "Confirming…"}
      disabled={disabled || isBusy}
      className={className}
      {...props}
    >
      {isConfirmed ? (
        <span className="flex items-center gap-2">
          <Check className="h-4 w-4" />
          Confirmed
        </span>
      ) : (
        children
      )}
    </Button>
  );
}
