import { useWallet } from "@provablehq/aleo-wallet-adaptor-react";
import { ConnectWalletPrompt } from "@/shared/components/ConnectWalletPrompt";
import { Card } from "@/shared/components/ui/Card";
import { PageHeader } from "@/shared/components/ui/PageHeader";
import { AuctionCreationForm } from "../components/AuctionCreationForm";

export function CreateAuctionPage() {
  const { address } = useWallet();

  return (
    <div className="mx-auto max-w-3xl space-y-8 animate-fade-in">
      <PageHeader
        title="Create Auction"
        description="Configure and launch a new Dutch auction."
      />

      {!address ? (
        <Card>
          <ConnectWalletPrompt
            title="Connect to create an auction"
            description="You need a connected wallet to configure and launch a Dutch auction."
          />
        </Card>
      ) : (
        <AuctionCreationForm address={address} />
      )}
    </div>
  );
}
