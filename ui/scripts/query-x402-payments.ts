import { createPublicClient, http, formatUnits, parseAbiItem } from 'viem';
import { baseSepolia } from 'viem/chains';
import { CdpClient } from '@coinbase/cdp-sdk';

// USDC token address on Base Sepolia
const USDC_ADDRESS = '0x036CbD53842c5426634e7929541eC2318f3dCF7e';
const DEFAULT_PAYMENT_ADDRESS = '0x42849E96716efDBCCb6416e7E099830C0b1Eb34f';

async function getPaymentAddress(): Promise<`0x${string}`> {
  try {
    const accountName = process.env.CDP_PAYMENT_ACCOUNT_NAME;
    const accountAddress = process.env.CDP_PAYMENT_ACCOUNT_ADDRESS;

    const cdp = new CdpClient();

    if (accountName) {
      const account = await cdp.evm.getOrCreateAccount({ name: accountName });
      return account.address;
    }
    if (accountAddress) {
      const account = await cdp.evm.getAccount({ address: accountAddress as `0x${string}` });
      return account.address;
    }
    const account = await cdp.evm.getOrCreateAccount({ name: "mcp-payment-receiver" });
    return account.address;

  } catch {
    return (process.env.MCP_PAYMENT_ADDRESS || DEFAULT_PAYMENT_ADDRESS) as `0x${string}`;
  }
}

// Public client
const publicClient = createPublicClient({
  chain: baseSepolia,
  transport: http(),
});

export interface PaymentInfo {
  transactionHash: string;
  blockNumber: bigint;
  timestamp: Date;
  from: string;
  amount: string;
  amountUSD: string;
}

export async function queryPayments(limit: number = 100): Promise<PaymentInfo[]> {
  const PAYMENT_ADDRESS = await getPaymentAddress();
  const currentBlock = await publicClient.getBlockNumber();

  const transferEvent = parseAbiItem(
    'event Transfer(address indexed from, address indexed to, uint256 value)'
  );

  const transferEvents = await publicClient.getLogs({
    address: USDC_ADDRESS,
    event: transferEvent,
    args: { to: PAYMENT_ADDRESS },
    fromBlock: currentBlock - 10000n,
    toBlock: 'latest',
  });

  const payments: PaymentInfo[] = [];

  for (const event of transferEvents.slice(0, limit)) {
    const block = await publicClient.getBlock({ blockNumber: event.blockNumber });
    const amount = formatUnits(event.args.value || 0n, 6);
    
    payments.push({
      transactionHash: event.transactionHash,
      blockNumber: event.blockNumber,
      timestamp: new Date(Number(block.timestamp) * 1000),
      from: event.args.from || 'unknown',
      amount,
      amountUSD: `$${Number(amount).toFixed(2)}`
    });
  }

  return payments.sort((a, b) => Number(b.blockNumber) - Number(a.blockNumber));
}

// RUN ONLY IF CLI
if (process.argv[1]?.includes('query-x402-payments')) {
  queryPayments(50).then(console.log);
}