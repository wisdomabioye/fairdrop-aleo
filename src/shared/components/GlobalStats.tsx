import { BarChart3, Gavel, Coins, Box } from "lucide-react";
import { useStats } from "@/shared/hooks/useStats";
import { useBlockHeight } from "@/shared/hooks/useBlockHeight";

function Stat({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <Icon className="h-4 w-4 text-primary" />
      <span className="text-muted-foreground">{label}</span>
      <span className="font-bold text-foreground">{value}</span>
    </div>
  );
}

export function GlobalStats() {
  const { stats, loading } = useStats();
  const { blockHeight } = useBlockHeight();

  const fmt = (n: number | undefined) =>
    n != null ? n.toLocaleString() : "—";

  const fmtAleo = (microcredits: number | undefined) => {
    if (microcredits == null) return "—";
    const aleo = microcredits / 1_000_000;
    return `${aleo.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ALEO`;
  };

  return (
    <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-2 border-b border-border/50 bg-secondary/40 px-4 py-2.5 text-sm">
      <Stat icon={BarChart3} label="Auctions" value={loading ? "…" : fmt(stats?.total_auctions)} />
      <Stat icon={Gavel} label="Total Bids" value={loading ? "…" : fmt(stats?.total_bids)} />
      <Stat icon={Coins} label="Collected" value={loading ? "…" : fmtAleo(stats?.total_payment_collected)} />
      <Stat icon={Box} label="Block" value={blockHeight > 0 ? blockHeight.toLocaleString() : "—"} />
    </div>
  );
}
