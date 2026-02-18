import { Card } from "@/shared/components/ui/Card";
import { PageHeader } from "@/shared/components/ui/PageHeader";

const steps = [
  {
    number: "1",
    title: "Mint Test Tokens",
    description:
      "Use the Faucet to create test tokens. You'll need sale tokens (to deposit into an auction) and payment tokens (for bidders to pay with).",
  },
  {
    number: "2",
    title: "Create an Auction",
    description:
      "Configure a Dutch auction by setting a start price, floor price, block range, and decay parameters. Your sale tokens are deposited into escrow.",
  },
  {
    number: "3",
    title: "Place Bids",
    description:
      "Bidders lock payment tokens against a quantity at the current price. All bids are private \u2014 encrypted as Aleo records visible only to the bidder.",
  },
  {
    number: "4",
    title: "Price Decays Over Time",
    description:
      "The price drops from the start price toward the floor price at regular block intervals. When total committed quantity meets supply, the auction can be closed.",
  },
  {
    number: "5",
    title: "Close & Clear",
    description:
      "The creator (or anyone) closes the auction once supply is met or the end block is reached. A single clearing price is set \u2014 all bidders pay the same price.",
  },
  {
    number: "6",
    title: "Claim Tokens",
    description:
      "After clearing, bidders claim their sale tokens and receive a refund for any overpayment (bid price minus clearing price, times quantity).",
  },
  {
    number: "7",
    title: "Withdraw Revenue",
    description:
      "The auction creator withdraws payment revenue and any unsold tokens from escrow.",
  },
];

export function GuidePage() {
  return (
    <div className="space-y-8 animate-fade-in">
      <PageHeader
        title="How It Works"
        description="A step-by-step guide to Fairdrop's privacy-preserving Dutch auctions."
      />

      <div className="space-y-4">
        {steps.map((step) => (
          <Card key={step.number} padding="default">
            <div className="flex gap-4">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full gradient-primary text-sm font-bold text-white">
                {step.number}
              </div>
              <div>
                <h3 className="font-semibold text-foreground">{step.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground leading-relaxed">{step.description}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Card variant="glass" padding="lg" className="text-center">
        <h3 className="text-lg font-semibold text-foreground">Key Guarantee</h3>
        <p className="mt-2 text-sm text-muted-foreground leading-relaxed max-w-xl mx-auto">
          Every participant pays the same clearing price, regardless of when they bid.
          Overpayments are automatically refunded. All bid details remain private through
          Aleo's zero-knowledge proof system.
        </p>
      </Card>
    </div>
  );
}
