import { useState, useEffect } from "react";
import { useWallet } from "@demox-labs/aleo-wallet-adapter-react";
import { useRecords } from "@/shared/hooks/useRecords";
import { useTransaction } from "@/shared/hooks/useTransaction";
import { ConnectWalletPrompt } from "@/shared/components/ConnectWalletPrompt";
import { TokenCard } from "@/shared/components/TokenCard";
import { TokenGrid } from "@/shared/components/TokenGrid";
import { TransactionButton } from "@/shared/components/TransactionButton";
import { Card } from "@/shared/components/ui/Card";
import { Tabs } from "@/shared/components/ui/Tabs";
import { Input } from "@/shared/components/ui/Input";
import { Alert } from "@/shared/components/ui/Alert";
import { PageHeader } from "@/shared/components/ui/PageHeader";
import { Spinner } from "@/shared/components/ui/Spinner";
import type { TokenRecord } from "@/shared/types/auction";
import { getTokenSymbol } from "@/constants";

// ─── Join tab ─────────────────────────────────────────────────────────────────

interface JoinTabProps {
  tokenRecords: TokenRecord[];
  onDone: (msg: string) => void;
}

function JoinTab({ tokenRecords, onDone }: JoinTabProps) {
  const [joinA, setJoinA] = useState<TokenRecord | null>(null);
  const [joinB, setJoinB] = useState<TokenRecord | null>(null);
  const joinTx = useTransaction();

  const handleSelectA = (r: TokenRecord) => {
    setJoinA(r);
    if (joinB && joinB.token_id !== r.token_id) setJoinB(null);
  };

  const handleJoin = async () => {
    if (!joinA || !joinB) return;
    const txId = await joinTx.execute("join_tokens", [joinA._record, joinB._record]);
    if (txId) {
      onDone("Tokens joined successfully.");
      setJoinA(null);
      setJoinB(null);
    }
  };

  const isReady = !!(joinA && joinB);

  return (
    <div className="space-y-5">
      <p className="text-sm text-muted-foreground">
        Select two records of the same token type to merge into a single record.
      </p>

      {/* Step 1 */}
      {!joinA ? (
        <TokenGrid
          records={tokenRecords}
          selected={null}
          onSelect={handleSelectA}
          label="Step 1 — Select first record"
          emptyText="No token records found. Mint some tokens first."
        />
      ) : (
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Step 1 — First record
          </p>
          <TokenCard record={joinA} selected onDeselect={() => { setJoinA(null); setJoinB(null); }} />
        </div>
      )}

      {/* Step 2 — only shown after A is picked, automatically filtered */}
      {joinA && (
        <div className="animate-fade-in">
          {!joinB ? (
            <TokenGrid
              records={tokenRecords}
              selected={null}
              onSelect={setJoinB}
              label="Step 2 — Select second record"
              filterTokenId={joinA.token_id}
              exclude={[joinA]}
              emptyText={`No other ${getTokenSymbol(joinA.token_id)} records to merge with.`}
            />
          ) : (
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Step 2 — Second record
              </p>
              <TokenCard record={joinB} selected onDeselect={() => setJoinB(null)} />
            </div>
          )}
        </div>
      )}

      {/* Merge preview */}
      {isReady && joinA && joinB && (
        <div className="animate-scale-in rounded-xl border border-primary/30 bg-primary/5 p-4">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Merge result
          </p>
          <div className="flex items-center gap-2">
            <div className="flex-1 rounded-lg bg-secondary px-3 py-2 text-center">
              <p className="text-xs text-muted-foreground">Record A</p>
              <p className="font-semibold text-foreground">{joinA.amount.toLocaleString()}</p>
            </div>
            <svg className="h-5 w-5 flex-shrink-0 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            <div className="flex-1 rounded-lg bg-secondary px-3 py-2 text-center">
              <p className="text-xs text-muted-foreground">Record B</p>
              <p className="font-semibold text-foreground">{joinB.amount.toLocaleString()}</p>
            </div>
            <svg className="h-5 w-5 flex-shrink-0 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
            <div className="flex-1 rounded-lg bg-primary/10 px-3 py-2 text-center">
              <p className="text-xs text-primary">Combined</p>
              <p className="font-bold text-primary">
                {(joinA.amount + joinB.amount).toLocaleString()}
                <span className="ml-1 text-xs">{getTokenSymbol(joinA.token_id)}</span>
              </p>
            </div>
          </div>
        </div>
      )}

      {joinTx.error && <p className="text-sm text-destructive">{joinTx.error}</p>}

      <TransactionButton
        onClick={handleJoin}
        txStatus={joinTx.status}
        disabled={!isReady}
        className="w-full"
      >
        {!joinA ? "Select first token" : !joinB ? "Select second token" : "Join Records"}
      </TransactionButton>
    </div>
  );
}

// ─── Split tab ────────────────────────────────────────────────────────────────

