import { Link } from "react-router-dom";
import {
  Rocket,
  Gavel,
  Lock,
  TrendingDown,
  CheckCircle2,
  Gift,
  Wallet,
  ShieldCheck,
  ArrowRight,
  type LucideIcon,
} from "lucide-react";
import { Card } from "@/shared/components/ui/Card";
import { AppRoutes } from "@/config/app.route";

interface Step {
  icon: LucideIcon;
  title: string;
  description: string;
  link?: { to: string; label: string };
  accent: string;
}

const steps: Step[] = [
  {
    icon: Rocket,
    title: "Launch a Token",
    description:
      "Register your token on ARC-21, mint the initial supply, and authorize the auction contract to distribute it.",
    link: { to: AppRoutes.tokenLaunch, label: "Launch Token" },
    accent: "from-blue-500/20 to-cyan-500/20",
  },
  {
    icon: Gavel,
    title: "Create an Auction",
    description:
      "Set your start price, floor price, block range, and decay curve. Your tokens go into on-chain escrow.",
    link: { to: AppRoutes.createAuction, label: "Create Auction" },
    accent: "from-violet-500/20 to-purple-500/20",
  },
  {
    icon: Lock,
    title: "Place Bids",
    description:
      "Bidders lock credits against a quantity at the current price. Every bid is encrypted — only the bidder can see it.",
    link: { to: AppRoutes.dashboard, label: "Browse Auctions" },
    accent: "from-emerald-500/20 to-green-500/20",
  },
  {
    icon: TrendingDown,
    title: "Price Decays",
    description:
      "The price drops from start → floor at regular block intervals. Once committed quantity meets supply, the auction can close.",
    accent: "from-amber-500/20 to-yellow-500/20",
  },
  {
    icon: CheckCircle2,
    title: "Close & Clear",
    description:
      "Anyone can close the auction when supply is met or the end block arrives. A single clearing price is set — everyone pays the same.",
    link: { to: AppRoutes.myAuctions, label: "My Auctions" },
    accent: "from-sky-500/20 to-blue-500/20",
  },
  {
    icon: Gift,
    title: "Claim Tokens",
    description:
      "Bidders claim their tokens and get an automatic refund for any overpayment above the clearing price.",
    link: { to: AppRoutes.claim, label: "Claim" },
    accent: "from-pink-500/20 to-rose-500/20",
  },
  {
    icon: Wallet,
    title: "Withdraw Revenue",
    description:
      "The creator withdraws payment revenue and any unsold tokens from escrow.",
    link: { to: AppRoutes.myAuctions, label: "My Auctions" },
    accent: "from-orange-500/20 to-red-500/20",
  },
];

function StepCard({ step, index }: { step: Step; index: number }) {
  const Icon = step.icon;
  return (
    <Card padding="default" className="group relative overflow-hidden transition-all hover:shadow-md">
      <div className={`absolute inset-0 bg-gradient-to-br ${step.accent} opacity-0 transition-opacity group-hover:opacity-100`} />
      <div className="relative flex gap-3.5">
        <div className="flex flex-col items-center gap-1.5">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg gradient-primary text-sm font-bold text-white shadow-sm">
            {index + 1}
          </div>
          <Icon className="h-4 w-4 text-muted-foreground" strokeWidth={1.5} />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-semibold text-foreground sm:text-lg">{step.title}</h3>
          <p className="mt-1 text-sm text-muted-foreground leading-relaxed sm:text-base">{step.description}</p>
          {step.link && (
            <Link
              to={step.link.to}
              className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
            >
              {step.link.label}
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          )}
        </div>
      </div>
    </Card>
  );
}

export function GuidePage() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-2xl font-bold text-foreground">How It Works</h2>
        <p className="mt-1 text-base text-muted-foreground">7 steps to a fair, private auction.</p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {steps.map((step, i) => (
          <StepCard key={i} step={step} index={i} />
        ))}
      </div>

      <Card variant="glass" padding="lg" className="text-center">
        <ShieldCheck className="mx-auto h-5 w-5 text-primary" strokeWidth={1.75} />
        <h3 className="mt-2 text-base font-semibold text-foreground">The Fairdrop Guarantee</h3>
        <p className="mt-1 mx-auto max-w-md text-sm text-muted-foreground leading-relaxed">
          One clearing price for everyone. Automatic overpayment refunds. All bids stay private via Aleo's zero-knowledge proofs.
        </p>
      </Card>
    </div>
  );
}
