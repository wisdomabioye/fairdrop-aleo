import { useState, useEffect, useRef } from "react";
import {
  Loader2,
  CheckCircle2,
  XCircle,
  ExternalLink,
  Copy,
  ChevronUp,
  ChevronDown,
  Check,
} from "lucide-react";
import { useTransactionTracker, type TrackedTx } from "../context/TransactionTrackerContext";
import { EXPLORER_TX_URL } from "../../constants";

// ─── Individual row ───────────────────────────────────────────────────────────

function TxRow({ tx }: { tx: TrackedTx }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(tx.txId).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors hover:bg-secondary/60">
      <div className="flex-shrink-0">
        {tx.status === "pending"   && <Loader2     className="h-4 w-4 animate-spin text-primary" />}
        {tx.status === "confirmed" && <CheckCircle2 className="h-4 w-4 text-success" />}
        {tx.status === "failed"    && <XCircle      className="h-4 w-4 text-destructive" />}
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-foreground">{tx.label}</p>
        <p className={`text-xs ${
          tx.status === "pending"   ? "text-muted-foreground" :
          tx.status === "confirmed" ? "text-success" :
                                      "text-destructive"
        }`}>
          {tx.status === "pending"   ? "Confirming on-chain…" :
           tx.status === "confirmed" ? "Confirmed" :
                                       "Failed or timed out"}
        </p>
      </div>

      {/* Explorer link when we have the actual at1… hash; copy-UUID fallback otherwise */}
      {tx.aleoId ? (
        <a
          href={`${EXPLORER_TX_URL}/${tx.aleoId}`}
          target="_blank"
          rel="noopener noreferrer"
          title="View on explorer"
          onClick={(e) => e.stopPropagation()}
          className="flex-shrink-0 rounded-md p-1 text-muted-foreground hover:text-primary transition-colors"
        >
          <ExternalLink className="h-3.5 w-3.5" />
        </a>
      ) : (
        <button
          onClick={handleCopy}
          title={copied ? "Copied!" : "Copy wallet transaction ID"}
          className="flex-shrink-0 rounded-md p-1 text-muted-foreground hover:text-primary transition-colors"
        >
          {copied
            ? <Check className="h-3.5 w-3.5 text-success" />
            : <Copy  className="h-3.5 w-3.5" />
          }
        </button>
      )}
    </div>
  );
}

// ─── Widget ───────────────────────────────────────────────────────────────────

export function TransactionTracker() {
  const { transactions, clearCompleted } = useTransactionTracker();
  const [isExpanded, setIsExpanded] = useState(false);
  const prevPendingCount = useRef(0);

  const pendingCount = transactions.filter((t) => t.status === "pending").length;
  const hasTransactions = transactions.length > 0;
  const allSettled = hasTransactions && pendingCount === 0;

  // Auto-expand when a new pending transaction arrives
  useEffect(() => {
    if (pendingCount > prevPendingCount.current) setIsExpanded(true);
    prevPendingCount.current = pendingCount;
  }, [pendingCount]);

  // Auto-collapse 3 s after everything settles
  useEffect(() => {
    if (!allSettled) return;
    const timer = setTimeout(() => setIsExpanded(false), 3_000);
    return () => clearTimeout(timer);
  }, [allSettled]);

  if (!hasTransactions) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end gap-2">

      {/* ── Expanded card ───────────────────────────────────────────────── */}
      {isExpanded && (
        <div className="w-72 overflow-hidden rounded-2xl border border-border bg-card shadow-xl animate-scale-in">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-foreground">Transactions</span>
              {pendingCount > 0 && (
                <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                  {pendingCount} pending
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              {allSettled && (
                <button
                  onClick={clearCompleted}
                  className="rounded-md px-2 py-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  Clear
                </button>
              )}
              <button
                onClick={() => setIsExpanded(false)}
                className="rounded-md p-1 text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Collapse"
              >
                <ChevronDown className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="max-h-72 overflow-y-auto p-2 scrollbar-thin">
            {transactions.map((tx) => (
              <TxRow key={tx.id} tx={tx} />
            ))}
          </div>
        </div>
      )}

      {/* ── Collapsed pill — only shown when card is hidden ─────────────── */}
      {!isExpanded && (
        <button
          onClick={() => setIsExpanded(true)}
          className={`flex items-center gap-2 rounded-full border px-4 py-2 shadow-lg transition-all hover:scale-105 active:scale-95 ${
            allSettled
              ? "border-success/30 bg-card text-success"
              : "border-border bg-card text-foreground"
          }`}
        >
          {pendingCount > 0 ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
              <span className="text-sm font-medium">{pendingCount} pending</span>
            </>
          ) : (
            <>
              <Check className="h-4 w-4 text-success" />
              <span className="text-sm font-medium">All Tx confirmed</span>
            </>
          )}
          <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" />
        </button>
      )}
    </div>
  );
}
