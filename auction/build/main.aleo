import credits.aleo;
import token_registry.aleo;
program fairdrop_v4.aleo;

record Bid:
    owner as address.private;
    auction_id as field.private;
    quantity as u128.private;
    payment_amount as u128.private;

struct TokenOwner:
    account as address;
    token_id as field;

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
    sale_scale as u128;

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
    total_payment_collected as u128;

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

mapping auction_index:
    key as u64.public;
    value as field.public;

mapping creator_auction_count:
    key as address.public;
    value as u64.public;

mapping creator_latest_auction:
    key as address.public;
    value as field.public;

mapping auction_prev_by_creator:
    key as field.public;
    value as field.public;

function create_auction:
    input r0 as token_registry.aleo/Token.record;
    input r1 as field.public;
    input r2 as field.public;
    input r3 as u128.public;
    input r4 as u128.public;
    input r5 as u128.public;
    input r6 as u32.public;
    input r7 as u32.public;
    input r8 as u32.public;
    input r9 as u128.public;
    input r10 as u128.public;
    input r11 as u128.public;
    input r12 as u128.public;
    gt r3 0u128 into r13;
    assert.eq r13 true;
    gte r0.amount r3 into r14;
    assert.eq r14 true;
    assert.eq r0.token_id r1;
    call token_registry.aleo/burn_private r0 r3 into r15 r16;
    async create_auction r16 self.signer r1 r3 r2 r4 r5 r6 r7 r8 r9 r10 r11 r12 into r17;
    output r15 as token_registry.aleo/Token.record;
    output r17 as fairdrop_v4.aleo/create_auction.future;

finalize create_auction:
    input r0 as token_registry.aleo/burn_private.future;
    input r1 as address.public;
    input r2 as field.public;
    input r3 as u128.public;
    input r4 as field.public;
    input r5 as u128.public;
    input r6 as u128.public;
    input r7 as u32.public;
    input r8 as u32.public;
    input r9 as u32.public;
    input r10 as u128.public;
    input r11 as u128.public;
    input r12 as u128.public;
    input r13 as u128.public;
    await r0;
    assert.eq r4 3443843282313283355522573239085696902919850365217539366784739393210722344986field;
    is.neq r2 3443843282313283355522573239085696902919850365217539366784739393210722344986field into r14;
    assert.eq r14 true;
    gte r7 block.height into r15;
    assert.eq r15 true;
    gt r6 0u128 into r16;
    assert.eq r16 true;
    gt r5 r6 into r17;
    assert.eq r17 true;
    gt r8 r7 into r18;
    assert.eq r18 true;
    gt r9 0u32 into r19;
    assert.eq r19 true;
    gt r10 0u128 into r20;
    assert.eq r20 true;
    gt r3 0u128 into r21;
    assert.eq r21 true;
    gt r12 0u128 into r22;
    assert.eq r22 true;
    is.eq r11 0u128 into r23;
    gte r11 r12 into r24;
    or r23 r24 into r25;
    assert.eq r25 true;
    cast fairdrop_v4.aleo r2 into r26 as TokenOwner;
    hash.bhp256 r26 into r27 as field;
    get.or_use token_registry.aleo/roles[r27] 0u8 into r28;
    is.eq r28 3u8 into r29;
    assert.eq r29 true;
    cast 0u64 0u64 0u128 into r30 as Stats;
    get.or_use stats[0field] r30 into r31;
    cast r1 r31.total_auctions into r32 as AuctionKey;
    hash.bhp256 r32 into r33 as field;
    cast r33 r1 r2 r4 r3 r5 r6 r7 r8 r9 r10 r11 r12 r13 into r34 as AuctionConfig;
    set r34 into auction_configs[r33];
    cast 0u128 0u128 false 0u32 false 0u128 0u128 into r35 as AuctionState;
    set r35 into auction_states[r33];
    set r3 into escrow_sales[r33];
    set r33 into auction_index[r31.total_auctions];
    get.or_use creator_auction_count[r1] 0u64 into r36;
    add r36 1u64 into r37;
    set r37 into creator_auction_count[r1];
    get.or_use creator_latest_auction[r1] 0field into r38;
    set r38 into auction_prev_by_creator[r33];
    set r33 into creator_latest_auction[r1];
    add r31.total_auctions 1u64 into r39;
    cast r39 r31.total_bids r31.total_payment_collected into r40 as Stats;
    set r40 into stats[0field];

