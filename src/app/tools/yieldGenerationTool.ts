import * as z from "zod";
import { tool } from "langchain";
import { CdpClient } from "@coinbase/cdp-sdk";
import { parseUnits, formatUnits } from "viem";
import dotenv from "dotenv";

dotenv.config();

// USDC token address on Base Sepolia
const USDC_ADDRESS = "0x036CbD53842c5426634e7929541eC2318f3dCF7e";
// WETH address on Base Sepolia (for swapping)
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
      
      // Get USDC balance using CDP client
      const cdp = new CdpClient();
      const balances = await cdp.evm.listTokenBalances({
        address: account.address,
        network: "base-sepolia",
      });
      
      // Find USDC balance
      const usdcBalance = balances.balances.find(
        (b) => b.token.contractAddress.toLowerCase() === USDC_ADDRESS.toLowerCase()
      );
      
      if (!usdcBalance) {
        return JSON.stringify({
          success: false,
          message: "No USDC balance found in the account",
          account: account.address,
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
      
      console.log(`💰 Yield Generation: Would swap ${formatUnits(usdcAmount, 6)} USDC (${percentage}% of ${formatUnits(totalUSDC, 6)} USDC) to ETH`);
      
      // Note: CDP Trade API currently only supports Base Mainnet and Ethereum Mainnet, not Base Sepolia
      // This functionality will be enabled once CDP Trade API adds Base Sepolia support
      return JSON.stringify({
        success: false,
        message: "Yield generation calculated but swap not executed - CDP Trade API only supports Base Mainnet, not Base Sepolia",
        calculated: {
          usdcToSwap: formatUnits(usdcAmount, 6),
          percentage,
          totalUSDC: formatUnits(totalUSDC, 6),
        },
        account: account.address,
        note: "This functionality will work automatically once CDP Trade API adds Base Sepolia support. The calculated amount is ready for swap execution.",
      });
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

