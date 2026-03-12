import { useState } from "react";
import { useTransaction } from "@/shared/hooks/useTransaction";
import { TOKEN_REGISTRY_PROGRAM_ID } from "@/config/network";
import { asciiToU128 } from "@/shared/lib/auctionParsers";
import { Input } from "@/shared/components/ui/Input";
import { Alert } from "@/shared/components/ui/Alert";
import { TransactionButton } from "@/shared/components/TransactionButton";

function tryAscii(s: string): { ok: true; value: bigint } | { ok: false; error: string } {
  try {
    return { ok: true, value: asciiToU128(s) };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Invalid" };
  }
}

/** Generate a random 128-bit field element. */
export function generateTokenId(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  let v = 0n;
  for (const b of bytes) v = (v << 8n) | BigInt(b);
  return v.toString() + "field";
}

interface Props {
  address: string;
  tokenId: string;
  onDone: (maxSupply: bigint) => void;
}

export function Step1Register({ address, tokenId, onDone }: Props) {
  const [name, setName]       = useState("");
  const [symbol, setSymbol]   = useState("");
  const [decimals, setDecimals] = useState("6");
  const [maxSupply, setMaxSupply] = useState("");
  const tx = useTransaction({ programId: TOKEN_REGISTRY_PROGRAM_ID, label: "Register Token" });

  const nameR   = tryAscii(name);
  const symbolR = tryAscii(symbol);
  const dec     = parseInt(decimals, 10);
  const maxN    = BigInt(maxSupply || "0");
  const valid   = nameR.ok && symbolR.ok && symbol.length >= 2 &&
                  !isNaN(dec) && dec >= 0 && dec <= 18 && maxN > 0n;

  const handleSubmit = async () => {
    if (!valid || !nameR.ok || !symbolR.ok) return;
    const txId = await tx.execute("register_token", [
      tokenId,
      `${nameR.value}u128`,
      `${symbolR.value}u128`,
      `${dec}u8`,
      `${maxN}u128`,
      "false",
      address,  // external_authorization_party placeholder
    ]);
    if (txId) onDone(maxN);
  };

  return (
    <div className="space-y-5">
      <p className="text-sm text-muted-foreground">
        Register a new token on <code className="text-primary">token_registry.aleo</code>.
        Your address becomes the token admin.
      </p>

      <div className="rounded-xl border border-border bg-secondary/50 p-3">
        <p className="mb-1 text-xs font-medium text-muted-foreground">Token ID (auto-generated)</p>
        <p className="break-all font-mono text-xs text-foreground">{tokenId}</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Input label="Name" placeholder="My Token" value={name}
          onChange={(e) => setName(e.target.value)} hint="Max 16 ASCII chars"
          error={name && !nameR.ok ? nameR.error : undefined} />
        <Input label="Symbol" placeholder="MTK" value={symbol}
          onChange={(e) => setSymbol(e.target.value.toUpperCase())} hint="2–8 chars"
          error={symbol && !symbolR.ok ? symbolR.error : undefined} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Input label="Decimals" type="number" min="0" max="18" value={decimals}
          onChange={(e) => setDecimals(e.target.value)} />
        <Input label="Max Supply" type="number" min="1" placeholder="1000000" value={maxSupply}
          onChange={(e) => setMaxSupply(e.target.value)} hint="Raw units (× 10^decimals)" />
      </div>

      {nameR.ok && symbolR.ok && name && symbol && (
        <div className="rounded-xl border border-primary/20 bg-primary/5 p-3 text-sm">
          <p className="font-medium text-primary">Preview</p>
          <p className="mt-1 text-muted-foreground">
            {name} <span className="font-mono text-foreground">({symbol})</span>
            {" · "}{dec} decimals{" · "}max {maxN.toLocaleString()} units
          </p>
        </div>
      )}

      {tx.error && <Alert variant="error" title="Transaction failed">{tx.error}</Alert>}
      <TransactionButton onClick={handleSubmit} txStatus={tx.status} disabled={!valid} className="w-full">
        Register Token
      </TransactionButton>
    </div>
  );
}
