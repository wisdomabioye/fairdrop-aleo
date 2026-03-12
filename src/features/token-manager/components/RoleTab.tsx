import { useState } from "react";
import { useTransaction } from "@/shared/hooks/useTransaction";
import { TOKEN_REGISTRY_PROGRAM_ID } from "@/config/network";
import { MINTER_ROLE, BURNER_ROLE, SUPPLY_MANAGER_ROLE } from "@/shared/types/token";
import { Input } from "@/shared/components/ui/Input";
import { Alert } from "@/shared/components/ui/Alert";
import { TransactionButton } from "@/shared/components/TransactionButton";

const ROLE_OPTIONS = [
  { value: MINTER_ROLE,          label: "MINTER_ROLE (1)" },
  { value: BURNER_ROLE,          label: "BURNER_ROLE (2)" },
  { value: SUPPLY_MANAGER_ROLE,  label: "SUPPLY_MANAGER_ROLE (3)" },
];

interface Props {
  onDone: (msg: string) => void;
}

/**
 * Set or remove roles on a token_registry.aleo token.
 * Only the token admin can call set_role / remove_role.
 */
export function RoleTab({ onDone }: Props) {
  const [tokenId, setTokenId]   = useState("");
  const [account, setAccount]   = useState("");
  const [role, setRole]         = useState<number>(MINTER_ROLE);
  const [action, setAction]     = useState<"set" | "remove">("set");

  const setTx    = useTransaction({ programId: TOKEN_REGISTRY_PROGRAM_ID, label: "Set Role" });
  const removeTx = useTransaction({ programId: TOKEN_REGISTRY_PROGRAM_ID, label: "Remove Role" });

  const tx      = action === "set" ? setTx : removeTx;
  const tokenOk = tokenId.trim().endsWith("field");
  const addrOk  = account.trim().startsWith("aleo1") && account.trim().length > 10;
  const valid   = tokenOk && addrOk;

  const handleSubmit = async () => {
    if (!valid) return;
    let txId: string | null = null;
    if (action === "set") {
      txId = await setTx.execute("set_role", [
        tokenId.trim(),
        account.trim(),
        `${role}u8`,
      ]);
    } else {
      txId = await removeTx.execute("remove_role", [
        tokenId.trim(),
        account.trim(),
      ]);
    }
    if (txId) {
      onDone(action === "set" ? "Role assigned successfully." : "Role removed successfully.");
      setTokenId("");
      setAccount("");
    }
  };

  return (
    <div className="space-y-5">
      <Alert variant="info" title="Token admin only">
        Only the address set as <code>admin</code> on the token can assign or revoke roles.
      </Alert>

      <div className="flex gap-3">
        {(["set", "remove"] as const).map((a) => (
          <button
            key={a}
            onClick={() => setAction(a)}
            className={`flex-1 rounded-xl border py-2 text-sm font-medium transition-colors ${
              action === a
                ? "border-primary bg-primary/10 text-primary"
                : "border-border text-muted-foreground hover:border-primary/40 hover:text-foreground"
            }`}
          >
            {a === "set" ? "Assign Role" : "Revoke Role"}
          </button>
        ))}
      </div>

      <Input
        label="Token ID"
        placeholder="123...field"
        value={tokenId}
        onChange={(e) => setTokenId(e.target.value)}
        error={tokenId && !tokenOk ? "Must end with 'field'" : undefined}
      />
      <Input
        label="Account address"
        placeholder="aleo1..."
        value={account}
        onChange={(e) => setAccount(e.target.value)}
        error={account && !addrOk ? "Invalid Aleo address" : undefined}
      />

      {action === "set" && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-foreground">Role</p>
          <div className="grid grid-cols-3 gap-2">
            {ROLE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setRole(opt.value)}
                className={`rounded-xl border px-3 py-2 text-xs font-medium transition-colors ${
                  role === opt.value
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border text-muted-foreground hover:border-primary/40"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {tx.error && <Alert variant="error" title="Transaction failed">{tx.error}</Alert>}

      <TransactionButton
        onClick={handleSubmit}
        txStatus={tx.status}
        disabled={!valid}
        variant={action === "set" ? "primary" : "accent"}
        className="w-full"
      >
        {action === "set" ? "Assign Role" : "Revoke Role"}
      </TransactionButton>
    </div>
  );
}
