import { useState } from "react";
import { useWallet } from "@demox-labs/aleo-wallet-adapter-react";
import { useTransaction } from "@/shared/hooks/useTransaction";
import { TransactionButton } from "@/shared/components/TransactionButton";
import { Card } from "@/shared/components/ui/Card";
import { Input } from "@/shared/components/ui/Input";
import { Select } from "@/shared/components/ui/Select";
import { Alert } from "@/shared/components/ui/Alert";
import { PageHeader } from "@/shared/components/ui/PageHeader";
import { TestTokens } from "@/constants";

const tokenOptions = TestTokens.map((t) => ({
  value: t.tokenId,
  label: `${t.name} (${t.symbol})`,
}));

export function FaucetPage() {
  const { publicKey } = useWallet();
  const [recipient, setRecipient] = useState("");
  const [tokenId, setTokenId] = useState("");
  const [amount, setAmount] = useState("");
  const [success, setSuccess] = useState(false);

  const { execute, loading, status, error, clearError } = useTransaction({
    label: "Mint Tokens",
  });

  const effectiveRecipient = recipient || publicKey || "";

  const validation = (() => {
    if (!effectiveRecipient) return "Connect wallet or enter recipient";
    if (!tokenId) return "Select a token";
    if (!amount || BigInt(amount || "0") <= 0n) return "Enter amount";
    return null;
  })();

  const handleMint = async () => {
    if (validation) return;
    const txId = await execute("create_token", [
      effectiveRecipient,
      tokenId.includes("field") ? tokenId : `${tokenId}field`,
      `${amount}u128`,
    ]);
    if (txId) setSuccess(true);
  };

  return (
    <div className="mx-auto max-w-lg space-y-8 animate-fade-in">
      <PageHeader title="Token Faucet" description="Mint test tokens for use in auctions." />

      <Card>
        <div className="space-y-5">
          <Input
            label="Recipient"
            value={recipient}
            onChange={(e) => { setRecipient(e.target.value); clearError(); }}
            placeholder={publicKey ? `Default: ${publicKey.slice(0, 12)}…` : "Connect wallet"}
            hint="Leave blank to mint to your connected wallet"
          />

          <Select
            label="Token"
            value={tokenId}
            onChange={(e) => { setTokenId(e.target.value); clearError(); }}
            options={tokenOptions}
            placeholder="Select a token…"
            hint="Choose the token type to mint"
          />

          <Input
            label="Amount"
            value={amount}
            onChange={(e) => { setAmount(e.target.value.replace(/[^0-9]/g, "")); clearError(); }}
            placeholder="e.g. 1000000"
          />

          {error && <p className="text-sm text-destructive">{error}</p>}

          {success && (
            <Alert variant="success" title="Tokens minted!">
              {amount} {TestTokens.find((t) => t.tokenId === tokenId)?.symbol ?? tokenId} sent to{" "}
              {effectiveRecipient.slice(0, 12)}…
            </Alert>
          )}

          <TransactionButton
            onClick={handleMint}
            loading={loading}
            txStatus={status}
            loadingText="Minting…"
            variant="success"
            disabled={!!validation}
            className="w-full"
          >
            {validation || "Mint Tokens"}
          </TransactionButton>
        </div>
      </Card>
    </div>
  );
}
