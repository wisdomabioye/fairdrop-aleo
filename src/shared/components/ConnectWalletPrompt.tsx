import { Wallet } from "lucide-react";
import { WalletMultiButton } from "@demox-labs/aleo-wallet-adapter-reactui";

interface ConnectWalletPromptProps {
  title?: string;
  description?: string;
}

/**
 * Displayed in place of wallet-gated content when no wallet is connected.
 * Renders as a centred block — drop it directly inside a <Card> or a page
 * container; it brings its own vertical padding.
 */
export function ConnectWalletPrompt({
  title = "Connect Your Wallet",
  description = "Connect your Aleo wallet to continue.",
}: ConnectWalletPromptProps) {
  return (
    <div className="flex flex-col items-center gap-6 py-10 text-center">
      {/* Icon with decorative rings */}
      <div className="relative flex items-center justify-center">
        <div className="absolute h-20 w-20 rounded-full bg-primary/5" />
        <div className="absolute h-14 w-14 rounded-full bg-primary/10 ring-1 ring-primary/20" />
        <div className="relative flex h-10 w-10 items-center justify-center">
          <Wallet className="h-6 w-6 text-primary" strokeWidth={1.75} />
        </div>
      </div>

      {/* Copy */}
      <div className="space-y-2">
        <h3 className="text-base font-semibold text-foreground">{title}</h3>
        <p className="mx-auto max-w-64 text-sm leading-relaxed text-muted-foreground">
          {description}
        </p>
      </div>

      {/* Action */}
      <WalletMultiButton />
    </div>
  );
}
