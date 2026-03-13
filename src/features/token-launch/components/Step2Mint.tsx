import { useState, useEffect, useRef } from "react";
import { useTransaction } from "@/shared/hooks/useTransaction";
import { useTokenMetadata } from "@/shared/hooks/useTokenMetadata";
import { formatTokenAmount, parseTokenAmount, toPlainAmount } from "@/shared/utils/formatting";
import { TOKEN_REGISTRY_PROGRAM_ID } from "@/config/network";
import { NO_EXPIRY } from "@/shared/types/token";
import { TokenAmountInput } from "@/shared/components/ui/TokenAmountInput";
import { Alert } from "@/shared/components/ui/Alert";
import { TransactionButton } from "@/shared/components/TransactionButton";

interface Props {
  address: string;
  tokenId: string;
  maxSupply: bigint;
  onDone: () => void;
}

export function Step2Mint({ address, tokenId, maxSupply, onDone }: Props) {
  const { metadata: tokenMeta } = useTokenMetadata(tokenId);
  const decimals = tokenMeta?.decimals ?? 0;
  const symbol = tokenMeta?.symbolStr ?? null;

  const [amount, setAmount] = useState("");
  const seeded = useRef(false);

  // Pre-fill with max supply once metadata is available
  useEffect(() => {
    if (tokenMeta && !seeded.current) {
      seeded.current = true;
      setAmount(toPlainAmount(maxSupply, decimals));
    }
  }, [tokenMeta, maxSupply, decimals]);

  const tx = useTransaction({
    programId: TOKEN_REGISTRY_PROGRAM_ID,
    label: "Mint Initial Supply",
    onConfirmed: () => onDone(),
  });

  const rawAmount = parseTokenAmount(amount, decimals);
  const valid     = rawAmount > 0n && rawAmount <= maxSupply;

  const handleMint = async () => {
    if (!valid) return;
    await tx.execute("mint_private", [
      tokenId,
      address,
      `${rawAmount}u128`,
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

      <TokenAmountInput
        label="Amount"
        value={amount}
        onChange={setAmount}
        decimals={decimals}
        symbol={symbol}
        max={maxSupply}
        maxLabel="Max supply"
        hint={`Max supply: ${formatTokenAmount(maxSupply, tokenMeta)}`}
        error={rawAmount > maxSupply ? "Exceeds max supply" : undefined}
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
