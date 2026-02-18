# Fairdrop

A privacy-preserving descending-price auction on Aleo. Every participant pays the same final clearing price — no front-running, no whale signaling, no information asymmetry.

---

## The Problem

Token launches, NFT drops, and asset sales on transparent blockchains are structurally unfair. Transparency, usually a virtue, becomes a weapon:

- **Front-running** — Bots observe pending bids in the mempool and execute ahead of real participants, extracting value before a transaction confirms
- **Whale signaling** — Large bids are publicly visible the moment they land on-chain, allowing sophisticated actors to adjust their strategy in real time at the expense of ordinary participants
- **Price discrimination** — In a standard ascending auction, each participant pays what they bid. Early participants overpay; late participants time the market. Nobody pays the same "fair value"
- **Demand manipulation** — When cumulative demand is publicly visible, actors can coordinate to create artificial scarcity signals or suppress apparent interest to push prices down before committing

The result is a market where informed actors — those who can monitor on-chain state and react faster — extract value from everyone else. The mechanism itself is the attack surface.

---

## How Fairdrop Works

Fairdrop implements a **Dutch auction with uniform clearing price**: the price starts high and descends block-by-block according to a fixed decay schedule set by the creator. Participants bid privately as the price falls. When total committed demand meets total supply, the price freezes. Everyone who bid pays the same final price — no exceptions.

### Auction Lifecycle

**1. Creator configures and launches**
The auction creator deposits their sale tokens into a smart contract escrow and sets the auction parameters: starting price, floor price, the block at which the price begins descending, the block at which the auction expires, and how much the price drops per interval. These parameters are public — participants can verify the rules before bidding.

**2. Price descends**
From the start block onward, the price ticks down by a fixed amount every fixed number of blocks. The price never falls below the floor price. Participants can observe the current price and the aggregate demand at any moment.

**3. Participants place bids privately**
A participant selects a quantity and submits a payment token record covering at least the current price multiplied by their quantity. The full payment is locked into escrow immediately. The participant receives a private Bid record — a cryptographic receipt proving their participation and the amount they committed. Their individual bid amount and identity are not exposed on-chain in recoverable form.

**4. Supply is met or the auction expires**
The auction ends in one of two ways: total committed demand reaches total supply, or the auction passes its end block. Either way, the price at the moment of closure becomes the uniform clearing price. If supply was fully committed, the clearing price is the price at the exact block when supply was exhausted. If supply was not fully committed, the clearing price is the floor price.

**5. Anyone calls close**
The `close_auction` function is permissionless — any participant, observer, or automated service can trigger it once the ending condition is met. This removes dependency on the creator and eliminates the risk of the auction being left in limbo.

**6. Bidders claim privately**
Each participant submits their private Bid record to the `claim` function. The contract verifies the bid against the now-public clearing price and releases two private Token records to the bidder: their sale tokens (quantity they bid for) and a refund record covering any overpayment above the clearing price. The Bid record is consumed — double-claiming is cryptographically impossible.

**7. Creator withdraws revenue**
After clearing, the creator can withdraw their share of the payment escrow. The contract enforces that creator withdrawals are strictly bounded by `total_committed × clearing_price`, ensuring the refund pool for bidders is never at risk.

---

## Why Aleo

On a transparent blockchain, even a well-designed Dutch auction leaks too much. Knowing cumulative demand in real time allows sophisticated actors to time their bids strategically, defeating the purpose of uniform pricing. Aleo changes the game.

Aleo uses zero-knowledge proofs to separate what must be public from what must remain private:

| Information | Visibility | Reason |
|---|---|---|
| Auction parameters | Public | Participants must be able to verify rules |
| Current price | Public | Price discovery requires observable prices |
| Total committed demand | Public | Needed to determine when supply is met |
| Clearing price | Public after close | Required for claim validation |
| Individual bid quantities | Public in aggregate only | Added to total demand; individual amount is not separately stored |
| Bidder identity | Pseudonymous | Hashed in zero-knowledge; only the hash reaches on-chain state |
| Individual payment amounts | Private | Locked in escrow; only the total escrow balance is public |
| Sale tokens received at claim | Private | Delivered as an encrypted record to the bidder |
| Payment refunds | Private | Delivered as an encrypted record to the bidder |

**What is always private:** who bid, how much each person paid, and what each person received. These exist only as encrypted records, visible solely to their owners.

---

