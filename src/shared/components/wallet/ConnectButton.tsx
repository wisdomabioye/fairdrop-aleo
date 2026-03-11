import { useRef, useState, useEffect } from "react";
import { useWallet } from "@provablehq/aleo-wallet-adaptor-react";
import { useWalletModal } from "@provablehq/aleo-wallet-adaptor-react-ui";
import { Button } from "@/shared/components/ui/Button";
import { truncateAddress } from "@/shared/utils/formatting";

export function ConnectButton() {
  const { address, connected, connecting, disconnect, wallet } = useWallet();
  const { setVisible } = useWalletModal();
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  if (!connected || !address) {
    return (
      <Button
        variant="primary"
        size="sm"
        loading={connecting}
        loadingText="Connecting…"
        onClick={() => setVisible(true)}
      >
        Connect Wallet
      </Button>
    );
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 rounded-xl border border-border bg-secondary px-3 py-1.5 text-sm font-semibold text-foreground transition-colors hover:bg-secondary-hover"
      >
        <span className="h-2 w-2 rounded-full bg-success" />
        {wallet?.adapter.icon && (
          <img
            src={wallet.adapter.icon}
            alt={wallet.adapter.name}
            className="h-4 w-4 rounded-sm object-contain"
          />
        )}
        {truncateAddress(address)}
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-1.5 w-52 rounded-xl border border-border bg-background shadow-lg">
          <div className="border-b border-border px-4 py-2.5">
            <p className="text-xs text-muted-foreground">Connected via {wallet?.adapter.name}</p>
            <p className="mt-0.5 font-mono text-xs text-foreground">{truncateAddress(address)}</p>
          </div>
          <button
            onClick={() => { disconnect(); setOpen(false); }}
            className="w-full rounded-b-xl px-4 py-2.5 text-left text-sm text-destructive transition-colors hover:bg-secondary"
          >
            Disconnect
          </button>
        </div>
      )}
    </div>
  );
}
