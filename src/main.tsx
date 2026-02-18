import React, { useMemo } from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { WalletProvider } from "@demox-labs/aleo-wallet-adapter-react";
import { WalletModalProvider } from "@demox-labs/aleo-wallet-adapter-reactui";
import { LeoWalletAdapter } from "@demox-labs/aleo-wallet-adapter-leo";
import {
  DecryptPermission,
  WalletAdapterNetwork,
} from "@demox-labs/aleo-wallet-adapter-base";
import "@demox-labs/aleo-wallet-adapter-reactui/styles.css";
import "./app.css";

import App from "./App";
import { DashboardPage } from "./features/dashboard/pages/DashboardPage";
import { AuctionDetailPage } from "./features/auction/pages/AuctionDetailPage";
import { CreateAuctionPage } from "./features/auction/pages/CreateAuctionPage";
import { MyAuctionsPage } from "./features/creator/pages/MyAuctionsPage";
import { MyBidsPage } from "./features/bids/pages/MyBidsPage";
import { FaucetPage } from "./features/faucet/pages/FaucetPage";
import { ClaimPage } from "./features/claim/pages/ClaimPage";
import { CreatorDashboardPage } from "./features/creator/pages/CreatorDashboardPage";
import { TokenManagerPage } from "./features/tokens/pages/TokenManagerPage";
import { GuidePage } from "./features/guide/pages/GuidePage";

function Root() {
  const wallets = useMemo(
    () => [new LeoWalletAdapter({ appName: "Fairdrop" })],
    [],
  );

  return (
    <WalletProvider
      wallets={wallets}
      decryptPermission={DecryptPermission.AutoDecrypt}
      network={WalletAdapterNetwork.TestnetBeta}
      autoConnect
    >
      <WalletModalProvider>
        <BrowserRouter>
          <Routes>
            <Route element={<App />}>
              <Route index element={<DashboardPage />} />
              <Route path="auction/new" element={<CreateAuctionPage />} />
              <Route path="auction/:id" element={<AuctionDetailPage />} />
              <Route path="creator" element={<MyAuctionsPage />} />
              <Route path="creator/manage" element={<CreatorDashboardPage />} />
              <Route path="bids" element={<MyBidsPage />} />
              <Route path="claim" element={<ClaimPage />} />
              <Route path="faucet" element={<FaucetPage />} />
              <Route path="tokens" element={<TokenManagerPage />} />
              <Route path="guide" element={<GuidePage />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </WalletModalProvider>
    </WalletProvider>
  );
}

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>,
);