## Privacy Design: Token Requirements

Fairdrop's privacy guarantees depend on both the sale token and the payment token being implemented as **private records** — not public mappings.

**Sale tokens must be private records.** When a bidder claims their allocation, the sale tokens are issued as a private Token record encrypted to the bidder's address. This means no external observer can determine how many tokens any individual received, when they claimed, or what their effective position is. Even after the auction is fully settled, the distribution of tokens across participants is not reconstructible from on-chain data.

**Payment tokens must be private records.** A bidder's payment token balance must not be visible to others. If payment balances were stored in a public mapping, an observer could infer a participant's bid by watching their balance change at bid time. Private payment records ensure that the act of locking payment into escrow reveals only that a bid was placed — not the amount, not the identity.

Together, this means Fairdrop achieves complete bid confidentiality: the observable on-chain footprint of any participant is limited to the existence of a transaction. What was bid, what was paid, and what was received remain known only to the participant themselves.

This is not merely a design preference — it is a protocol requirement. Deploying Fairdrop with public token balances would eliminate the privacy guarantees the mechanism is designed to provide and expose participants to the same information asymmetry attacks the protocol was built to prevent.

---

## The Net Effect

| Property | Result |
|---|---|
| **Uniform price** | Every winning bidder pays the same clearing price regardless of when they bid |
| **No front-running** | Pending bids cannot be observed or sniped; there is no information to act on |
| **No whale signaling** | Individual bid sizes are never exposed; aggregate demand is the only public signal |
| **No timing advantage** | Bidding early or late carries no structural benefit — the clearing price applies to all |
| **No double-claiming** | Bid records are cryptographically consumed on claim; replay is impossible |
| **Permissionless settlement** | Closing and claiming require no trust in the creator |
| **Refund integrity** | Creator revenue is capped on-chain; the bidder refund pool cannot be drained |

---

## Architecture

### Records (private — encrypted to owner)

**Token** — A private token balance identified by a token type (`token_id`) and an amount. Used for both sale tokens and payment tokens. Token records can be split into two or merged from two, enabling precise bid sizing.

**Bid** — A private receipt issued to a bidder at the moment of bidding. It records the auction, the quantity committed, and the full payment amount locked. This record is the bidder's only claim to sale tokens and refunds after clearing.

### Mappings (public — on-chain state)

**auction\_configs** — Immutable auction parameters set at creation: token identities, supply, price schedule, and bid limits.

**auction\_states** — Mutable auction state: total committed demand, total payments in escrow, supply-met flag, cleared flag, clearing price, and creator revenue.

**bid\_totals** — Per-bidder cumulative bid quantities, keyed by a pseudonymous hash of the bidder address and auction ID. Used to enforce per-bidder maximums without exposing identity.

**escrow\_sales** — Sale tokens locked by the creator at auction creation, depleted as bidders claim.

**escrow\_payments** — Payment tokens accumulated from bids, depleted by bidder refunds and creator withdrawals.

**creator\_withdrawn / unsold\_withdrawn** — Tracks how much the creator has already withdrawn, preventing over-withdrawal.

**stats** — Global counters for total auctions and total bids placed.

### Transitions

| Transition | Caller | Purpose |
|---|---|---|
| `create_token` | Anyone (test utility) | Mint a private Token record |
| `join_tokens` | Token owner | Merge two Token records of the same type |
| `split_token` | Token owner | Split one Token record into two |
| `create_auction` | Creator | Deposit sale tokens and publish auction parameters |
| `place_bid` | Bidder | Lock payment tokens and receive a private Bid record |
| `close_auction` | Anyone | Freeze the clearing price once the auction has ended |
| `claim` | Bidder | Redeem a Bid record for sale tokens and payment refund |
| `withdraw_payments` | Creator | Collect revenue from the payment escrow after clearing |
| `withdraw_unsold` | Creator | Recover unsold sale tokens after clearing |

---

## Project Structure

```
fairdrop/
├── auction/          # Leo smart contract (fairdrop.aleo)
│   └── src/main.leo
└── src/              # React frontend (Vite + Tailwind)
    ├── features/     # Page-level feature modules
    └── shared/       # Hooks, components, and types
```

---

## Development

Install dependencies and start the development server:

```bash
pnpm install
pnpm run dev
```

The frontend runs at `http://localhost:5173` and connects to the Leo Wallet browser extension on Aleo Testnet Beta.

---

## License

MIT
