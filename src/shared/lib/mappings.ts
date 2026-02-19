import { PROGRAM_ID } from "../../constants";
import { getNetworkClient } from "./networkClient";

export async function getMappingValue(
  mapping: string,
  key: string,
): Promise<string | null> {
  try {
    const client = getNetworkClient();
    const value = await client.getProgramMappingValue(
      PROGRAM_ID,
      mapping,
      key,
    );
    return value ? String(value) : null;
  } catch {
    return null;
  }
}

export async function getAuctionConfig(auctionId: string): Promise<string | null> {
  return getMappingValue("auction_configs", auctionId);
}

export async function getAuctionState(auctionId: string): Promise<string | null> {
  return getMappingValue("auction_states", auctionId);
}

export async function getStats(): Promise<string | null> {
  return getMappingValue("stats", "0field");
}

/** Fetch the auction_id at position `index` in the global sequential index. */
export async function getAuctionIndex(index: number): Promise<string | null> {
  return getMappingValue("auction_index", `${index}u64`);
}

export async function getEscrowSales(auctionId: string): Promise<string | null> {
  return getMappingValue("escrow_sales", auctionId);
}

export async function getEscrowPayments(auctionId: string): Promise<string | null> {
  return getMappingValue("escrow_payments", auctionId);
}

export async function getCreatorWithdrawn(auctionId: string): Promise<string | null> {
  return getMappingValue("creator_withdrawn", auctionId);
}

export async function getUnsoldWithdrawn(auctionId: string): Promise<string | null> {
  return getMappingValue("unsold_withdrawn", auctionId);
}
