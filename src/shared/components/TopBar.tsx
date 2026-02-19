import { useLocation } from "react-router-dom";
import { Menu, Sun, Moon } from "lucide-react";
import { WalletMultiButton } from "@demox-labs/aleo-wallet-adapter-reactui";
import { useTheme } from "@/shared/hooks/useTheme";

interface TopBarProps {
  onMenuToggle: () => void;
}

// Maps route pathnames to human-readable page titles shown in the topbar.
// Prefix-matched so /auction/new and /creator/manage also resolve correctly.
const PAGE_TITLES: { prefix: string; title: string }[] = [
  { prefix: "/auction/new",    title: "Create Auction" },
  { prefix: "/creator/manage", title: "Manage Auction" },
  { prefix: "/creator",        title: "My Auctions" },
  { prefix: "/auction/",       title: "Auction" },
  { prefix: "/bids",           title: "My Bids" },
  { prefix: "/claim",          title: "Claim" },
  { prefix: "/faucet",         title: "Faucet" },
  { prefix: "/tokens",         title: "Token Manager" },
  { prefix: "/guide",          title: "How It Works" },
  { prefix: "/",               title: "Dashboard" },
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
      <WalletMultiButton />
    </header>
  );
}
