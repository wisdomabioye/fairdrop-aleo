import { useState } from "react";
import { useTransaction } from "@/shared/hooks/useTransaction";
import { useTokenMetadata } from "@/shared/hooks/useTokenMetadata";
import { parseTokenAmount } from "@/shared/utils/formatting";
import { TOKEN_REGISTRY_PROGRAM_ID } from "@/config/network";
import { TokenRecordSelector } from "@/shared/components/TokenRecordSelector";
import { TokenAmountInput } from "@/shared/components/ui/TokenAmountInput";
import { Alert } from "@/shared/components/ui/Alert";
import { TransactionButton } from "@/shared/components/TransactionButton";
import type { TokenRecord } from "@/shared/types/token";

interface Props {
  tokenRecords: TokenRecord[];
  onDone: (msg: string) => void;
}

/**
 * Burns an amount from a private token_registry.aleo Token record.
 * Requires the caller to be the token admin or hold BURNER_ROLE.
 * Returns a remainder record to the caller.
 */
export function BurnTab({ tokenRecords, onDone }: Props) {
  const [selected, setSelected] = useState<TokenRecord | null>(null);
  const [amount, setAmount]     = useState("");
  const tx = useTransaction({ programId: TOKEN_REGISTRY_PROGRAM_ID, label: "Burn Tokens" });
  const { metadata: tokenMeta } = useTokenMetadata(selected?.token_id);
  const decimals = tokenMeta?.decimals ?? 0;
  const symbol = tokenMeta?.symbolStr ?? null;

  const rawAmount = parseTokenAmount(amount, decimals);
  const valid     = !!(selected && rawAmount > 0n && rawAmount <= selected.amount);

  const handleBurn = async () => {
    if (!selected || !valid) return;
    const txId = await tx.execute("burn_private", [
      selected._record,
      `${rawAmount}u128`,
    ]);
    if (txId) {
      onDone("Burn submitted — remainder record will return to your wallet.");
      setSelected(null);
      setAmount("");
    }
  };

  return (
    <div className="space-y-5">
      <Alert variant="warning" title="Admin / burner role required">
        Only the token admin or an account with BURNER_ROLE can burn tokens.
      </Alert>

      <TokenRecordSelector
        records={tokenRecords}
        selected={selected}
        onSelect={setSelected}
        label="Select record to burn"
      />

      {selected && (
        <div className="animate-fade-in">
          <TokenAmountInput
            label="Amount to burn"
            value={amount}
            onChange={setAmount}
            decimals={decimals}
            symbol={symbol}
            max={selected.amount}
            maxLabel="Burn all"
            error={rawAmount > selected.amount ? "Exceeds record amount" : undefined}
          />
        </div>
      )}

      {tx.error && <Alert variant="error" title="Transaction failed">{tx.error}</Alert>}

      <TransactionButton
        onClick={handleBurn}
        txStatus={tx.status}
        disabled={!valid}
        variant="accent"
        className="w-full"
      >
        {!selected ? "Select a record" : rawAmount <= 0n ? "Enter amount" : "Burn Tokens"}
      </TransactionButton>
    </div>
  );
}
