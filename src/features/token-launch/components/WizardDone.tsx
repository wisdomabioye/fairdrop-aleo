import { Link } from "react-router-dom";
import { CheckCircle2, ChevronRight } from "lucide-react";
import { DataRow } from "@/shared/components/ui/DataRow";

interface Props {
  tokenId: string;
}

export function WizardDone({ tokenId }: Props) {
  return (
    <div className="space-y-6 text-center animate-scale-in">
      <div className="flex justify-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-success/10">
          <CheckCircle2 className="h-8 w-8 text-success" />
        </div>
      </div>
      <div>
        <p className="text-lg font-bold text-foreground">Token ready for auction</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Your token is registered and the auction contract is authorized to mint.
        </p>
      </div>
      <div className="rounded-xl border border-border bg-secondary/50 p-3 text-left">
        <DataRow label="Token ID" value={<span className="font-mono text-xs break-all">{tokenId}</span>} />
      </div>
      <Link to="/auction/new">
        <button className="gradient-primary inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold text-white shadow-md">
          Create Auction <ChevronRight className="h-4 w-4" />
        </button>
      </Link>
    </div>
  );
}
