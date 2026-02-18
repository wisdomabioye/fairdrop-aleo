program fairdrop.aleo;

record Token:
    owner as address.private;
    token_id as field.private;
    amount as u128.private;

record Bid:
    owner as address.private;
    auction_id as field.private;
    quantity as u128.private;
    payment_amount as u128.private;

struct AuctionConfig:
    auction_id as field;
    creator as address;
    sale_token_id as field;
    payment_token_id as field;
    supply as u128;
    start_price as u128;
    floor_price as u128;
    start_block as u32;
    end_block as u32;
    price_decay_blocks as u32;
    price_decay_amount as u128;
    max_bid_amount as u128;
    min_bid_amount as u128;

struct AuctionState:
    total_committed as u128;
    total_payments as u128;
    supply_met as boolean;
    ended_at_block as u32;
    cleared as boolean;
    clearing_price as u128;
    creator_revenue as u128;

struct BidderKey:
    bidder as address;
    auction_id as field;

struct AuctionKey:
    creator as address;
    nonce as u64;

struct Stats:
    total_auctions as u64;
    total_bids as u64;

mapping auction_configs:
    key as field.public;
    value as AuctionConfig.public;

mapping auction_states:
    key as field.public;
    value as AuctionState.public;

mapping bid_totals:
    key as field.public;
    value as u128.public;

mapping escrow_sales:
    key as field.public;
    value as u128.public;

mapping escrow_payments:
    key as field.public;
    value as u128.public;

mapping creator_withdrawn:
    key as field.public;
    value as u128.public;

mapping unsold_withdrawn:
    key as field.public;
    value as u128.public;

mapping stats:
    key as field.public;
    value as Stats.public;

function create_token:
    input r0 as address.private;
    input r1 as field.private;
    input r2 as u128.private;
    gt r2 0u128 into r3;
    assert.eq r3 true;
    cast r0 r1 r2 into r4 as Token.record;
    output r4 as Token.record;

function join_tokens:
    input r0 as Token.record;
    input r1 as Token.record;
    assert.eq r0.token_id r1.token_id;
    add r0.amount r1.amount into r2;
    cast r0.owner r0.token_id r2 into r3 as Token.record;
    output r3 as Token.record;

function split_token:
    input r0 as Token.record;
    input r1 as u128.private;
    gt r1 0u128 into r2;
    assert.eq r2 true;
    sub r0.amount r1 into r3;
    gt r3 0u128 into r4;
    assert.eq r4 true;
    cast r0.owner r0.token_id r1 into r5 as Token.record;
    cast r0.owner r0.token_id r3 into r6 as Token.record;
    output r5 as Token.record;
    output r6 as Token.record;

function create_auction:
    input r0 as Token.record;
    input r1 as field.public;
    input r2 as u128.public;
    input r3 as u128.public;
    input r4 as u32.public;
    input r5 as u32.public;
    input r6 as u32.public;
    input r7 as u128.public;
    input r8 as u128.public;
    input r9 as u128.public;
    gt r0.amount 0u128 into r10;
    assert.eq r10 true;
    async create_auction self.signer r0.token_id r0.amount r1 r2 r3 r4 r5 r6 r7 r8 r9 into r11;
    output r11 as fairdrop.aleo/create_auction.future;

finalize create_auction:
    input r0 as address.public;
    input r1 as field.public;
    input r2 as u128.public;
    input r3 as field.public;
    input r4 as u128.public;
    input r5 as u128.public;
    input r6 as u32.public;
    input r7 as u32.public;
    input r8 as u32.public;
    input r9 as u128.public;
    input r10 as u128.public;
    input r11 as u128.public;
    is.neq r3 r1 into r12;
    assert.eq r12 true;
    gte r6 block.height into r13;
    assert.eq r13 true;
    gt r5 0u128 into r14;
    assert.eq r14 true;
    gt r4 r5 into r15;
    assert.eq r15 true;
    gt r7 r6 into r16;
    assert.eq r16 true;
    gt r8 0u32 into r17;
    assert.eq r17 true;
    gt r9 0u128 into r18;
    assert.eq r18 true;
    gt r2 0u128 into r19;
    assert.eq r19 true;
    gt r11 0u128 into r20;
    assert.eq r20 true;
    is.eq r10 0u128 into r21;
    gte r10 r11 into r22;
    or r21 r22 into r23;
    assert.eq r23 true;
    cast 0u64 0u64 into r24 as Stats;
    get.or_use stats[0field] r24 into r25;
    cast r0 r25.total_auctions into r26 as AuctionKey;
    hash.bhp256 r26 into r27 as field;
    cast r27 r0 r1 r3 r2 r4 r5 r6 r7 r8 r9 r10 r11 into r28 as AuctionConfig;
    set r28 into auction_configs[r27];
    cast 0u128 0u128 false 0u32 false 0u128 0u128 into r29 as AuctionState;
    set r29 into auction_states[r27];
    set r2 into escrow_sales[r27];
    add r25.total_auctions 1u64 into r30;
    cast r30 r25.total_bids into r31 as Stats;
    set r31 into stats[0field];

