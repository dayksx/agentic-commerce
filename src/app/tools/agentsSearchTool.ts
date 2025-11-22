import * as z from "zod";
import { tool } from "langchain";
import { createPublicClient, http, parseAbiItem } from "viem";
import { baseSepolia } from "viem/chains";

const IDENTITY_REGISTRY_ADDRESS = "0x8004AA63c570c570eBF15376c0dB199918BFe9Fb" as `0x${string}`;

// Contract ABI for IdentityRegistry
const IDENTITY_REGISTRY_ABI = [
  {
    type: "function",
    name: "tokenURI",
    inputs: [{ name: "tokenId", type: "uint256", internalType: "uint256" }],
    outputs: [{ name: "", type: "string", internalType: "string" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "ownerOf",
    inputs: [{ name: "tokenId", type: "uint256", internalType: "uint256" }],
    outputs: [{ name: "", type: "address", internalType: "address" }],
    stateMutability: "view",
  },
] as const;

const agentSearchSchema = z.object({});

// Create public client for Base Sepolia
const publicClient = createPublicClient({
  chain: baseSepolia,
  transport: http(),
});

export const agentSearchTool = tool(
  async (input: unknown) => {
    agentSearchSchema.parse(input);

    try {
      console.log("🔎 Fetching first 30 agents from EIP-8004 registry...");

      // Query Registered events to get agent IDs
      const registeredEvent = parseAbiItem(
        "event Registered(uint256 indexed agentId, string tokenURI, address indexed owner)"
      );

      // Query from a recent block range to avoid RPC limits
      const currentBlock = await publicClient.getBlockNumber();
      const fromBlock = currentBlock > 50000n ? currentBlock - 50000n : 0n;
      
      const registeredEvents = await publicClient.getLogs({
        address: IDENTITY_REGISTRY_ADDRESS,
        event: registeredEvent,
        fromBlock: fromBlock,
        toBlock: currentBlock,
      });

      console.log(`🔎 Found ${registeredEvents.length} registered agents`);

      // Limit to first 30 agents
      const MAX_AGENTS = 30;
      const limitedEvents = registeredEvents.slice(0, MAX_AGENTS);

      const results: any[] = [];

      // Process each agent
      for (const event of limitedEvents) {
        const agentId = event.args.agentId;
        if (!agentId) continue;

        try {
          // Get current tokenURI
          const tokenURI = await publicClient.readContract({
            address: IDENTITY_REGISTRY_ADDRESS,
            abi: IDENTITY_REGISTRY_ABI,
            functionName: "tokenURI",
            args: [agentId],
          });

          // Get owner
          const owner = await publicClient.readContract({
            address: IDENTITY_REGISTRY_ADDRESS,
            abi: IDENTITY_REGISTRY_ABI,
            functionName: "ownerOf",
            args: [agentId],
          });

          results.push({
            agentId: agentId.toString(),
            tokenURI: tokenURI as string,
            owner: owner as string,
          });
        } catch (error) {
          // Skip agents that can't be read
          console.warn(`⚠️ Error processing agent ${agentId}:`, error);
          continue;
        }
      }

      console.log(`🔎 Retrieved ${results.length} agents`);

      return JSON.stringify({
        success: true,
        results: {
          items: results,
          total: results.length,
        },
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      console.error("Agent search tool error:", errorMessage);
      return JSON.stringify({
        success: false,
        error: errorMessage,
      });
    }
  },
  {
    name: "agents_search_tool",
    description:
      "Fetches the first 30 agents from the EIP-8004 Identity Registry on Base Sepolia (chainId: 84532). Returns agentId, tokenURI, and owner for each agent.",
    schema: agentSearchSchema as any,
  }
);