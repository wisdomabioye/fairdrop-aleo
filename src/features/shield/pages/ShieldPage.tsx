import { useState, useMemo } from "react";
import { Shield } from "lucide-react";
import { useWallet } from "@provablehq/aleo-wallet-adaptor-react";
import { useTransaction } from "@/shared/hooks/useTransaction";
import { useTokenBalance } from "@/shared/hooks/useTokenBalance";
import { CREDITS_DECIMALS, CREDITS_RESERVED_TOKEN_ID } from "@/shared/types/token";
import { parseTokenAmount, formatAmount } from "@/shared/utils/formatting";
import { Card } from "@/shared/components/ui/Card";
import { Alert } from "@/shared/components/ui/Alert";
import { TokenAmountInput } from "@/shared/components/ui/TokenAmountInput";
import { TransactionButton } from "@/shared/components/TransactionButton";
import { ConnectButton } from "@/shared/components/wallet/ConnectButton";

const CREDITS_PROGRAM = "credits.aleo";

export function ShieldPage() {
  const { address } = useWallet();
  const [amount, setAmount] = useState("");
  const tx = useTransaction({
    programId: CREDITS_PROGRAM,
    label: "Shield Credits",
  });

  const { balance } = useTokenBalance(CREDITS_RESERVED_TOKEN_ID);
  const publicBalance = balance ?? 0n;

  const rawAmount = parseTokenAmount(amount, CREDITS_DECIMALS);

  const validation = useMemo(() => {
    if (rawAmount <= 0n) return "Enter an amount";
    if (rawAmount > publicBalance) return "Insufficient public balance";
    if (rawAmount > 18446744073709551615n) return "Amount exceeds u64 max";
    return null;
  }, [rawAmount, publicBalance]);

  const handleShield = async () => {
    if (validation || !address) return;
    const txId = await tx.execute("transfer_public_to_private", [
      address,
      `${rawAmount}u64`,
    ]);
    if (txId) setAmount("");
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-foreground">Shield Credits</h2>
        <p className="mt-1 text-muted-foreground">
          Convert public ALEO credits into a private record for use in private bids.
        </p>
      </div>

      <div className="mx-auto max-w-lg space-y-4">
        <Alert variant="info" title="What is shielding?">
          Shielding moves credits from your public <code>credits.aleo</code> balance into a
          private on-chain record (UTXO). The private record can then be used for
          private bids without revealing which UTXO funds the bid.
        </Alert>

        <Card variant="glass">
          <div className="mb-1 flex items-center gap-2">
            <Shield className="h-4 w-4 text-primary" />
            <span className="text-sm font-semibold text-foreground">Shield Amount</span>
          </div>

          {address && (
            <p className="mb-4 text-xs text-muted-foreground">
              Public balance: <span className="font-medium text-foreground">
                {formatAmount(publicBalance, CREDITS_DECIMALS)} ALEO
              </span>
            </p>
          )}

          <div className="space-y-4">
            <TokenAmountInput
              label="Amount"
              value={amount}
              onChange={setAmount}
              decimals={CREDITS_DECIMALS}
              symbol="ALEO"
              placeholder="0.00"
            />

            {tx.error && (
              <Alert variant="error" title="Transaction failed">{tx.error}</Alert>
            )}

            {!address ? (
              <div className="flex justify-center">
                <ConnectButton />
              </div>
            ) : (
              <TransactionButton
                onClick={handleShield}
                txStatus={tx.status}
                disabled={!!validation}
                className="w-full"
              >
                {validation || "Shield Credits"}
              </TransactionButton>
            )}
          </div>
        </Card>

        <p className="text-center text-xs text-muted-foreground">
          After the transaction confirms, the private record will appear in your wallet
          and can be selected in the bid form.
        </p>
      </div>
    </div>
  );
}
