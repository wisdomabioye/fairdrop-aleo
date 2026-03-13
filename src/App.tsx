import { useState } from "react";
import { Outlet } from "react-router-dom";
import { Sidebar } from "./shared/components/Sidebar";
import { TopBar } from "./shared/components/TopBar";
import { GlobalStats } from "./shared/components/GlobalStats";
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

          <GlobalStats />

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
