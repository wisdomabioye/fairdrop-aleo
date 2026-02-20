import { AleoNetworkClient } from "@provablehq/sdk";
import { NETWORK_URL } from "@/constants";

let client: AleoNetworkClient | null = null;

export function getNetworkClient(): AleoNetworkClient {
  if (!client) {
    client = new AleoNetworkClient(NETWORK_URL);
    // Prevent browser from serving stale mapping values after on-chain state changes
    client.setHeader("Cache-Control", "no-cache");
    client.setHeader("Pragma", "no-cache");
  }
  return client;
}