function place_bid_private:
    input r0 as credits.aleo/credits.record;
    input r1 as field.public;
    input r2 as u128.public;
    input r3 as u64.public;
    gt r2 0u128 into r4;
    assert.eq r4 true;
    gt r3 0u64 into r5;
    assert.eq r5 true;
    call credits.aleo/transfer_private_to_public r0 fairdrop_v4.aleo r3 into r6 r7;
    cast r3 into r8 as u128;
    cast self.signer r1 r2 r8 into r9 as Bid.record;
    cast self.signer r1 into r10 as BidderKey;
    hash.bhp256 r10 into r11 as field;
    cast r3 into r12 as u128;
    async place_bid_private r7 r1 r11 r2 r12 into r13;
    output r6 as credits.aleo/credits.record;
    output r9 as Bid.record;
    output r13 as fairdrop_v4.aleo/place_bid_private.future;

finalize place_bid_private:
    input r0 as credits.aleo/transfer_private_to_public.future;
    input r1 as field.public;
    input r2 as field.public;
    input r3 as u128.public;
    input r4 as u128.public;
    await r0;
    get auction_configs[r1] into r5;
    get auction_states[r1] into r6;
    not r6.supply_met into r7;
    assert.eq r7 true;
    not r6.cleared into r8;
    assert.eq r8 true;
    gte block.height r5.start_block into r9;
    assert.eq r9 true;
    lt block.height r5.end_block into r10;
    assert.eq r10 true;
    sub block.height r5.start_block into r11;
    div r11 r5.price_decay_blocks into r12;
    cast r12 into r13 as u128;
    mul r13 r5.price_decay_amount into r14;
    sub r5.start_price r5.floor_price into r15;
    lt r14 r15 into r16;
    sub r5.start_price r14 into r17;
    ternary r16 r17 r5.floor_price into r18;
    mul r4 r5.sale_scale into r19;
    mul r3 r18 into r20;
    gte r19 r20 into r21;
    assert.eq r21 true;
    gte r3 r5.min_bid_amount into r22;
    assert.eq r22 true;
    add r6.total_committed r3 into r23;
    lte r23 r5.supply into r24;
    assert.eq r24 true;
    get.or_use bid_totals[r2] 0u128 into r25;
    add r25 r3 into r26;
    is.eq r5.max_bid_amount 0u128 into r27;
    lte r26 r5.max_bid_amount into r28;
    or r27 r28 into r29;
    assert.eq r29 true;
    set r26 into bid_totals[r2];
    add r6.total_committed r3 into r30;
    gte r30 r5.supply into r31;
    add r6.total_payments r4 into r32;
    ternary r31 block.height r6.ended_at_block into r33;
    cast r30 r32 r31 r33 false 0u128 0u128 into r34 as AuctionState;
    set r34 into auction_states[r1];
    get.or_use escrow_payments[r1] 0u128 into r35;
    add r35 r4 into r36;
    set r36 into escrow_payments[r1];
    get stats[0field] into r37;
    add r37.total_bids 1u64 into r38;
    add r37.total_payment_collected r4 into r39;
    cast r37.total_auctions r38 r39 into r40 as Stats;
    set r40 into stats[0field];

