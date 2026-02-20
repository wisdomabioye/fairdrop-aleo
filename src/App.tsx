import { useState } from "react";
import { Outlet } from "react-router-dom";
import { Sidebar } from "./shared/components/Sidebar";
import { TopBar } from "./shared/components/TopBar";
import { TransactionTracker } from "./shared/components/TransactionTracker";
import { TransactionTrackerProvider } from "./shared/context/TransactionTrackerContext";
import { RefreshProvider } from "./shared/context/RefreshContext";

export default function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <RefreshProvider>
    <TransactionTrackerProvider>
      <div className="flex h-screen bg-background text-foreground">
        <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        <div className="flex flex-1 flex-col overflow-hidden">
          <TopBar onMenuToggle={() => setSidebarOpen((o) => !o)} />

          <div className="flex items-center justify-center gap-1.5 border-b border-border/50 bg-secondary/40 px-4 py-1.5 text-center text-xs text-warning">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-warning animate-pulse" />
            On-chain data may take a few minutes to reflect. If records are missing: Leo wallet → ⚙ → Advanced → <span className="font-semibold">Upgrade Records</span>.
          </div>

          <main className="flex-1 overflow-y-auto scrollbar-thin">
            <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
              <Outlet />
            </div>
          </main>
        </div>
      </div>

      {/* Fixed transaction status widget — visible across all pages */}
      <TransactionTracker />
    </TransactionTrackerProvider>
    </RefreshProvider>
  );
}
