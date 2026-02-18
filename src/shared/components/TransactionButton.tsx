import { type ButtonHTMLAttributes } from "react";
import { Check } from "lucide-react";
import { Button } from "./ui/Button";
import type { TxStatus } from "../hooks/useTransaction";

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Pass useTransaction().status for automatic state-driven appearance */
  txStatus?: TxStatus;
  loading?: boolean;
  loadingText?: string;
  variant?: "primary" | "accent" | "success" | "warning";
}

export function TransactionButton({
  txStatus,
  loading,
  loadingText = "Approving…",
  variant = "primary",
  children,
  className = "",
  disabled,
  ...props
}: Props) {
  const isSigning   = txStatus === "signing" || loading;
  const isSubmitted = txStatus === "submitted";

  return (
    <Button
      variant={isSubmitted ? "success" : variant}
      size="lg"
      loading={isSigning}
      loadingText={loadingText}
      disabled={disabled || isSigning || isSubmitted}
      className={className}
      {...props}
    >
      {isSubmitted ? (
        <span className="flex items-center gap-2">
          <Check className="h-4 w-4" />
          Submitted
        </span>
      ) : (
        children
      )}
    </Button>
  );
}