function place_bid_public:
    input r0 as field.public;
    input r1 as u128.public;
    input r2 as u64.public;
    gt r1 0u128 into r3;
    assert.eq r3 true;
    gt r2 0u64 into r4;
    assert.eq r4 true;
    call credits.aleo/transfer_public_as_signer fairdrop_v4.aleo r2 into r5;
    cast r2 into r6 as u128;
    cast self.signer r0 r1 r6 into r7 as Bid.record;
    cast self.signer r0 into r8 as BidderKey;
    hash.bhp256 r8 into r9 as field;
    cast r2 into r10 as u128;
    async place_bid_public r5 r0 r9 r1 r10 into r11;
    output r7 as Bid.record;
    output r11 as fairdrop_v4.aleo/place_bid_public.future;

finalize place_bid_public:
    input r0 as credits.aleo/transfer_public_as_signer.future;
    input r1 as field.public;
    input r2 as field.public;
    input r3 as u128.public;
    input r4 as u128.public;
    await r0;
    get auction_configs[r1] into r5;
    get auction_states[r1] into r6;
    not r6.supply_met into r7;
    assert.eq r7 true;
    not r6.cleared into r8;
    assert.eq r8 true;
    gte block.height r5.start_block into r9;
    assert.eq r9 true;
    lt block.height r5.end_block into r10;
    assert.eq r10 true;
    sub block.height r5.start_block into r11;
    div r11 r5.price_decay_blocks into r12;
    cast r12 into r13 as u128;
    mul r13 r5.price_decay_amount into r14;
    sub r5.start_price r5.floor_price into r15;
    lt r14 r15 into r16;
    sub r5.start_price r14 into r17;
    ternary r16 r17 r5.floor_price into r18;
    mul r4 r5.sale_scale into r19;
    mul r3 r18 into r20;
    gte r19 r20 into r21;
    assert.eq r21 true;
    gte r3 r5.min_bid_amount into r22;
    assert.eq r22 true;
    add r6.total_committed r3 into r23;
    lte r23 r5.supply into r24;
    assert.eq r24 true;
    get.or_use bid_totals[r2] 0u128 into r25;
    add r25 r3 into r26;
    is.eq r5.max_bid_amount 0u128 into r27;
    lte r26 r5.max_bid_amount into r28;
    or r27 r28 into r29;
    assert.eq r29 true;
    set r26 into bid_totals[r2];
    add r6.total_committed r3 into r30;
    gte r30 r5.supply into r31;
    add r6.total_payments r4 into r32;
    ternary r31 block.height r6.ended_at_block into r33;
    cast r30 r32 r31 r33 false 0u128 0u128 into r34 as AuctionState;
    set r34 into auction_states[r1];
    get.or_use escrow_payments[r1] 0u128 into r35;
    add r35 r4 into r36;
    set r36 into escrow_payments[r1];
    get stats[0field] into r37;
    add r37.total_bids 1u64 into r38;
    add r37.total_payment_collected r4 into r39;
    cast r37.total_auctions r38 r39 into r40 as Stats;
    set r40 into stats[0field];

function close_auction:
    input r0 as field.public;
    async close_auction r0 into r1;
    output r1 as fairdrop_v4.aleo/close_auction.future;

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
    div r14 r1.sale_scale into r15;
    cast r2.total_committed r2.total_payments r2.supply_met r2.ended_at_block true r13 r15 into r16 as AuctionState;
    set r16 into auction_states[r0];
    branch.eq true true to end_otherwise_0_1;
    position end_then_0_0;
    mul r2.total_committed r1.floor_price into r17;
    div r17 r1.sale_scale into r18;
    cast r2.total_committed r2.total_payments r2.supply_met r2.ended_at_block true r1.floor_price r18 into r19 as AuctionState;
    set r19 into auction_states[r0];
    position end_otherwise_0_1;

function claim:
    input r0 as Bid.record;
    input r1 as u128.public;
    input r2 as field.public;
    input r3 as u128.public;
    mul r0.quantity r1 into r4;
    div r4 r3 into r5;
    sub r0.payment_amount r5 into r6;
    cast r6 into r7 as u64;
    call token_registry.aleo/mint_private r2 r0.owner r0.quantity false 4294967295u32 into r8 r9;
    call credits.aleo/transfer_public_to_private r0.owner r7 into r10 r11;
    cast r7 into r12 as u128;
    async claim r9 r11 r0.auction_id r1 r2 r3 r0.quantity r12 into r13;
    output r8 as token_registry.aleo/Token.record;
    output r10 as credits.aleo/credits.record;
    output r13 as fairdrop_v4.aleo/claim.future;

