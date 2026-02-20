# Fairdrop

A privacy-preserving descending-price auction on Aleo. Every participant pays the same final clearing price — no front-running, no whale signaling, no information asymmetry.

---

## Contents

1. [The Problem](#the-problem)
2. [How Fairdrop Works](#how-fairdrop-works)
3. [Why Aleo](#why-aleo)
4. [Privacy Design: Token Requirements](#privacy-design-token-requirements)
5. [The Net Effect](#the-net-effect)
6. [Architecture](#architecture)
7. [Project Structure](#project-structure)
8. [Development](#development)
9. [Roadmap](#roadmap)
10. [Known Challenges](#known-challenges)

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

## Roadmap

### Phase 1 — Testnet v1 (Current)

A self-contained, working end-to-end Dutch auction on Aleo Testnet Beta. Custom `Token` records keep everything within a single program — intentional for learning how records, transitions, and finalize blocks interact before introducing cross-program calls.

- Dutch auction with configurable decay schedule, private Bid records, uniform clearing price
- Permissionless `close_auction`, per-creator linked list for discovery
- Bidder claim with sale tokens + payment refund, creator revenue and unsold token withdrawal
- Frontend: dashboard layout, auction lifecycle pages, price chart, token manager, creator dashboard, Leo Wallet integration

---

### Phase 2 — Frontend Completion

Polish the frontend so a non-technical user can participate without friction.

- Toast/notification system for transaction submission and confirmation
- Meaningful loading and error states across all pages
- Mobile layout — sidebar drawer, responsive grids
- Auction search and filtering on the browse page
- Auction metadata fields (name, description, project links) attached at creation and displayed in the UI

---

### Phase 3 — Contract Hardening

Strengthen the protocol before building new features on top of it.

- **Closer reward**: a fixed incentive from escrow paid to whoever triggers `close_auction` — removes implicit dependency on the creator and opens the door to automated closers
- **Auction cancellation**: creator can cancel before the start block and recover deposited sale tokens in full, with all existing bids refunded
- **Protocol fee**: configurable basis-point fee on creator revenue, claimable by a protocol treasury address — the first economic primitive for sustaining development
- Redeploy and full regression test on testnet

---

### Phase 4 — New Auction Modes

Expand beyond a single auction type to serve different distribution goals.

- **Sealed-bid mode**: bidders commit a fixed price and quantity in a single submission rather than bidding at the current Dutch price. All bids remain private. The contract clears at the price where cumulative demand meets supply — closer to a traditional IPO bookbuild. Runs on the same escrow and claim infrastructure
- **Allowlist auctions**: creator uploads a Merkle root of permitted addresses. Bidders prove membership via ZK proof at bid time — participation is gated without revealing which addresses are on the list or which bidder is which
- **Minimum participation threshold**: creator sets a minimum number of unique bidders required for the auction to clear. If the threshold is not met by the end block, the auction voids and all payments are returned — gives bidders confidence they are not the only participant in a thin auction

---

### Phase 5 — Token Registry Integration

Replace the custom `Token` record with the Aleo Multi-Token Standard.

- Integrate `token_registry.aleo` — Fairdrop calls into the registry for all token movement instead of managing its own records
- Any registered token (ALEO credits, project tokens, stablecoins) becomes usable as payment or sale token without further contract changes
- `create_token`, `join_tokens`, `split_token` transitions removed — the registry handles token management natively
- Frontend token selector updated to enumerate tokens from the registry
- Full end-to-end testnet run with real registered tokens

---

### Phase 6 — Participation & Reputation Layer

Give bidders and creators on-chain identity that accumulates over time.

- **Proof of participation**: a non-transferable private record issued to every bidder at bid time, regardless of whether the auction clears or they win. Proves "I participated in auction X" without revealing bid size or identity — useful for future allowlists, governance weight, or loyalty rewards
- **Creator reputation**: public on-chain counters per creator address — auctions run, fill rate, total volume cleared. Surfaced in the UI as a trust signal before committing to a bid
- **Referral system**: ZK-proven referral tracking. Referrers register a private referral record. Referred bidders include a referral proof at bid time. The referrer earns a share of creator revenue without any on-chain link between referrer and participant being visible

---

### Phase 7 — Composability & Ecosystem

Make Fairdrop a building block for other protocols, not just a standalone product.

- **Vesting escrow**: an optional separate program that locks claimed sale tokens on a block-based schedule — useful for project token launches that want to enforce holding periods after distribution
- **Multi-tranche auctions**: a creator can schedule a series of auctions for the same token at different price tiers, with each tranche's clearing price informing the minimum floor of the next — structured distributions for larger raises
- **SDK early access**: TypeScript library exposing auction creation, bidding, and claiming as typed function calls — enables third-party frontends and aggregators to integrate Fairdrop without building their own wallet interaction layer

---

### Phase 8 — Security & Audit

Code freeze and third-party review before any real-value deployment.

- Independent audit of the Leo program by a firm with Aleo/ZK expertise
- Formal verification of the clearing price invariant and escrow accounting
- Resolve all audit findings, redeploy on testnet
- Internal red-team of the frontend
- Public bug bounty opened at the conclusion of this phase — no mainnet until bounty period closes clean

---

### Phase 9 — Mainnet

Full open launch.

- Mainnet deployment — creator allowlist removed, anyone can launch an auction
- SDK v1 published — full documentation, typed interfaces, example integrations
- Aggregate analytics — total volume, auctions run, unique bidder counts — without exposing individual activity
- Governance foundation: DAO structure for protocol fee parameters and treasury allocation
- Institutional tier: private auction mode with ZK-proven allowlist membership, optional vesting at claim time

---

## Known Challenges

Real-world development on Aleo surfaced constraints that are worth documenting for anyone building on this stack.

### Wallet Record Indexer Lag

The Leo Wallet indexes records asynchronously. After a transaction confirms on-chain, the new records it creates (Bid receipts, Token refunds, sale tokens) may not appear in `requestRecords` responses for several minutes. There is no event or callback to signal when indexing catches up — the only recourse is a manual refresh. Freshly minted tokens and claimed records both suffer from this delay.

### `requestRecords` Returns Stale Spent Records

The wallet continues returning records marked `spent: true` for an indeterminate period after they are consumed on-chain. This means the UI must handle a mixed list of live and spent records rather than receiving only unspent ones. Records cannot simply be hidden when `spent: true` because the indexer lag means a record can flip to spent before the corresponding new record appears — leaving the user with nothing visible.

### No Reliable Record Type Discrimination Without `recordName`

Records returned by `requestRecords` do not carry explicit type information in a standard field. Classification must use the `recordName` string provided by the wallet adapter. Inferring type from data field presence (e.g. checking for `auction_id` vs `token_id`) fails when field names overlap or when the wallet returns a record in an unexpected shape. Using `entry.recordName === "Bid"` / `entry.recordName === "Token"` is the only reliable approach.

### Sequential Linked-List Traversal

The on-chain per-creator auction index is implemented as a linked list (`creator_latest_auction` → `auction_prev_by_creator` chain). Traversal requires one sequential RPC call per auction in the list — these cannot be parallelised because each call returns the next cursor. A creator with many auctions will experience proportionally longer load times. Mitigated by caching the resolved ID list in `localStorage` and skipping traversal entirely when the count has not changed.

### No On-Chain Mapping Enumeration

Aleo mappings are key-value stores with no iterator. Enumerating all auctions requires a separate `auction_index` mapping keyed by sequential integer, fetched in parallel but requiring the total count from `stats` first. There is no native way to query "all entries" or "entries matching a predicate" — every list must be explicitly maintained by the contract as it writes.

### Record Inputs Must Be Raw Wallet Objects

The Leo Wallet's `requestTransaction` requires record inputs to be passed as the raw object returned by `requestRecords` — not a JSON string, not a reconstructed object, not a subset of the fields. Passing `JSON.stringify(record)` produces "Input is not a valid record type" at the wallet layer. The wallet resolves the record internally by `id` when it receives the original object reference.

### Claim Outputs a Zero-Amount Refund Record

When a bidder's payment exactly equals their cost at the clearing price (no overpayment), the `claim` transition still emits a zero-amount payment Token record as the refund output. This is a consequence of Leo requiring a fixed return signature — the transition cannot conditionally omit an output. The zero-amount record is harmless but appears in the bidder's wallet.

### `close_auction` Is Permissionless but Not Incentivised

Any address can call `close_auction` once the end condition is met, which eliminates creator-dependency risk. However, there is no on-chain incentive for a third party to pay the transaction fee to close an auction they did not create. In practice, the creator is still the most motivated party to close — they cannot withdraw revenue until closure. A future version could include a small closer reward funded from escrow.

---

## License

MIT
