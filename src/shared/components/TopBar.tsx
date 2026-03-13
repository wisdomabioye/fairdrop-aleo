import { useLocation } from "react-router-dom";
import { Menu, Sun, Moon } from "lucide-react";
import { ConnectButton } from "@/shared/components/wallet/ConnectButton";
import { useTheme } from "@/shared/hooks/useTheme";
import { AppRoutes } from "@/config/app.route";

interface TopBarProps {
  onMenuToggle: () => void;
}

// Maps route pathnames to human-readable page titles shown in the topbar.
// Prefix-matched so /auction/new and /creator/manage also resolve correctly.
const PAGE_TITLES: { prefix: string; title: string }[] = [
  { prefix: AppRoutes.createAuction,    title: "Create Auction" },
  { prefix: AppRoutes.manageAuction, title: "Manage Auction" },
  { prefix: AppRoutes.myAuctions,        title: "My Auctions" },
  { prefix: AppRoutes.auction,       title: "Auction" },
  { prefix: AppRoutes.myBids,           title: "My Bids" },
  { prefix: AppRoutes.claim,          title: "Claim" },
  { prefix: AppRoutes.tokenLaunch,         title: "Launch a Token" },
  { prefix: AppRoutes.tokenManager,         title: "Token Manager" },
  { prefix: AppRoutes.howItWorks,          title: "How It Works" },
  { prefix: AppRoutes.dashboard,               title: "Dashboard" },
];

function usePageTitle(): string {
  const { pathname } = useLocation();
  return PAGE_TITLES.find((r) => pathname === r.prefix || pathname.startsWith(r.prefix + "/") || pathname === r.prefix.replace(/\/$/, ""))?.title ?? "Fairdrop";
}

export function TopBar({ onMenuToggle }: TopBarProps) {
  const { dark, toggle } = useTheme();
  const title = usePageTitle();

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border bg-background/80 px-4 backdrop-blur-md">
      {/* Mobile hamburger */}
      <button
        onClick={onMenuToggle}
        className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground lg:hidden"
        aria-label="Toggle menu"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Page title */}
      <h1 className="text-sm font-semibold text-foreground lg:text-base">{title}</h1>

      <div className="flex-1" />

      {/* Theme toggle */}
      <button
        onClick={toggle}
        className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
        title={dark ? "Switch to light mode" : "Switch to dark mode"}
      >
        {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
      </button>

      {/* Wallet */}
      <ConnectButton />
    </header>
  );
}
