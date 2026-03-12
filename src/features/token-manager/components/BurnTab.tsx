import { useState } from "react";
import { useTransaction } from "@/shared/hooks/useTransaction";
import { TOKEN_REGISTRY_PROGRAM_ID } from "@/config/network";
import { TokenGrid } from "@/shared/components/TokenGrid";
import { TokenCard } from "@/shared/components/TokenCard";
import { Input } from "@/shared/components/ui/Input";
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

  const amountN = BigInt(amount || "0");
  const valid   = !!(selected && amountN > 0n && amountN <= selected.amount);

  const handleBurn = async () => {
    if (!selected || !valid) return;
    const txId = await tx.execute("burn_private", [
      selected._record,
      `${amountN}u128`,
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

      {!selected ? (
        <TokenGrid
          records={tokenRecords}
          selected={null}
          onSelect={setSelected}
          label="Select record to burn"
          emptyText="No token records found."
        />
      ) : (
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Selected record
          </p>
          <TokenCard
            record={selected}
            selected
            onDeselect={() => { setSelected(null); setAmount(""); }}
          />
        </div>
      )}

      {selected && (
        <div className="animate-fade-in space-y-1.5">
          <Input
            label="Amount to burn"
            value={amount}
            onChange={(e) => setAmount(e.target.value.replace(/[^0-9]/g, ""))}
            placeholder={`1 – ${selected.amount.toLocaleString()}`}
            error={amountN > selected.amount ? "Exceeds record amount" : undefined}
          />
          <button
            onClick={() => setAmount(String(selected.amount))}
            className="text-xs text-primary hover:underline"
          >
            Burn all ({selected.amount.toLocaleString()})
          </button>
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
        {!selected ? "Select a record" : !amount || amountN <= 0n ? "Enter amount" : "Burn Tokens"}
      </TransactionButton>
    </div>
  );
}
