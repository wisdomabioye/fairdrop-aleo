import { AleoNetworkClient } from "@provablehq/sdk";
import { NETWORK_URL } from "../../constants";

let client: AleoNetworkClient | null = null;

export function getNetworkClient(): AleoNetworkClient {
  if (!client) {
    client = new AleoNetworkClient(NETWORK_URL);
  }
  return client;
}
