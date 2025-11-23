import * as z from "zod";
import { tool } from "langchain";
import { createPublicClient, http } from "viem";
import { baseSepolia, sepolia, mainnet } from "viem/chains";

const baseSepoliaClient = createPublicClient({
    chain: baseSepolia,
    transport: http(),
});

const sepoliaClient = createPublicClient({
    chain: sepolia,
    transport: http(),
});

const mainnetClient = createPublicClient({
    chain: mainnet,
    transport: http(),
});

const emptySchema = z.object({});

export type MultichainToolFields = z.infer<typeof emptySchema>;

const formatBlock = (block: any) => ({
    number: block.number.toString(),
    hash: block.hash,
    timestamp: block.timestamp.toString(),
    transactions: block.transactions.length,
    gasUsed: block.gasUsed.toString(),
    gasLimit: block.gasLimit.toString(),
    baseFeePerGas: block.baseFeePerGas ? block.baseFeePerGas.toString() : null,
});

export const multichainTool = tool(
    async (input: unknown) => {
        emptySchema.parse(input);

        try {
            const [baseSepoliaBlock, sepoliaBlock, mainnetBlock] = await Promise.allSettled([
                baseSepoliaClient.getBlock({ blockTag: 'latest' }),
                sepoliaClient.getBlock({ blockTag: 'latest' }),
                mainnetClient.getBlock({ blockTag: 'latest' }),
            ]);

            const result: any = {};

            if (baseSepoliaBlock.status === 'fulfilled') {
                result.baseSepolia = formatBlock(baseSepoliaBlock.value);
            } else {
                result.baseSepolia = { error: baseSepoliaBlock.reason?.message || "Failed to retrieve block" };
            }

            if (sepoliaBlock.status === 'fulfilled') {
                result.sepolia = formatBlock(sepoliaBlock.value);
            } else {
                result.sepolia = { error: sepoliaBlock.reason?.message || "Failed to retrieve block" };
            }

            if (mainnetBlock.status === 'fulfilled') {
                result.mainnet = formatBlock(mainnetBlock.value);
            } else {
                result.mainnet = { error: mainnetBlock.reason?.message || "Failed to retrieve block" };
            }

            return JSON.stringify(result, null, 2);
        } catch (error: any) {
            return JSON.stringify({
                error: error.message || "Failed to retrieve blocks",
            }, null, 2);
        }
    },
    {
        name: "multichain_tool",
        description: "Retrieves the last block from Base Sepolia, Sepolia, and Mainnet networks. Returns block number, hash, timestamp, transaction count, and gas information for each chain.",
        schema: emptySchema as any,
    }
);

