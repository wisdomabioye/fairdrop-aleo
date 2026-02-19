// Fairdrop — Privacy-preserving descending-price auction on Aleo.
// Every participant pays the same final clearing price.
// Bidder identities and individual amounts are hidden via zero-knowledge proofs.

program fairdrop.aleo {

    @admin(address="aleo128wz89c78ur4mx378056yd9q7kqmphr07k0kfsmnwvqnv7g9syyqkg263r")
    async constructor() {}

    // =========================================================================
    // Records (Private — encrypted to owner)
    // =========================================================================

    // Private token balance.
    record Token {
        owner: address,
        token_id: field,
        amount: u128,
    }

    // Private bid receipt — proof of participation, used to claim after clearing.
    record Bid {
        owner: address,
        auction_id: field,
        quantity: u128,
        payment_amount: u128,
    }

    // =========================================================================
    // Structs
    // =========================================================================

    // Immutable auction parameters set by the creator.
    struct AuctionConfig {
        auction_id: field,
        creator: address,
        sale_token_id: field,
        payment_token_id: field,
        supply: u128,
        start_price: u128,
        floor_price: u128,
        start_block: u32,
        end_block: u32,
        price_decay_blocks: u32,
        price_decay_amount: u128,
        max_bid_amount: u128,       // 0 = unlimited
        min_bid_amount: u128,       // minimum quantity per bid
    }

    // Mutable auction state updated during the auction lifecycle.
    struct AuctionState {
        total_committed: u128,      // total sale tokens bid for
        total_payments: u128,       // total payment tokens collected
        supply_met: bool,           // true when total_committed >= supply
        ended_at_block: u32,        // block height when supply was met (0 if not yet)
        cleared: bool,              // true after close_auction is called
        clearing_price: u128,       // final uniform price (set at clearing)
        creator_revenue: u128,      // total_committed * clearing_price (set at clearing)
    }

    // Used to hash (bidder, auction_id) into a pseudonymous key for bid tracking.
    struct BidderKey {
        bidder: address,
        auction_id: field,
    }

    // Used to derive auction_id = hash(creator, nonce).
    struct AuctionKey {
        creator: address,
        nonce: u64,
    }

    // Global on-chain statistics.
    struct Stats {
        total_auctions: u64,
        total_bids: u64,
    }

    // =========================================================================
    // Mappings (Public — on-chain state)
    // =========================================================================

    // Auction configuration, keyed by auction_id.
    mapping auction_configs: field => AuctionConfig;

    // Auction state, keyed by auction_id.
    mapping auction_states: field => AuctionState;

    // Cumulative bid quantity per (bidder, auction), keyed by hash(BidderKey).
    // Used to enforce max_bid_amount. Bidder identity is pseudonymous (hashed).
    mapping bid_totals: field => u128;

    // Escrowed sale tokens per auction. Deposited by creator, claimed by bidders.
    mapping escrow_sales: field => u128;

    // Escrowed payment tokens per auction. Deposited by bidders, split between
    // refunds (to bidders) and revenue (to creator) after clearing.
    mapping escrow_payments: field => u128;

    // Tracks how much revenue the creator has withdrawn.
    mapping creator_withdrawn: field => u128;

    // Tracks how many unsold sale tokens the creator has withdrawn.
    mapping unsold_withdrawn: field => u128;

    // Global stats, keyed by 0field (singleton).
    mapping stats: field => Stats;

    // Sequential index for auction discovery: index → auction_id.
    // Enables enumeration without knowing IDs in advance.
    // Key = total_auctions value at creation time (0-based sequential u64).
    mapping auction_index: u64 => field;

    // Per-creator auction count. Enables instant zero-check before traversal.
    mapping creator_auction_count: address => u64;

    // Per-creator linked list for O(K) auction discovery — no BHP256 needed.
    // Head: creator address → most recent auction_id (0field = no auctions yet).
    mapping creator_latest_auction: address => field;
    // Link: auction_id → that creator's previous auction_id (0field = first auction).
    mapping auction_prev_by_creator: field => field;

    // =========================================================================
    // 1. Token Helpers
    // =========================================================================

    // Mint tokens. In production, this would be access-controlled or imported.
    transition create_token(
        recipient: address,
        token_id: field,
        amount: u128,
    ) -> Token {
        assert(amount > 0u128);
        return Token { owner: recipient, token_id: token_id, amount: amount };
    }

    // Merge two token records of the same type.
    transition join_tokens(a: Token, b: Token) -> Token {
        assert_eq(a.token_id, b.token_id);
        return Token { owner: a.owner, token_id: a.token_id, amount: a.amount + b.amount };
    }

    // Split a token record into two.
    transition split_token(input: Token, amount: u128) -> (Token, Token) {
        assert(amount > 0u128);
        let remaining: u128 = input.amount - amount;
        assert(remaining > 0u128);
        return (
            Token { owner: input.owner, token_id: input.token_id, amount: amount },
            Token { owner: input.owner, token_id: input.token_id, amount: remaining },
        );
    }

    // =========================================================================
    // 2. Create Auction
    // =========================================================================

    // Creator deposits sale tokens and configures the auction.
    // All config is public so participants can verify the rules.
    async transition create_auction(
        sale_tokens: Token,
        public payment_token_id: field,
        public start_price: u128,
        public floor_price: u128,
        public start_block: u32,
        public end_block: u32,
        public price_decay_blocks: u32,
        public price_decay_amount: u128,
        public max_bid_amount: u128,
        public min_bid_amount: u128,
    ) -> Future {
        assert(sale_tokens.amount > 0u128);

        return finalize_create_auction(
            self.signer,
            sale_tokens.token_id,
            sale_tokens.amount,
            payment_token_id,
            start_price,
            floor_price,
            start_block,
            end_block,
            price_decay_blocks,
            price_decay_amount,
            max_bid_amount,
            min_bid_amount,
        );
    }

    async function finalize_create_auction(
        creator: address,
        sale_token_id: field,
        supply: u128,
        payment_token_id: field,
        start_price: u128,
        floor_price: u128,
        start_block: u32,
        end_block: u32,
        price_decay_blocks: u32,
        price_decay_amount: u128,
        max_bid_amount: u128,
        min_bid_amount: u128,
    ) {
        // Validate parameters.
        assert(payment_token_id != sale_token_id);
        assert(start_block >= block.height);
        assert(floor_price > 0u128);
        assert(start_price > floor_price);
        assert(end_block > start_block);
        assert(price_decay_blocks > 0u32);
        assert(price_decay_amount > 0u128);
        assert(supply > 0u128);
        assert(min_bid_amount > 0u128);
        assert(max_bid_amount == 0u128 || max_bid_amount >= min_bid_amount);

        // Derive auction_id from creator + sequential nonce.
        let current_stats: Stats = stats.get_or_use(0field, Stats {
            total_auctions: 0u64,
            total_bids: 0u64,
        });
        let auction_id: field = BHP256::hash_to_field(
            AuctionKey { creator: creator, nonce: current_stats.total_auctions }
        );

        auction_configs.set(auction_id, AuctionConfig {
            auction_id: auction_id,
            creator: creator,
            sale_token_id: sale_token_id,
            payment_token_id: payment_token_id,
            supply: supply,
            start_price: start_price,
            floor_price: floor_price,
            start_block: start_block,
            end_block: end_block,
            price_decay_blocks: price_decay_blocks,
            price_decay_amount: price_decay_amount,
            max_bid_amount: max_bid_amount,
            min_bid_amount: min_bid_amount,
        });

        auction_states.set(auction_id, AuctionState {
            total_committed: 0u128,
            total_payments: 0u128,
            supply_met: false,
            ended_at_block: 0u32,
            cleared: false,
            clearing_price: 0u128,
            creator_revenue: 0u128,
        });

        // Lock sale tokens in escrow.
        escrow_sales.set(auction_id, supply);

        // Register auction in the global sequential index for discovery.
        auction_index.set(current_stats.total_auctions, auction_id);

        // Update per-creator count and linked list for efficient creator discovery.
        let creator_count: u64 = creator_auction_count.get_or_use(creator, 0u64);
        creator_auction_count.set(creator, creator_count + 1u64);
        let prev_head: field = creator_latest_auction.get_or_use(creator, 0field);
        auction_prev_by_creator.set(auction_id, prev_head);
        creator_latest_auction.set(creator, auction_id);

        // Increment global auction counter.
        stats.set(0field, Stats {
            total_auctions: current_stats.total_auctions + 1u64,
            total_bids: current_stats.total_bids,
        });
    }

    // =========================================================================
    // 3. Place Bid
    // =========================================================================

    // Bidder commits payment tokens to purchase sale tokens at the current price.
    // The full payment Token is locked — no change returned. Any overpayment
    // above the clearing price is refunded when the bidder calls claim().
    //
    // Privacy model:
    //   - Bidder identity: pseudonymous (hashed in ZK, only hash goes on-chain)
    //   - Bid quantity: visible in finalize (required to update aggregate demand)
    //   - Payment record: consumed privately, only the amount is public
    async transition place_bid(
        payment: Token,
        public auction_id: field,
        public quantity: u128,
    ) -> (Bid, Future) {
        assert(quantity > 0u128);

        // Create private bid receipt. Full payment amount is locked.
        let bid: Bid = Bid {
            owner: self.signer,
            auction_id: auction_id,
            quantity: quantity,
            payment_amount: payment.amount,
        };

        // Hash bidder identity in ZK — only the hash reaches finalize.
        let bid_total_key: field = BHP256::hash_to_field(
            BidderKey { bidder: self.signer, auction_id: auction_id }
        );

        return (bid, finalize_place_bid(
            auction_id,
            bid_total_key,
            quantity,
            payment.token_id,
            payment.amount,
        ));
    }

    async function finalize_place_bid(
        auction_id: field,
        bid_total_key: field,
        quantity: u128,
        payment_token_id: field,
        payment_amount: u128,
    ) {
        let config: AuctionConfig = auction_configs.get(auction_id);
        let state: AuctionState = auction_states.get(auction_id);

        // Auction must be active.
        assert(!state.supply_met);
        assert(!state.cleared);
        assert(block.height >= config.start_block);
        assert(block.height < config.end_block);

        // Payment must be in the correct token.
        assert_eq(payment_token_id, config.payment_token_id);

        // Compute current price from the decay schedule.
        let blocks_elapsed: u32 = block.height - config.start_block;
        let decay_steps: u128 = (blocks_elapsed / config.price_decay_blocks) as u128;
        let total_decay: u128 = decay_steps * config.price_decay_amount;
        let price_range: u128 = config.start_price - config.floor_price;
        let current_price: u128 = total_decay < price_range
            ? config.start_price - total_decay
            : config.floor_price;

        // Payment must cover quantity at current price.
        assert(payment_amount >= quantity * current_price);

        // Enforce minimum bid quantity.
        assert(quantity >= config.min_bid_amount);

        // Quantity must not exceed remaining supply.
        assert(state.total_committed + quantity <= config.supply);

        // Enforce max bid amount per bidder (0 = unlimited).
        let current_total: u128 = bid_totals.get_or_use(bid_total_key, 0u128);
        let new_total: u128 = current_total + quantity;
        let within_limit: bool = config.max_bid_amount == 0u128
            || new_total <= config.max_bid_amount;
        assert(within_limit);
        bid_totals.set(bid_total_key, new_total);

        // Update auction state.
        let new_committed: u128 = state.total_committed + quantity;
        let is_supply_met: bool = new_committed >= config.supply;

        auction_states.set(auction_id, AuctionState {
            total_committed: new_committed,
            total_payments: state.total_payments + payment_amount,
            supply_met: is_supply_met,
            ended_at_block: is_supply_met ? block.height : state.ended_at_block,
            cleared: false,
            clearing_price: 0u128,
            creator_revenue: 0u128,
        });

        // Add payment to escrow.
        let current_escrow: u128 = escrow_payments.get_or_use(auction_id, 0u128);
        escrow_payments.set(auction_id, current_escrow + payment_amount);

        // Increment bid counter.
        let current_stats: Stats = stats.get(0field);
        stats.set(0field, Stats {
            total_auctions: current_stats.total_auctions,
            total_bids: current_stats.total_bids + 1u64,
        });
    }

    // =========================================================================
    // 4. Close Auction (Permissionless)
    // =========================================================================

    // Anyone can call this once the auction has ended (by supply or by time).
    // Determines the clearing price and locks it permanently.
    //
    // Clearing price logic:
    //   - Supply met: price at the block when supply was exhausted (from decay schedule)
    //   - Supply not met: floor_price (market didn't clear above floor)
    async transition close_auction(public auction_id: field) -> Future {
        return finalize_close_auction(auction_id);
    }

    async function finalize_close_auction(auction_id: field) {
        let config: AuctionConfig = auction_configs.get(auction_id);
        let state: AuctionState = auction_states.get(auction_id);

        // Must not already be cleared.
        assert(!state.cleared);

        // Must have ended: supply exhausted OR past end_block.
        assert(state.supply_met || block.height >= config.end_block);

        // Compute clearing price.
        // Supply met: price at the block when supply was exhausted.
        // Supply not met: floor_price — market didn't clear above floor.
        if (state.supply_met) {
            let blocks_elapsed: u32 = state.ended_at_block - config.start_block;
            let decay_steps: u128 = (blocks_elapsed / config.price_decay_blocks) as u128;
            let total_decay: u128 = decay_steps * config.price_decay_amount;
            let price_range: u128 = config.start_price - config.floor_price;
            let clearing_price: u128 = total_decay < price_range
                ? config.start_price - total_decay
                : config.floor_price;

            let revenue: u128 = state.total_committed * clearing_price;

            auction_states.set(auction_id, AuctionState {
                total_committed: state.total_committed,
                total_payments: state.total_payments,
                supply_met: state.supply_met,
                ended_at_block: state.ended_at_block,
                cleared: true,
                clearing_price: clearing_price,
                creator_revenue: revenue,
            });
        } else {
            let clearing_price: u128 = config.floor_price;
            let revenue: u128 = state.total_committed * clearing_price;

            auction_states.set(auction_id, AuctionState {
                total_committed: state.total_committed,
                total_payments: state.total_payments,
                supply_met: state.supply_met,
                ended_at_block: state.ended_at_block,
                cleared: true,
                clearing_price: clearing_price,
                creator_revenue: revenue,
            });
        }
    }

    // =========================================================================
    // 5. Claim (Bidder)
    // =========================================================================

    // Bidder redeems their Bid record for sale tokens + payment refund.
    // The Bid record is consumed (spent once — no double claims).
    //
    // The caller reads clearing_price and token IDs from public mappings
    // and passes them in. Finalize validates they match on-chain state.
    async transition claim(
        bid: Bid,
        public clearing_price: u128,
        public sale_token_id: field,
        public payment_token_id: field,
    ) -> (Token, Token, Future) {
        // Sale tokens received = bid quantity.
        let sale_amount: u128 = bid.quantity;

        // Refund = overpayment above clearing price.
        let cost_at_clearing: u128 = bid.quantity * clearing_price;
        let refund_amount: u128 = bid.payment_amount - cost_at_clearing;

        let sale_token: Token = Token {
            owner: bid.owner,
            token_id: sale_token_id,
            amount: sale_amount,
        };

        let refund_token: Token = Token {
            owner: bid.owner,
            token_id: payment_token_id,
            amount: refund_amount,
        };

        return (sale_token, refund_token, finalize_claim(
            bid.auction_id,
            clearing_price,
            sale_token_id,
            payment_token_id,
            sale_amount,
            refund_amount,
        ));
    }

    async function finalize_claim(
        auction_id: field,
        clearing_price: u128,
        sale_token_id: field,
        payment_token_id: field,
        sale_amount: u128,
        refund_amount: u128,
    ) {
        let config: AuctionConfig = auction_configs.get(auction_id);
        let state: AuctionState = auction_states.get(auction_id);

        // Auction must be cleared.
        assert(state.cleared);

        // Validate caller-provided values match on-chain state.
        assert_eq(clearing_price, state.clearing_price);
        assert_eq(sale_token_id, config.sale_token_id);
        assert_eq(payment_token_id, config.payment_token_id);

        // Deduct sale tokens from escrow.
        let sale_remaining: u128 = escrow_sales.get(auction_id);
        assert(sale_amount <= sale_remaining);
        escrow_sales.set(auction_id, sale_remaining - sale_amount);

        // Deduct refund from payment escrow.
        let payment_remaining: u128 = escrow_payments.get(auction_id);
        assert(refund_amount <= payment_remaining);
        escrow_payments.set(auction_id, payment_remaining - refund_amount);
    }

    // =========================================================================
    // 6. Creator Withdrawals
    // =========================================================================

    // Creator withdraws revenue (payment tokens) after clearing.
    // Capped at creator_revenue to protect the refund pool.
    async transition withdraw_payments(
        public auction_id: field,
        public amount: u128,
        public payment_token_id: field,
    ) -> (Token, Future) {
        assert(amount > 0u128);

        let token: Token = Token {
            owner: self.signer,
            token_id: payment_token_id,
            amount: amount,
        };

        return (token, finalize_withdraw_payments(
            auction_id, self.signer, amount, payment_token_id,
        ));
    }

    async function finalize_withdraw_payments(
        auction_id: field,
        caller: address,
        amount: u128,
        payment_token_id: field,
    ) {
        let config: AuctionConfig = auction_configs.get(auction_id);
        let state: AuctionState = auction_states.get(auction_id);

        assert(state.cleared);
        assert_eq(caller, config.creator);
        assert_eq(payment_token_id, config.payment_token_id);

        // Creator can only withdraw up to their revenue (protects refund pool).
        let withdrawn: u128 = creator_withdrawn.get_or_use(auction_id, 0u128);
        let new_withdrawn: u128 = withdrawn + amount;
        assert(new_withdrawn <= state.creator_revenue);
        creator_withdrawn.set(auction_id, new_withdrawn);

        // Deduct from payment escrow.
        let escrow: u128 = escrow_payments.get(auction_id);
        assert(amount <= escrow);
        escrow_payments.set(auction_id, escrow - amount);
    }

    // Creator withdraws unsold sale tokens after clearing.
    // Only relevant when supply was not fully met.
    async transition withdraw_unsold(
        public auction_id: field,
        public amount: u128,
        public sale_token_id: field,
    ) -> (Token, Future) {
        assert(amount > 0u128);

        let token: Token = Token {
            owner: self.signer,
            token_id: sale_token_id,
            amount: amount,
        };

        return (token, finalize_withdraw_unsold(
            auction_id, self.signer, amount, sale_token_id,
        ));
    }

    async function finalize_withdraw_unsold(
        auction_id: field,
        caller: address,
        amount: u128,
        sale_token_id: field,
    ) {
        let config: AuctionConfig = auction_configs.get(auction_id);
        let state: AuctionState = auction_states.get(auction_id);

        assert(state.cleared);
        assert_eq(caller, config.creator);
        assert_eq(sale_token_id, config.sale_token_id);

        // Unsold = supply - total_committed. Creator can only withdraw unsold tokens.
        let unsold: u128 = config.supply - state.total_committed;
        let withdrawn: u128 = unsold_withdrawn.get_or_use(auction_id, 0u128);
        let new_withdrawn: u128 = withdrawn + amount;
        assert(new_withdrawn <= unsold);
        unsold_withdrawn.set(auction_id, new_withdrawn);

        // Deduct from escrow.
        let escrow: u128 = escrow_sales.get(auction_id);
        assert(amount <= escrow);
        escrow_sales.set(auction_id, escrow - amount);
    }
}
