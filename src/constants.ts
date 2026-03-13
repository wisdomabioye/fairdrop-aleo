
export type ProgramFunction =
  // fairdrop_v4.aleo
  | "create_auction" | "place_bid_private" | "place_bid_public" | "claim"
  | "close_auction" | "withdraw_payments" | "withdraw_unsold"
  // token_registry.aleo
  | "register_token" | "mint_private" | "burn_private" | "set_role" | "remove_role";

/** Human-readable labels for Aleo program function names */
export const TX_LABELS: Record<ProgramFunction, string> = {
  create_auction:    "Create Auction",
  place_bid_private: "Place Bid (Private)",
  place_bid_public:  "Place Bid (Public)",
  claim:             "Claim Tokens",
  close_auction:     "Close Auction",
  withdraw_payments: "Withdraw Payments",
  withdraw_unsold:   "Withdraw Unsold",
  register_token:    "Register Token",
  mint_private:      "Mint Tokens",
  burn_private:      "Burn Tokens",
  set_role:          "Set Role",
  remove_role:       "Remove Role",
};

export interface TestToken {
  name: string;
  symbol: string;
  tokenId: string;
}

// Auction (sale) tokens — deposited by the creator
export const TestAuctionTokens: TestToken[] = [
  { name: "Alpha Token",   symbol: "ALPHA", tokenId: "1field" },
  { name: "Beta Token",    symbol: "BETA",  tokenId: "2field" },
  { name: "Gamma Token",   symbol: "GAMMA", tokenId: "3field" },
];

// Payment tokens — used by bidders to pay
export const TestPaymentTokens: TestToken[] = [
  { name: "USD Coin",      symbol: "USDC",  tokenId: "4field" },
  { name: "Test Bitcoin",  symbol: "tBTC",  tokenId: "5field" },
  { name: "Test Ether",    symbol: "tETH",  tokenId: "6field" },
];

// All test tokens combined
export const TestTokens: TestToken[] = [...TestAuctionTokens, ...TestPaymentTokens];

/** Returns "Name (SYMBOL)" for known tokens, falls back to the raw tokenId */
export function getTokenLabel(tokenId: string): string {
  const match = TestTokens.find((t) => t.tokenId === tokenId);
  return match ? `${match.name} (${match.symbol})` : tokenId;
}

/** Returns just the symbol for known tokens, falls back to the raw tokenId */
export function getTokenSymbol(tokenId: string): string {
  return TestTokens.find((t) => t.tokenId === tokenId)?.symbol ?? tokenId;
}
