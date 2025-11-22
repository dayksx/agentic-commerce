import dotenv from 'dotenv';
import { createPublicClient, http, formatUnits, parseAbiItem } from 'viem';
import { baseSepolia } from 'viem/chains';
import { CdpClient } from '@coinbase/cdp-sdk';

dotenv.config();

// USDC token address on Base Sepolia
const USDC_ADDRESS = '0x036CbD53842c5426634e7929541eC2318f3dCF7e';
const DEFAULT_PAYMENT_ADDRESS = '0x4D8aD86dEe297B5703E92465692999abDB0508c8';

/**
 * Gets the payment address from CDP server wallet (same as MCPServer)
 * Falls back to environment variable or default address
 */
async function getPaymentAddress(): Promise<`0x${string}`> {
  try {
    const accountName = process.env.CDP_PAYMENT_ACCOUNT_NAME;
    const accountAddress = process.env.CDP_PAYMENT_ACCOUNT_ADDRESS;
    
    const cdp = new CdpClient();
    
    if (accountName) {
      // Use getOrCreateAccount to reuse existing account by name or create new one
      const account = await cdp.evm.getOrCreateAccount({ name: accountName });
      console.log(`✅ Using CDP server wallet account (name: ${accountName}): ${account.address}`);
      return account.address;
    } else if (accountAddress) {
      // Try to get existing account by address
      try {
        const account = await cdp.evm.getAccount({ address: accountAddress as `0x${string}` });
        console.log(`✅ Using existing CDP server wallet account: ${account.address}`);
        return account.address;
      } catch (error) {
        console.warn(`⚠️  Could not retrieve account ${accountAddress}, using fallback address`);
      }
    } else {
      // Try to get or create account with default name (same as MCPServer)
      try {
        const account = await cdp.evm.getOrCreateAccount({ name: "mcp-payment-receiver" });
        console.log(`✅ Using CDP server wallet account: ${account.address}`);
        return account.address;
      } catch (error) {
        console.warn(`⚠️  Could not create/get CDP account, using fallback address`);
      }
    }
  } catch (error) {
    console.warn('⚠️  Failed to initialize CDP server wallet, using fallback address');
    console.warn(`   Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
  
  // Fallback to env variable or default address
  const fallbackAddress = process.env.MCP_PAYMENT_ADDRESS || DEFAULT_PAYMENT_ADDRESS;
  console.log(`   Using payment address: ${fallbackAddress}`);
  return fallbackAddress as `0x${string}`;
}

// Create public client for Base Sepolia
const publicClient = createPublicClient({
  chain: baseSepolia,
  transport: http(),
});

interface PaymentInfo {
  transactionHash: string;
  blockNumber: bigint;
  timestamp: Date;
  from: string;
  amount: string;
  amountUSD: string;
}

/**
 * Query USDC transfers to your payment address
 */
async function queryPayments(limit: number = 100): Promise<PaymentInfo[]> {
  const PAYMENT_ADDRESS = await getPaymentAddress();
  console.log(`🔍 Querying payments to ${PAYMENT_ADDRESS} on Base Sepolia...\n`);

  try {
    // Get the current block number
    const currentBlock = await publicClient.getBlockNumber();
    console.log(`Current block: ${currentBlock}`);

    // Get USDC transfer events (Transfer event from ERC20)
    const transferEvent = parseAbiItem('event Transfer(address indexed from, address indexed to, uint256 value)');
    
    const transferEvents = await publicClient.getLogs({
      address: USDC_ADDRESS,
      event: transferEvent,
      args: {
        to: PAYMENT_ADDRESS,
      },
      fromBlock: currentBlock - BigInt(10000), // Last ~10k blocks (adjust as needed)
      toBlock: 'latest',
    });

    console.log(`Found ${transferEvents.length} USDC transfers to your address\n`);

    // Fetch block details for each transfer to get timestamps
    const payments: PaymentInfo[] = [];
    
    for (const event of transferEvents.slice(0, limit)) {
      try {
        const block = await publicClient.getBlock({ blockNumber: event.blockNumber });
        const amount = formatUnits(event.args.value || 0n, 6); // USDC has 6 decimals
        
        payments.push({
          transactionHash: event.transactionHash,
          blockNumber: event.blockNumber,
          timestamp: new Date(Number(block.timestamp) * 1000),
          from: event.args.from || 'unknown',
          amount: amount,
          amountUSD: `$${parseFloat(amount).toFixed(2)}`,
        });
      } catch (error) {
        console.error(`Error processing event ${event.transactionHash}:`, error);
      }
    }

    // Sort by block number (newest first)
    payments.sort((a, b) => Number(b.blockNumber) - Number(a.blockNumber));

    return payments;
  } catch (error) {
    console.error('Error querying payments:', error);
    throw error;
  }
}

/**
 * Display payments in a formatted table
 */
function displayPayments(payments: PaymentInfo[]) {
  if (payments.length === 0) {
    console.log('No payments found.\n');
    return;
  }

  console.log('📊 Payment History:\n');
  console.log('─'.repeat(120));
  console.log(
    `${'Date'.padEnd(20)} ${'From'.padEnd(42)} ${'Amount'.padEnd(12)} ${'Block'.padEnd(12)} ${'Tx Hash'.padEnd(66)}`
  );
  console.log('─'.repeat(120));

  let totalAmount = 0;

  for (const payment of payments) {
    const dateStr = payment.timestamp.toLocaleString();
    const fromShort = `${payment.from.slice(0, 6)}...${payment.from.slice(-4)}`;
    const txShort = `${payment.transactionHash.slice(0, 10)}...${payment.transactionHash.slice(-8)}`;
    
    console.log(
      `${dateStr.padEnd(20)} ${fromShort.padEnd(42)} ${payment.amountUSD.padEnd(12)} ${payment.blockNumber.toString().padEnd(12)} ${txShort.padEnd(66)}`
    );
    
    totalAmount += parseFloat(payment.amount);
  }

  console.log('─'.repeat(120));
  console.log(`\n💰 Total Payments: ${payments.length}`);
  console.log(`💵 Total Amount: $${totalAmount.toFixed(2)} USDC\n`);

  // Display explorer links
  console.log('🔗 View on BaseScan:');
  for (const payment of payments.slice(0, 5)) {
    console.log(`   https://sepolia.basescan.org/tx/${payment.transactionHash}`);
  }
  if (payments.length > 5) {
    console.log(`   ... and ${payments.length - 5} more\n`);
  }
}

/**
 * Main function
 */
async function main() {
  const limit = process.argv[2] ? parseInt(process.argv[2], 10) : 50;
  
  try {
    const payments = await queryPayments(limit);
    displayPayments(payments);
  } catch (error) {
    console.error('Failed to query payments:', error);
    process.exit(1);
  }
}

main();

