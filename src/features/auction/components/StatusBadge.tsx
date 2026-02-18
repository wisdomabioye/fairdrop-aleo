import type { AuctionStatus } from "@/shared/types/auction";
import { Badge } from "@/shared/components/ui/Badge";

type BadgeVariant = "primary" | "success" | "warning" | "destructive" | "info" | "muted";

const statusMap: Record<AuctionStatus, { variant: BadgeVariant; label: string }> = {
  upcoming: { variant: "info", label: "Upcoming" },
  active: { variant: "primary", label: "Active" },
  ending: { variant: "warning", label: "Ending Soon" },
  supply_met: { variant: "success", label: "Supply Met" },
  ended: { variant: "muted", label: "Ended" },
  cleared: { variant: "success", label: "Cleared" },
};

export function StatusBadge({ status }: { status: AuctionStatus }) {
  const { variant, label } = statusMap[status];
  return (
    <Badge variant={variant} dot>
      {label}
    </Badge>
  );
}
