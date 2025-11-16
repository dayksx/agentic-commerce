import * as z from "zod";
import { tool } from "langchain";
import { createPublicClient, http } from "viem";
import { EIP8004_CONFIG } from "../config/EIP8004Config";

const publicClient = createPublicClient({
    chain: EIP8004_CONFIG.CHAIN,
    transport: http(),
});

const agentIdSchema = z.object({
    agentId: z.string().describe("The ID of the agent to search for"),
});

export type EIP8004SearchFields = z.infer<typeof agentIdSchema>;

export const eip8004Search = tool(
    async (input: unknown) => {
        const { agentId } = agentIdSchema.parse(input);
        const agentIdNum = BigInt(agentId);
        const contractAddress = EIP8004_CONFIG.CONTRACT_ADDRESS as `0x${string}`;

        try {
            // Use Agent0 SDK
            const [tokenURI, owner] = await Promise.all([
                publicClient.readContract({
                    address: contractAddress,
                    abi: EIP8004_CONFIG.ABI,
                    functionName: "tokenURI",
                    args: [agentIdNum],
                }),
                publicClient.readContract({
                    address: contractAddress,
                    abi: EIP8004_CONFIG.ABI,
                    functionName: "ownerOf",
                    args: [agentIdNum],
                }),
            ]);

            return JSON.stringify({
                agentId: agentId,
                owner: owner,
                tokenURI: tokenURI || "(not set)",
            }, null, 2);
        } catch (error: any) {
            return JSON.stringify({
                agentId: agentId,
                error: error.message || "Failed to retrieve agent information",
            }, null, 2);
        }
    },
    {
        name: "eip8004_search",
        description: "Search for an agent with the given ID from the IdentityRegistry contract on Base Sepolia. Returns owner and tokenURI.",
        schema: agentIdSchema as any,
    }
);

