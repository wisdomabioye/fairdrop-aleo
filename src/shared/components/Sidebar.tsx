import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  PlusCircle,
  Gavel,
  ClipboardList,
  PackageCheck,
  Droplets,
  Layers,
  BookOpen,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react";
import { AppRoutes } from "@/config/app.route";
import fairdropLogo from "@/assets/fairdrop.svg"

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  end?: boolean;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

const sections: NavSection[] = [
  {
    title: "Overview",
    items: [
      { to: AppRoutes.dashboard, label: "Dashboard", icon: LayoutDashboard, end: true },
    ],
  },
  {
    title: "Creator",
    items: [
      { to: AppRoutes.tokenLaunch, label: "Token Launch", icon: Droplets },
      { to: AppRoutes.createAuction, label: "Create Auction", icon: PlusCircle },
      { to: AppRoutes.myAuctions, label: "My Auctions", icon: Gavel, end: true },
    ],
  },
  {
    title: "Bidder",
    items: [
      { to: AppRoutes.myBids, label: "My Bids", icon: ClipboardList },
      { to: AppRoutes.claim, label: "Claim", icon: PackageCheck },
    ],
  },
  {
    title: "Tools",
    items: [
      { to: AppRoutes.tokenManager, label: "Token Manager", icon: Layers },
      { to: AppRoutes.shield, label: "Shield Credits", icon: ShieldCheck },
    ],
  },
  {
    title: "Learn",
    items: [
      { to: AppRoutes.howItWorks, label: "How It Works", icon: BookOpen },
    ],
  },
];

function NavSectionGroup({
  section,
  onClose,
}: {
  section: NavSection;
  onClose: () => void;
}) {
  return (
    <div className="space-y-0.5">
      <p className="mb-1 px-3 text-[10px] font-semibold uppercase tracking-widest text-sidebar-foreground/35">
        {section.title}
      </p>
      {section.items.map((item) => {
        const Icon = item.icon;
        return (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            onClick={onClose}
            className={({ isActive }) =>
              `group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-150 ${
                isActive
                  ? "bg-sidebar-accent text-sidebar-primary shadow-sm"
                  : "text-sidebar-foreground/60 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground"
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Icon
                  className={`h-[17px] w-[17px] shrink-0 transition-colors ${
                    isActive
                      ? "text-sidebar-primary"
                      : "text-sidebar-foreground/40 group-hover:text-sidebar-foreground/70"
                  }`}
                  strokeWidth={isActive ? 2.25 : 1.75}
                />
                <span className="leading-none">{item.label}</span>
              </>
            )}
          </NavLink>
        );
      })}
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

      <aside
        className={`fixed top-0 left-0 z-50 flex h-screen w-60 flex-col border-r border-sidebar-border bg-sidebar transition-transform duration-200 lg:static lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Logo */}
        <div className="flex h-14 items-center gap-2.5 border-b border-sidebar-border px-4">
          <img src={fairdropLogo} alt="Fairdrop" className="h-8 w-8" />
          <NavLink
            to="/"
            onClick={onClose}
            className="text-gradient-primary text-[15px] font-bold tracking-tight leading-none"
          >
            Fairdrop
          </NavLink>
          <span className="ml-auto rounded-full bg-warning/10 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-warning">
            Beta
          </span>
        </div>

        {/* Nav */}
        <nav className="flex-1 space-y-5 overflow-y-auto px-3 py-4 scrollbar-thin">
          {sections.map((section) => (
            <NavSectionGroup key={section.title} section={section} onClose={onClose} />
          ))}
        </nav>

        {/* Footer — network indicator */}
        <div className="border-t border-sidebar-border px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-50" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-success" />
            </span>
            <span className="text-xs text-sidebar-foreground/50">Aleo Testnet Beta</span>
          </div>
        </div>
      </aside>
    </>
  );
}
