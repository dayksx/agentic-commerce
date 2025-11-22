import { CdpClient } from "@coinbase/cdp-sdk";
import { createPublicClient, http, parseAbiItem, formatUnits } from "viem";
import { baseSepolia } from "viem/chains";
import dotenv from "dotenv";

dotenv.config();

// USDC token address on Base Sepolia
const USDC_ADDRESS = "0x036CbD53842c5426634e7929541eC2318f3dCF7e";

// Create public client for Base Sepolia
const publicClient = createPublicClient({
  chain: baseSepolia,
  transport: http(),
});

/**
 * Gets the payment address from CDP server wallet (same logic as MCPServer)
 */
async function getPaymentAddress(): Promise<`0x${string}`> {
  const accountName = process.env.CDP_PAYMENT_ACCOUNT_NAME;
  const accountAddress = process.env.CDP_PAYMENT_ACCOUNT_ADDRESS;
  
  const cdp = new CdpClient();
  
  if (accountName) {
    const account = await cdp.evm.getOrCreateAccount({ name: accountName });
    return account.address;
  } else if (accountAddress) {
    try {
      const account = await cdp.evm.getAccount({ address: accountAddress as `0x${string}` });
      return account.address;
    } catch (error) {
      const account = await cdp.evm.getOrCreateAccount({ name: "mcp-payment-receiver" });
      return account.address;
    }
  } else {
    const account = await cdp.evm.getOrCreateAccount({ name: "mcp-payment-receiver" });
    return account.address;
  }
}

export interface USDCTransferEvent {
  transactionHash: string;
  blockNumber: bigint;
  from: string;
  amount: bigint;
  amountFormatted: string;
}

export type YieldEventHandler = (event: USDCTransferEvent) => Promise<void>;

/**
 * Service that monitors onchain USDC transfers to the payment address
 * and triggers yield generation workflow when transfers are detected
 */
export class YieldMonitor {
  private paymentAddress: `0x${string}` | null = null;
  private isRunning: boolean = false;
  private pollingInterval: NodeJS.Timeout | null = null;
  private lastCheckedBlock: bigint | null = null;
  private yieldEventHandler: YieldEventHandler | null = null;
  private pollIntervalMs: number;

  constructor(pollIntervalMs: number = 30000) {
    // Default: poll every 30 seconds
    this.pollIntervalMs = pollIntervalMs;
  }

  /**
   * Sets the event handler that will be called when USDC transfers are detected
   */
  public onUSDCTransfer(handler: YieldEventHandler): void {
    this.yieldEventHandler = handler;
  }

  /**
   * Starts monitoring for USDC transfers
   */
  public async start(): Promise<void> {
    if (this.isRunning) {
      console.warn("Yield Monitor is already running");
      return;
    }

    try {
      // Get payment address
      this.paymentAddress = await getPaymentAddress();
      console.log(`💰 Yield Monitor: Monitoring USDC transfers to ${this.paymentAddress}`);

      // Get current block to start monitoring from
      const currentBlock = await publicClient.getBlockNumber();
      this.lastCheckedBlock = currentBlock;
      console.log(`💰 Yield Monitor: Starting from block ${currentBlock}`);

      this.isRunning = true;

      // Start polling
      this.pollingInterval = setInterval(() => {
        this.checkForTransfers().catch((error) => {
          console.error("Yield Monitor polling error:", error);
        });
      }, this.pollIntervalMs);

      // Do an initial check
      await this.checkForTransfers();
    } catch (error) {
      console.error("Failed to start Yield Monitor:", error);
      throw error;
    }
  }

  /**
   * Stops monitoring
   */
  public stop(): void {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }
    this.isRunning = false;
    console.log("💰 Yield Monitor: Stopped");
  }

  /**
   * Checks for new USDC transfers since last check
   */
  private async checkForTransfers(): Promise<void> {
    if (!this.paymentAddress || !this.isRunning) {
      return;
    }

    try {
      const currentBlock = await publicClient.getBlockNumber();
      const fromBlock = this.lastCheckedBlock 
        ? this.lastCheckedBlock + 1n 
        : currentBlock - 100n; // Check last 100 blocks if first run

      if (fromBlock > currentBlock) {
        return; // No new blocks
      }

      // Get USDC transfer events
      const transferEvent = parseAbiItem('event Transfer(address indexed from, address indexed to, uint256 value)');
      
      const transferEvents = await publicClient.getLogs({
        address: USDC_ADDRESS,
        event: transferEvent,
        args: {
          to: this.paymentAddress,
        },
        fromBlock: fromBlock,
        toBlock: currentBlock,
      });

      if (transferEvents.length > 0) {
        console.log(`💰 Yield Monitor: Found ${transferEvents.length} new USDC transfer(s)`);
        
        // Process each transfer event
        for (const event of transferEvents) {
          const amount = event.args.value || 0n;
          const amountFormatted = formatUnits(amount, 6); // USDC has 6 decimals
          
          const transferEvent: USDCTransferEvent = {
            transactionHash: event.transactionHash,
            blockNumber: event.blockNumber,
            from: event.args.from || 'unknown',
            amount: amount,
            amountFormatted: amountFormatted,
          };

          console.log(`💰 Yield Monitor: USDC transfer detected - ${amountFormatted} USDC from ${transferEvent.from}`);
          
          // Trigger yield generation workflow
          if (this.yieldEventHandler) {
            await this.yieldEventHandler(transferEvent);
          }
        }
      }

      // Update last checked block
      this.lastCheckedBlock = currentBlock;
    } catch (error) {
      console.error("Error checking for USDC transfers:", error);
    }
  }

  /**
   * Checks if the monitor is currently running
   */
  public getRunning(): boolean {
    return this.isRunning;
  }
}

