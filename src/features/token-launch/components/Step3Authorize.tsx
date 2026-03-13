import { useTransaction } from "@/shared/hooks/useTransaction";
import { TOKEN_REGISTRY_PROGRAM_ID, FAIRDROP_PROGRAM_ADDRESS } from "@/config/network";
import { SUPPLY_MANAGER_ROLE } from "@/shared/types/token";
import { Alert } from "@/shared/components/ui/Alert";
import { Badge } from "@/shared/components/ui/Badge";
import { DataRow } from "@/shared/components/ui/DataRow";
import { TransactionButton } from "@/shared/components/TransactionButton";

interface Props {
  tokenId: string;
  onDone: () => void;
}

export function Step3Authorize({ tokenId, onDone }: Props) {
  const tx = useTransaction({
    programId: TOKEN_REGISTRY_PROGRAM_ID,
    label: "Authorize Auction Contract",
    onConfirmed: () => onDone(),
  });

  const handleAuthorize = async () => {
    await tx.execute("set_role", [
      tokenId,
      FAIRDROP_PROGRAM_ADDRESS,
      `${SUPPLY_MANAGER_ROLE}u8`,
    ]);
  };

  return (
    <div className="space-y-5">
      <p className="text-sm text-muted-foreground">
        Grant <Badge variant="primary">SUPPLY_MANAGER_ROLE</Badge>{" "}
        to the auction contract. This covers both burning the deposit at auction creation
        and minting tokens to winning bidders at claim time.
      </p>

      <div className="rounded-xl border border-border bg-secondary/50 p-4 space-y-2">
        <DataRow label="Token ID"         value={<span className="font-mono text-xs break-all">{tokenId}</span>} />
        <DataRow label="Auction contract" value={<span className="font-mono text-xs break-all">{FAIRDROP_PROGRAM_ADDRESS}</span>} />
        <DataRow label="Role"             value={<Badge variant="success" dot>SUPPLY_MANAGER_ROLE ({SUPPLY_MANAGER_ROLE})</Badge>} />
      </div>

      {tx.error && <Alert variant="error" title="Transaction failed">{tx.error}</Alert>}

      <TransactionButton
        onClick={handleAuthorize}
        txStatus={tx.status}
        disabled={tx.isSettling}
        className="w-full" variant="success"
      >
        Authorize Auction Contract
      </TransactionButton>
    </div>
  );
}
