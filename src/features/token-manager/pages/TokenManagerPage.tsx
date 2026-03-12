import { useState } from "react";
import { useWallet } from "@provablehq/aleo-wallet-adaptor-react";
import { useTokenRecords } from "@/shared/hooks/useTokenRecords";
import { ConnectWalletPrompt } from "@/shared/components/ConnectWalletPrompt";
import { Card } from "@/shared/components/ui/Card";
import { Tabs } from "@/shared/components/ui/Tabs";
import { Alert } from "@/shared/components/ui/Alert";
import { PageHeader } from "@/shared/components/ui/PageHeader";
import { Spinner } from "@/shared/components/ui/Spinner";
import { BurnTab } from "../components/BurnTab";
import { RoleTab } from "../components/RoleTab";

const TABS = [
  { key: "burn"  as const, label: "Burn" },
  { key: "roles" as const, label: "Role Management" },
];

type Tab = (typeof TABS)[number]["key"];

export function TokenManagerPage() {
  const { address }  = useWallet();
  const { tokenRecords, loading, fetchRecords } = useTokenRecords({ pollInterval: 10_000 });
  const [tab, setTab]       = useState<Tab>("burn");
  const [success, setSuccess] = useState<string | null>(null);

  const handleTabChange = (next: Tab) => { setTab(next); setSuccess(null); };
  const handleDone      = (msg: string) => { setSuccess(msg); fetchRecords(); };

  return (
    <div className="mx-auto max-w-2xl space-y-6 animate-fade-in">
      <PageHeader
        title="Token Manager"
        description="Manage your token_registry.aleo records — burn tokens or assign roles."
        action={
          <button
            onClick={() => { setSuccess(null); fetchRecords(); }}
            disabled={loading}
            className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:border-primary/50 hover:text-foreground disabled:opacity-50 transition-all"
          >
            {loading ? <Spinner size="sm" /> : (
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            )}
            Refresh
          </button>
        }
      />

      {success && <Alert variant="success" title={success} />}

      <Tabs tabs={TABS} active={tab} onChange={handleTabChange} />

      <Card>
        {!address ? (
          <ConnectWalletPrompt
            title="Connect to manage tokens"
            description="Token records are private and encrypted to your address. Connect your wallet to manage them."
          />
        ) : tab === "burn" ? (
          <BurnTab key="burn" tokenRecords={tokenRecords} onDone={handleDone} />
        ) : (
          <RoleTab key="roles" onDone={handleDone} />
        )}
      </Card>
    </div>
  );
}