function place_bid:
    input r0 as Token.record;
    input r1 as field.public;
    input r2 as u128.public;
    gt r2 0u128 into r3;
    assert.eq r3 true;
    cast self.signer r1 r2 r0.amount into r4 as Bid.record;
    cast self.signer r1 into r5 as BidderKey;
    hash.bhp256 r5 into r6 as field;
    async place_bid r1 r6 r2 r0.token_id r0.amount into r7;
    output r4 as Bid.record;
    output r7 as fairdrop.aleo/place_bid.future;

finalize place_bid:
    input r0 as field.public;
    input r1 as field.public;
    input r2 as u128.public;
    input r3 as field.public;
    input r4 as u128.public;
    get auction_configs[r0] into r5;
    get auction_states[r0] into r6;
    not r6.supply_met into r7;
    assert.eq r7 true;
    not r6.cleared into r8;
    assert.eq r8 true;
    gte block.height r5.start_block into r9;
    assert.eq r9 true;
    lt block.height r5.end_block into r10;
    assert.eq r10 true;
    assert.eq r3 r5.payment_token_id;
    sub block.height r5.start_block into r11;
    div r11 r5.price_decay_blocks into r12;
    cast r12 into r13 as u128;
    mul r13 r5.price_decay_amount into r14;
    sub r5.start_price r5.floor_price into r15;
    lt r14 r15 into r16;
    sub r5.start_price r14 into r17;
    ternary r16 r17 r5.floor_price into r18;
    mul r2 r18 into r19;
    gte r4 r19 into r20;
    assert.eq r20 true;
    gte r2 r5.min_bid_amount into r21;
    assert.eq r21 true;
    add r6.total_committed r2 into r22;
    lte r22 r5.supply into r23;
    assert.eq r23 true;
    get.or_use bid_totals[r1] 0u128 into r24;
    add r24 r2 into r25;
    is.eq r5.max_bid_amount 0u128 into r26;
    lte r25 r5.max_bid_amount into r27;
    or r26 r27 into r28;
    assert.eq r28 true;
    set r25 into bid_totals[r1];
    add r6.total_committed r2 into r29;
    gte r29 r5.supply into r30;
    add r6.total_payments r4 into r31;
    ternary r30 block.height r6.ended_at_block into r32;
    cast r29 r31 r30 r32 false 0u128 0u128 into r33 as AuctionState;
    set r33 into auction_states[r0];
    get.or_use escrow_payments[r0] 0u128 into r34;
    add r34 r4 into r35;
    set r35 into escrow_payments[r0];
    get stats[0field] into r36;
    add r36.total_bids 1u64 into r37;
    cast r36.total_auctions r37 into r38 as Stats;
    set r38 into stats[0field];

function close_auction:
    input r0 as field.public;
    async close_auction r0 into r1;
    output r1 as fairdrop.aleo/close_auction.future;

finalize close_auction:
    input r0 as field.public;
    get auction_configs[r0] into r1;
    get auction_states[r0] into r2;
    not r2.cleared into r3;
    assert.eq r3 true;
    gte block.height r1.end_block into r4;
    or r2.supply_met r4 into r5;
    assert.eq r5 true;
    branch.eq r2.supply_met false to end_then_0_0;
    sub r2.ended_at_block r1.start_block into r6;
    div r6 r1.price_decay_blocks into r7;
    cast r7 into r8 as u128;
    mul r8 r1.price_decay_amount into r9;
    sub r1.start_price r1.floor_price into r10;
    lt r9 r10 into r11;
    sub r1.start_price r9 into r12;
    ternary r11 r12 r1.floor_price into r13;
    mul r2.total_committed r13 into r14;
    cast r2.total_committed r2.total_payments r2.supply_met r2.ended_at_block true r13 r14 into r15 as AuctionState;
    set r15 into auction_states[r0];
    branch.eq true true to end_otherwise_0_1;
    position end_then_0_0;
    mul r2.total_committed r1.floor_price into r16;
    cast r2.total_committed r2.total_payments r2.supply_met r2.ended_at_block true r1.floor_price r16 into r17 as AuctionState;
    set r17 into auction_states[r0];
    position end_otherwise_0_1;