interface SplitTabProps {
  tokenRecords: TokenRecord[];
  onDone: (msg: string) => void;
}

function SplitTab({ tokenRecords, onDone }: SplitTabProps) {
  const [splitToken, setSplitToken] = useState<TokenRecord | null>(null);
  const [splitAmount, setSplitAmount] = useState("");
  const splitTx = useTransaction();

  const handleSplit = async () => {
    if (!splitToken) return;
    const txId = await splitTx.execute("split_token", [splitToken._record, `${splitAmount}u128`]);
    if (txId) {
      onDone("Token split successfully.");
      setSplitToken(null);
      setSplitAmount("");
    }
  };

  const amt = BigInt(splitAmount || "0");
  const isValid = !!(splitToken && amt > 0n && amt < splitToken.amount);

  return (
    <div className="space-y-5">
      <p className="text-sm text-muted-foreground">
        Split one record into two. The original is consumed and two new records are returned to you.
      </p>

      {/* Token selection */}
      {!splitToken ? (
        <TokenGrid
          records={tokenRecords}
          selected={null}
          onSelect={setSplitToken}
          label="Select record to split"
          emptyText="No token records found. Mint some tokens first."
        />
      ) : (
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Selected record
          </p>
          <TokenCard
            record={splitToken}
            selected
            onDeselect={() => { setSplitToken(null); setSplitAmount(""); }}
          />
        </div>
      )}

      {/* Amount input */}
      {splitToken && (
        <div className="animate-fade-in space-y-1.5">
          <Input
            label="Amount to split off"
            value={splitAmount}
            onChange={(e) => setSplitAmount(e.target.value.replace(/[^0-9]/g, ""))}
            placeholder={`1 – ${(splitToken.amount - 1n).toLocaleString()}`}
          />
          <button
            onClick={() => setSplitAmount(String(splitToken.amount / 2n || 1n))}
            className="text-xs text-primary hover:underline"
          >
            Use half ({(splitToken.amount / 2n).toLocaleString()})
          </button>
        </div>
      )}

      {/* Split preview */}
      {isValid && splitToken && (
        <div className="animate-scale-in rounded-xl border border-border bg-secondary/50 p-4">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Split result
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg border border-border bg-card p-3 text-center">
              <p className="text-xs text-muted-foreground">Record A</p>
              <p className="mt-1 text-lg font-bold text-foreground">{amt.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">{getTokenSymbol(splitToken.token_id)}</p>
            </div>
            <div className="rounded-lg border border-border bg-card p-3 text-center">
              <p className="text-xs text-muted-foreground">Record B</p>
              <p className="mt-1 text-lg font-bold text-foreground">
                {(splitToken.amount - amt).toLocaleString()}
              </p>
              <p className="text-xs text-muted-foreground">{getTokenSymbol(splitToken.token_id)}</p>
            </div>
          </div>
        </div>
      )}

      {splitTx.error && <p className="text-sm text-destructive">{splitTx.error}</p>}

      <TransactionButton
        onClick={handleSplit}
        txStatus={splitTx.status}
        disabled={!isValid}
        className="w-full"
      >
        {!splitToken
          ? "Select a token"
          : !splitAmount || amt <= 0n
          ? "Enter amount"
          : amt >= splitToken.amount
          ? "Amount too large"
          : "Split Record"}
      </TransactionButton>
    </div>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────────

const TABS = [
  { key: "join" as const, label: "Join Records" },
  { key: "split" as const, label: "Split Record" },
];

type Tab = (typeof TABS)[number]["key"];

export function TokenManagerPage() {
  const { publicKey } = useWallet();
  const { tokenRecords, loading, fetchRecords } = useRecords({ pollInterval: 10_000 });
  const [tab, setTab] = useState<Tab>("join");
  const [success, setSuccess] = useState<string | null>(null);


  const handleDone = (msg: string) => {
    setSuccess(msg);
    fetchRecords();
  };

  const handleTabChange = (next: Tab) => {
    setTab(next);
    setSuccess(null);
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6 animate-fade-in">
      <PageHeader
        title="Token Manager"
        description="Manage your private token records."
        action={
          <button
            onClick={() => { setSuccess(null); fetchRecords(); }}
            disabled={loading}
            className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:border-primary/50 hover:text-foreground disabled:opacity-50 transition-all"
          >
            {loading ? (
              <Spinner size="sm" />
            ) : (
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
        {!publicKey ? (
          <ConnectWalletPrompt
            title="Connect to manage tokens"
            description="Your token records are private records encrypted to your address. Connect your wallet to join or split them."
          />
        ) : tab === "join" ? (
          <JoinTab key="join" tokenRecords={tokenRecords} onDone={handleDone} />
        ) : (
          <SplitTab key="split" tokenRecords={tokenRecords} onDone={handleDone} />
        )}
      </Card>
    </div>
  );
}