finalize claim:
    input r0 as token_registry.aleo/mint_private.future;
    input r1 as credits.aleo/transfer_public_to_private.future;
    input r2 as field.public;
    input r3 as u128.public;
    input r4 as field.public;
    input r5 as u128.public;
    input r6 as u128.public;
    input r7 as u128.public;
    await r0;
    await r1;
    get auction_configs[r2] into r8;
    get auction_states[r2] into r9;
    assert.eq r9.cleared true;
    assert.eq r3 r9.clearing_price;
    assert.eq r4 r8.sale_token_id;
    assert.eq r5 r8.sale_scale;
    get escrow_sales[r2] into r10;
    lte r6 r10 into r11;
    assert.eq r11 true;
    sub r10 r6 into r12;
    set r12 into escrow_sales[r2];
    get escrow_payments[r2] into r13;
    lte r7 r13 into r14;
    assert.eq r14 true;
    sub r13 r7 into r15;
    set r15 into escrow_payments[r2];

function withdraw_payments:
    input r0 as field.public;
    input r1 as u128.public;
    gt r1 0u128 into r2;
    assert.eq r2 true;
    cast r1 into r3 as u64;
    call credits.aleo/transfer_public self.signer r3 into r4;
    async withdraw_payments r4 r0 self.signer r1 into r5;
    output r5 as fairdrop_v4.aleo/withdraw_payments.future;

finalize withdraw_payments:
    input r0 as credits.aleo/transfer_public.future;
    input r1 as field.public;
    input r2 as address.public;
    input r3 as u128.public;
    await r0;
    get auction_configs[r1] into r4;
    get auction_states[r1] into r5;
    assert.eq r5.cleared true;
    assert.eq r2 r4.creator;
    get.or_use creator_withdrawn[r1] 0u128 into r6;
    add r6 r3 into r7;
    lte r7 r5.creator_revenue into r8;
    assert.eq r8 true;
    set r7 into creator_withdrawn[r1];
    get escrow_payments[r1] into r9;
    lte r3 r9 into r10;
    assert.eq r10 true;
    sub r9 r3 into r11;
    set r11 into escrow_payments[r1];

function withdraw_unsold:
    input r0 as field.public;
    input r1 as u128.public;
    input r2 as field.public;
    gt r1 0u128 into r3;
    assert.eq r3 true;
    call token_registry.aleo/mint_private r2 self.signer r1 false 4294967295u32 into r4 r5;
    async withdraw_unsold r5 r0 self.signer r1 r2 into r6;
    output r4 as token_registry.aleo/Token.record;
    output r6 as fairdrop_v4.aleo/withdraw_unsold.future;

finalize withdraw_unsold:
    input r0 as token_registry.aleo/mint_private.future;
    input r1 as field.public;
    input r2 as address.public;
    input r3 as u128.public;
    input r4 as field.public;
    await r0;
    get auction_configs[r1] into r5;
    get auction_states[r1] into r6;
    assert.eq r6.cleared true;
    assert.eq r2 r5.creator;
    assert.eq r4 r5.sale_token_id;
    sub r5.supply r6.total_committed into r7;
    get.or_use unsold_withdrawn[r1] 0u128 into r8;
    add r8 r3 into r9;
    lte r9 r7 into r10;
    assert.eq r10 true;
    set r9 into unsold_withdrawn[r1];
    get escrow_sales[r1] into r11;
    lte r3 r11 into r12;
    assert.eq r12 true;
    sub r11 r3 into r13;
    set r13 into escrow_sales[r1];

constructor:
    assert.eq program_owner aleo128wz89c78ur4mx378056yd9q7kqmphr07k0kfsmnwvqnv7g9syyqkg263r;
