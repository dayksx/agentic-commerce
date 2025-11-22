import dotenv from 'dotenv';
import { createPublicClient, http, formatUnits, parseAbiItem } from 'viem';
import { baseSepolia } from 'viem/chains';

dotenv.config();

// Your payment receiving address
const PAYMENT_ADDRESS = '0x4D8aD86dEe297B5703E92465692999abDB0508c8';
// USDC token address on Base Sepolia
const USDC_ADDRESS = '0x036CbD53842c5426634e7929541eC2318f3dCF7e';

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

