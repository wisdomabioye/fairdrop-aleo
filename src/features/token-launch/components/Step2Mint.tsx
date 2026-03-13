import { useState } from "react";
import { useTransaction } from "@/shared/hooks/useTransaction";
import { TOKEN_REGISTRY_PROGRAM_ID } from "@/config/network";
import { NO_EXPIRY } from "@/shared/types/token";
import { Input } from "@/shared/components/ui/Input";
import { Alert } from "@/shared/components/ui/Alert";
import { TransactionButton } from "@/shared/components/TransactionButton";

interface Props {
  address: string;
  tokenId: string;
  maxSupply: bigint;
  onDone: () => void;
}

export function Step2Mint({ address, tokenId, maxSupply, onDone }: Props) {
  const [amount, setAmount] = useState(maxSupply.toString());
  const tx = useTransaction({
    programId: TOKEN_REGISTRY_PROGRAM_ID,
    label: "Mint Initial Supply",
    onConfirmed: () => onDone(),
  });

  const amountN = BigInt(amount || "0");
  const valid   = amountN > 0n && amountN <= maxSupply;

  const handleMint = async () => {
    if (!valid) return;
    await tx.execute("mint_private", [
      tokenId,
      address,
      `${amountN}u128`,
      "false",
      `${NO_EXPIRY}u32`,
    ]);
  };

  return (
    <div className="space-y-5">
      <p className="text-sm text-muted-foreground">
        Mint tokens to your wallet as a private record. You'll deposit this record when
        creating an auction — the contract burns it and re-mints to winners at claim time.
      </p>

      <Input
        label="Amount (raw units)"
        type="number"
        min="1"
        max={maxSupply.toString()}
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        hint={`Max supply: ${maxSupply.toLocaleString()}`}
        error={amountN > maxSupply ? "Exceeds max supply" : undefined}
      />

      {tx.error && <Alert variant="error" title="Transaction failed">{tx.error}</Alert>}

      <TransactionButton
        onClick={handleMint}
        txStatus={tx.status}
        disabled={!valid || tx.isSettling}
        className="w-full"
      >
        Mint Tokens
      </TransactionButton>
    </div>
  );
}
