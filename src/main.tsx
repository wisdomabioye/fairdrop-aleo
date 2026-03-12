import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { WalletAdaptorProvider } from "@/providers/WalletAdaptorProvider";
import "./app.css";

import App from "./App";
import { DashboardPage } from "./features/dashboard/pages/DashboardPage";
import { AuctionDetailPage } from "./features/auction/pages/AuctionDetailPage";
import { CreateAuctionPage } from "./features/auction/pages/CreateAuctionPage";
import { MyAuctionsPage } from "./features/creator/pages/MyAuctionsPage";
import { MyBidsPage } from "./features/bids/pages/MyBidsPage";
import { ClaimPage } from "./features/claim/pages/ClaimPage";
import { CreatorDashboardPage } from "./features/creator/pages/CreatorDashboardPage";
import { TokenManagerPage } from "./features/token-manager/pages/TokenManagerPage";
import { TokenLaunchPage } from "./features/token-launch/pages/TokenLaunchPage";
import { GuidePage } from "./features/guide/pages/GuidePage";

function Root() {
  return (
    <WalletAdaptorProvider>
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
              <Route path="token-manager" element={<TokenManagerPage />} />
              <Route path="token-launch" element={<TokenLaunchPage />} />
              {/* Legacy redirect */}
              <Route path="guide" element={<GuidePage />} />
            </Route>
          </Routes>
        </BrowserRouter>
    </WalletAdaptorProvider>
  );
}

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>,
);
