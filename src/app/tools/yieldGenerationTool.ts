import * as z from "zod";
import { tool } from "langchain";
import { CdpClient } from "@coinbase/cdp-sdk";
import { parseUnits, formatUnits } from "viem";
import dotenv from "dotenv";

dotenv.config();

// USDC token addresses
const USDC_ADDRESS_BASE_SEPOLIA = "0x036CbD53842c5426634e7929541eC2318f3dCF7e"; // Base Sepolia
const USDC_ADDRESS_BASE_MAINNET = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913"; // Base Mainnet
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
      
      // IMPORTANT: Payments are received on Base Sepolia, but Trade API only supports Base Mainnet
      // We check balance on Base Sepolia (where payments arrive)
      // But we can only swap on Base Mainnet (where Trade API works)
      // This means the account needs USDC on Base Mainnet to swap
      
      // Check balance on Base Sepolia (where x402 payments arrive)
      const cdp = new CdpClient();
      const balancesSepolia = await cdp.evm.listTokenBalances({
        address: account.address,
        network: "base-sepolia",
      });
      
      // Also check Base Mainnet balance (where swaps can happen)
      const balancesMainnet = await cdp.evm.listTokenBalances({
        address: account.address,
        network: "base",
      });
      
      // Find USDC balance on Base Sepolia (where payments arrive)
      const usdcBalanceSepolia = balancesSepolia.balances.find(
        (b) => b.token.contractAddress.toLowerCase() === USDC_ADDRESS_BASE_SEPOLIA.toLowerCase()
      );
      
      // Find USDC balance on Base Mainnet (where swaps can happen)
      const usdcBalanceMainnet = balancesMainnet.balances.find(
        (b) => b.token.contractAddress.toLowerCase() === USDC_ADDRESS_BASE_MAINNET.toLowerCase()
      );
      
      // Use Mainnet balance for swapping (since Trade API only works on Mainnet)
      const usdcBalance = usdcBalanceMainnet;
      const network = "base"; // Base mainnet (where Trade API works)
      const usdcAddress = USDC_ADDRESS_BASE_MAINNET;
      
      if (!usdcBalance) {
        const sepoliaAmount = usdcBalanceSepolia 
          ? formatUnits(BigInt(usdcBalanceSepolia.amount.amount), 6)
          : "0";
        
        return JSON.stringify({
          success: false,
          message: "No USDC balance found on Base Mainnet (required for swapping)",
          account: account.address,
          note: `You have ${sepoliaAmount} USDC on Base Sepolia, but swaps require USDC on Base Mainnet. Bridge your USDC from Sepolia to Mainnet first, or wait for Base Sepolia Trade API support.`,
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
      
      console.log(`💰 Yield Generation: Attempting to swap ${formatUnits(usdcAmount, 6)} USDC (${percentage}% of ${formatUnits(totalUSDC, 6)} USDC) to ETH`);
      
      // Note: CDP Trade API currently only supports Base Mainnet and Ethereum Mainnet, not Base Sepolia
      // We'll attempt the swap and handle the error gracefully
      try {
        // Use account.swap() with correct API signature
        // Using Base mainnet addresses (Trade API supports Base mainnet)
        const swapResult = await account.swap({
          network: network,
          fromToken: usdcAddress, // USDC on Base mainnet
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
        // Trade API doesn't support Base Sepolia yet - will work once support is added
        const errorMessage = swapError instanceof Error ? swapError.message : "Unknown error";
        console.warn(`Swap failed (expected on Base Sepolia): ${errorMessage}`);
        
        return JSON.stringify({
          success: false,
          message: "Swap attempted but CDP Trade API currently only supports Base Mainnet and Ethereum Mainnet, not Base Sepolia",
          calculated: {
            usdcToSwap: formatUnits(usdcAmount, 6),
            percentage,
            totalUSDC: formatUnits(totalUSDC, 6),
          },
          account: account.address,
          error: errorMessage,
          note: "This functionality will work automatically once CDP Trade API adds Base Sepolia support.",
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
    description: `Converts a percentage (default 25%) of received USDC payments to ETH using CDP smart wallet for yield generation. Checks the account's USDC balance and swaps the specified percentage to ETH. Note: Currently only works on Base Mainnet; Base Sepolia support is pending.`,
    schema: schema as any,
  }
);

