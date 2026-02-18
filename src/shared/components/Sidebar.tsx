import { NavLink } from "react-router-dom";

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

interface NavItem {
  to: string;
  label: string;
  end?: boolean;
}

const sections: { title: string; items: NavItem[] }[] = [
  {
    title: "HOME",
    items: [{ to: "/", label: "Dashboard", end: true }],
  },
  {
    title: "CREATOR",
    items: [
      { to: "/auction/new", label: "Create Auction" },
      { to: "/creator", label: "My Auctions", end: true },
    ],
  },
  {
    title: "BIDS",
    items: [
      { to: "/bids", label: "My Bids" },
      { to: "/claim", label: "Claim" },
    ],
  },
  {
    title: "TOOLS",
    items: [
      { to: "/faucet", label: "Faucet" },
      { to: "/tokens", label: "Token Manager" },
    ],
  },
  {
    title: "GUIDE",
    items: [{ to: "/guide", label: "How It Works" }],
  },
];

function NavSection({ title, items, onClose }: { title: string; items: NavItem[]; onClose: () => void }) {
  return (
    <div>
      <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-widest text-sidebar-foreground/40">
        {title}
      </p>
      {items.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.end}
          onClick={onClose}
          className={({ isActive }) =>
            `flex items-center rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
              isActive
                ? "bg-sidebar-accent text-sidebar-primary"
                : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
            }`
          }
        >
          {item.label}
        </NavLink>
      ))}
    </div>
  );
}

export function Sidebar({ open, onClose }: SidebarProps) {
  return (
    <>
      {/* Mobile backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-50 flex h-screen w-64 flex-col border-r border-sidebar-border bg-sidebar transition-transform duration-200 lg:static lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Logo */}
        <div className="flex h-14 items-center border-b border-sidebar-border px-5">
          <NavLink to="/" className="text-gradient-primary text-lg font-bold tracking-tight" onClick={onClose}>
            Fairdrop
          </NavLink>
        </div>

        {/* Nav sections */}
        <nav className="flex-1 space-y-6 overflow-y-auto p-4 scrollbar-thin">
          {sections.map((section) => (
            <NavSection key={section.title} title={section.title} items={section.items} onClose={onClose} />
          ))}
        </nav>
      </aside>
    </>
  );
}
