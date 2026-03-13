import { useWallet } from "@provablehq/aleo-wallet-adaptor-react";
import { useWalletModal } from "@provablehq/aleo-wallet-adaptor-react-ui";
import { Button } from "@/shared/components/ui/Button";
import { WalletMenu } from "./WalletMenu";

export function ConnectButton() {
  const { address, connected, connecting, disconnect, wallet } = useWallet();
  const { setVisible } = useWalletModal();

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
    <WalletMenu
      address={address}
      walletName={wallet?.adapter.name}
      walletIcon={wallet?.adapter.icon}
      onDisconnect={disconnect}
    />
  );
}