function claim:
    input r0 as Bid.record;
    input r1 as u128.public;
    input r2 as field.public;
    input r3 as field.public;
    mul r0.quantity r1 into r4;
    sub r0.payment_amount r4 into r5;
    cast r0.owner r2 r0.quantity into r6 as Token.record;
    cast r0.owner r3 r5 into r7 as Token.record;
    async claim r0.auction_id r1 r2 r3 r0.quantity r5 into r8;
    output r6 as Token.record;
    output r7 as Token.record;
    output r8 as fairdrop.aleo/claim.future;

finalize claim:
    input r0 as field.public;
    input r1 as u128.public;
    input r2 as field.public;
    input r3 as field.public;
    input r4 as u128.public;
    input r5 as u128.public;
    get auction_configs[r0] into r6;
    get auction_states[r0] into r7;
    assert.eq r7.cleared true;
    assert.eq r1 r7.clearing_price;
    assert.eq r2 r6.sale_token_id;
    assert.eq r3 r6.payment_token_id;
    get escrow_sales[r0] into r8;
    lte r4 r8 into r9;
    assert.eq r9 true;
    sub r8 r4 into r10;
    set r10 into escrow_sales[r0];
    get escrow_payments[r0] into r11;
    lte r5 r11 into r12;
    assert.eq r12 true;
    sub r11 r5 into r13;
    set r13 into escrow_payments[r0];

function withdraw_payments:
    input r0 as field.public;
    input r1 as u128.public;
    input r2 as field.public;
    gt r1 0u128 into r3;
    assert.eq r3 true;
    cast self.signer r2 r1 into r4 as Token.record;
    async withdraw_payments r0 self.signer r1 r2 into r5;
    output r4 as Token.record;
    output r5 as fairdrop.aleo/withdraw_payments.future;

finalize withdraw_payments:
    input r0 as field.public;
    input r1 as address.public;
    input r2 as u128.public;
    input r3 as field.public;
    get auction_configs[r0] into r4;
    get auction_states[r0] into r5;
    assert.eq r5.cleared true;
    assert.eq r1 r4.creator;
    assert.eq r3 r4.payment_token_id;
    get.or_use creator_withdrawn[r0] 0u128 into r6;
    add r6 r2 into r7;
    lte r7 r5.creator_revenue into r8;
    assert.eq r8 true;
    set r7 into creator_withdrawn[r0];
    get escrow_payments[r0] into r9;
    lte r2 r9 into r10;
    assert.eq r10 true;
    sub r9 r2 into r11;
    set r11 into escrow_payments[r0];

function withdraw_unsold:
    input r0 as field.public;
    input r1 as u128.public;
    input r2 as field.public;
    gt r1 0u128 into r3;
    assert.eq r3 true;
    cast self.signer r2 r1 into r4 as Token.record;
    async withdraw_unsold r0 self.signer r1 r2 into r5;
    output r4 as Token.record;
    output r5 as fairdrop.aleo/withdraw_unsold.future;

finalize withdraw_unsold:
    input r0 as field.public;
    input r1 as address.public;
    input r2 as u128.public;
    input r3 as field.public;
    get auction_configs[r0] into r4;
    get auction_states[r0] into r5;
    assert.eq r5.cleared true;
    assert.eq r1 r4.creator;
    assert.eq r3 r4.sale_token_id;
    sub r4.supply r5.total_committed into r6;
    get.or_use unsold_withdrawn[r0] 0u128 into r7;
    add r7 r2 into r8;
    lte r8 r6 into r9;
    assert.eq r9 true;
    set r8 into unsold_withdrawn[r0];
    get escrow_sales[r0] into r10;
    lte r2 r10 into r11;
    assert.eq r11 true;
    sub r10 r2 into r12;
    set r12 into escrow_sales[r0];

constructor:
    assert.eq program_owner aleo128wz89c78ur4mx378056yd9q7kqmphr07k0kfsmnwvqnv7g9syyqkg263r;
