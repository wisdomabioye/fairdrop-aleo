export const PROGRAM_ID = "fairdrop.aleo";
export const NETWORK_URL = "https://api.explorer.provable.com/v1";
export const NETWORK = "testnetbeta";
export const FEE = 100_000; // default fee in microcredits
export const EXPLORER_TX_URL = "https://explorer.provable.com/transaction";

/** Human-readable labels for Aleo program function names */
export const TX_LABELS: Record<string, string> = {
  create_token:    "Mint Tokens",
  create_auction:  "Create Auction",
  place_bid:       "Place Bid",
  claim:           "Claim Tokens",
  close_auction:   "Close Auction",
  clear_auction:   "Clear Auction",
  join_tokens:     "Join Records",
  split_token:     "Split Record",
  mint_public:     "Mint Tokens",
  transfer_public: "Transfer Tokens",
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
