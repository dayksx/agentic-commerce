import * as z from "zod";
import { tool } from "langchain";
import { CdpClient } from "@coinbase/cdp-sdk";
import { parseUnits, formatUnits } from "viem";
import dotenv from "dotenv";

dotenv.config();

// USDC token address on Base mainnet
const USDC_ADDRESS_BASE_MAINNET = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";
// WETH address (same on both networks)
const WETH_ADDRESS = "0x4200000000000000000000000000000000000006";

const schema = z.object({
  percentage: z.number().optional().describe("Percentage of USDC to convert to ETH (default: 25)"),
});

/**
 * Gets the CDP payment account (same logic as MCPServer)
 */
async function getPaymentAccount() {
  const accountName = process.env.CDP_PAYMENT_ACCOUNT_NAME;
  const accountAddress = process.env.CDP_PAYMENT_ACCOUNT_ADDRESS;
  
  const cdp = new CdpClient();
  
  if (accountName) {
    return await cdp.evm.getOrCreateAccount({ name: accountName });
  } else if (accountAddress) {
    try {
      return await cdp.evm.getAccount({ address: accountAddress as `0x${string}` });
    } catch (error) {
      // If account doesn't exist, create a new one with default name
      return await cdp.evm.getOrCreateAccount({ name: "mcp-payment-receiver" });
    }
  } else {
    return await cdp.evm.getOrCreateAccount({ name: "mcp-payment-receiver" });
  }
}

export const yieldGenerationTool = tool(
  async (input: unknown) => {
    const { percentage = 25 } = schema.parse(input);
    
    try {
      // Get the payment account
      const account = await getPaymentAccount();
      console.log(`💰 Yield Generation: Using account ${account.address}`);
      
      // Trade API fully supports Base mainnet, so operate entirely on Base
      const cdp = new CdpClient();
      const balancesMainnet = await cdp.evm.listTokenBalances({
        address: account.address,
        network: "base",
      });
      
      // Find USDC balance on Base Mainnet (where payments arrive and swaps happen)
      const usdcBalance = balancesMainnet.balances.find(
        (b) => b.token.contractAddress.toLowerCase() === USDC_ADDRESS_BASE_MAINNET.toLowerCase()
      );
      
      if (!usdcBalance) {
        return JSON.stringify({
          success: false,
          message: "No USDC balance found on Base mainnet (required for swapping)",
          account: account.address,
          note: "Send USDC to this account on Base to enable yield generation.",
        });
      }
      
      const totalUSDC = BigInt(usdcBalance.amount.amount);
      const usdcAmount = (totalUSDC * BigInt(Math.floor(percentage * 100))) / BigInt(10000); // percentage * 100 for precision
      
      if (usdcAmount === 0n) {
        return JSON.stringify({
          success: false,
          message: `USDC balance too small to swap ${percentage}%`,
          totalUSDC: formatUnits(totalUSDC, 6),
          account: account.address,
        });
      }
      
      console.log(`💰 Yield Generation: Attempting to swap ${formatUnits(usdcAmount, 6)} USDC (${percentage}% of ${formatUnits(totalUSDC, 6)} USDC) to ETH on Base`);
      
      // CDP Trade API supports Base mainnet, so execute the swap directly
      try {
        // Use account.swap() with correct API signature
        const swapResult = await account.swap({
          network: "base",
          fromToken: USDC_ADDRESS_BASE_MAINNET, // USDC on Base mainnet
          toToken: WETH_ADDRESS, // WETH on Base mainnet
          fromAmount: usdcAmount,
          slippageBps: 100, // 1% slippage tolerance
        });
        
        console.log(`>>> Debug Swap result - transactionHash: ${swapResult.transactionHash}`);
        return JSON.stringify({
          success: true,
          message: `Successfully swapped ${formatUnits(usdcAmount, 6)} USDC to WETH`,
          transactionHash: swapResult.transactionHash,
          usdcSwapped: formatUnits(usdcAmount, 6),
          percentage,
          account: account.address,
        });
      } catch (swapError) {
        const errorMessage = swapError instanceof Error ? swapError.message : "Unknown error";
        console.warn(`Swap failed on Base: ${errorMessage}`);
        
        return JSON.stringify({
          success: false,
          message: "Swap attempted on Base but failed",
          calculated: {
            usdcToSwap: formatUnits(usdcAmount, 6),
            percentage,
            totalUSDC: formatUnits(totalUSDC, 6),
          },
          account: account.address,
          error: errorMessage,
          note: "Ensure the account has sufficient Base gas and permissions, then retry.",
        });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      console.error("Yield generation error:", errorMessage);
      return JSON.stringify({
        success: false,
        error: errorMessage,
      });
    }
  },
  {
    name: "generate_yield",
    description: `Converts a percentage (default 25%) of received USDC payments to ETH using the CDP smart wallet on Base mainnet. Checks the account's Base USDC balance and swaps the specified percentage to ETH.`,
    schema: schema as any,
  }
);

