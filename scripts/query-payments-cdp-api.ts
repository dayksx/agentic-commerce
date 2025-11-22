import dotenv from 'dotenv';
import { formatUnits } from 'viem';
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

/**
 * Query payments using CDP Address History API (JSON-RPC)
 * This uses the CDP JSON-RPC API which provides indexed onchain data
 * 
 * Note: This requires a Client API Key (RPC endpoint), not Secret API Keys
 * Get your RPC endpoint from: https://portal.cdp.coinbase.com > Node page
 */
async function queryPaymentsViaCDP() {
  const PAYMENT_ADDRESS = await getPaymentAddress();
  console.log(`🔍 Querying payments via CDP Address History API...\n`);
  console.log(`Payment Address: ${PAYMENT_ADDRESS}\n`);

  // CDP Address History API requires an RPC endpoint
  // Format: https://api.developer.coinbase.com/rpc/v1/base-sepolia/<YOUR_CLIENT_API_KEY>
  const rpcEndpointBase = process.env.CDP_RPC_ENDPOINT;
  const apiKeySecret = process.env.CDP_API_KEY_SECRET;

  console.log('rpcEndpointBase', rpcEndpointBase);
  console.log('apiKeySecret', apiKeySecret);
  if (!rpcEndpointBase || !apiKeySecret) {
    console.log('⚠️  Missing required environment variables.');
    console.log('   Set both CDP_RPC_ENDPOINT and CDP_API_KEY_SECRET in .env\n');
    console.log('   Example:');
    console.log('   CDP_RPC_ENDPOINT=https://api.developer.coinbase.com/rpc/v1/base-sepolia/');
    console.log('   CDP_API_KEY_SECRET=your_client_api_key\n');
    console.log('   Steps to get your RPC endpoint:');
    console.log('   1. Go to https://portal.cdp.coinbase.com');
    console.log('   2. Navigate to Node page');
    console.log('   3. Select "Base Sepolia" network');
    console.log('   4. Copy your RPC endpoint URL');
    console.log('   5. Set CDP_RPC_ENDPOINT in .env\n');
    console.log('   Alternatively, use the blockchain query method: pnpm query-payments\n');
    return;
  }

  // Concatenate the endpoint base with the API key secret
  const rpcEndpoint = rpcEndpointBase + apiKeySecret;

  try {
    // CDP Address History API uses JSON-RPC format
    const response = await fetch(rpcEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'cdp_listAddressTransactions',
        params: {
          address: PAYMENT_ADDRESS,
          pageSize: 100,
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`CDP API error: ${response.status} ${response.statusText}\n${errorText}`);
    }

    const data = await response.json() as {
      error?: { message: string; code?: number };
      result?: {
        transactions?: Array<{
          transactionHash: string;
          value: string;
          from: string;
          blockNumber: string;
          tokenAddress?: string;
        }>;
        pageToken?: string;
      };
    };
    
    if (data.error) {
      throw new Error(`CDP API error: ${data.error.message} (code: ${data.error.code})`);
    }

    const transactions = data.result?.transactions || [];
    console.log(`✅ Found ${transactions.length} transactions\n`);
    
    // Filter for USDC transfers and display
    const usdcTransfers = transactions.filter((tx) => 
      tx.tokenAddress?.toLowerCase() === USDC_ADDRESS.toLowerCase()
    );
    
    if (usdcTransfers.length === 0) {
      console.log('💰 No USDC payments found.\n');
      return;
    }

    console.log(`💰 USDC Payments: ${usdcTransfers.length}\n`);
    console.log('─'.repeat(100));
    
    usdcTransfers.forEach((tx, index) => {
      const amount = formatUnits(BigInt(tx.value || '0'), 6);
      console.log(`${index + 1}. ${tx.transactionHash}`);
      console.log(`   Amount: ${amount} USDC ($${parseFloat(amount).toFixed(2)})`);
      console.log(`   From: ${tx.from}`);
      console.log(`   Block: ${tx.blockNumber}`);
      console.log(`   View: https://sepolia.basescan.org/tx/${tx.transactionHash}`);
      console.log('');
    });
    
    console.log('─'.repeat(100));
    const totalAmount = usdcTransfers.reduce((sum, tx) => {
      return sum + parseFloat(formatUnits(BigInt(tx.value || '0'), 6));
    }, 0);
    console.log(`💵 Total: $${totalAmount.toFixed(2)} USDC\n`);
  } catch (error) {
    console.error('Error querying CDP API:', error);
    throw error;
  }
}

/**
 * Main function
 */
async function main() {
  try {
    await queryPaymentsViaCDP();
  } catch (error) {
    console.error('Failed to query payments:', error);
    process.exit(1);
  }
}

main();
