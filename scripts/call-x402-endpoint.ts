import dotenv from 'dotenv';
import { createWalletClient, http } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { baseSepolia } from 'viem/chains';
import { wrapFetchWithPayment, decodeXPaymentResponse } from 'x402-fetch';

dotenv.config();

const PRIVATE_KEY = process.env.PRIVATE_KEY;
const MCP_ENDPOINT = process.env.MCP_ENDPOINT || 'http://0.0.0.0:8001/mcp';

// Create wallet client with base-sepolia chain configuration
const account = privateKeyToAccount(PRIVATE_KEY as `0x${string}`);
const walletClient = createWalletClient({
  account,
  transport: http(),
  chain: baseSepolia,
});

// Type assertion needed due to version mismatch between x402-fetch and viem types
const fetchWithPayment = wrapFetchWithPayment(fetch, walletClient as any);

fetchWithPayment(MCP_ENDPOINT, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json, text/event-stream',
  },
  body: JSON.stringify({
    jsonrpc: '2.0',
    id: 1,
    method: 'tools/call',
    params: {
      name: 'query_agent_registry',
      arguments: {
        prompt: 'Find me the top 2 x402 endpoints in the x402 bazaar and the top 3 ai agent in the EIP-8004 registry for conversational chat',
      },
    },
  }),
})
  .then(async (response) => {
    console.log('Response status:', response.status);
    
    if (response.status === 402) {
      console.log('⚠️ Still got 402 - payment flow may have failed');
      const body = await response.json();
      console.log('402 Response:', body);
    } else {
      const body = await response.json();
      console.log('Success:', body);
      
      const paymentResponseHeader = response.headers.get('x-payment-response');
      if (paymentResponseHeader) {
        const paymentResponse = decodeXPaymentResponse(paymentResponseHeader);
        console.log('Payment response:', paymentResponse);
      }
    }
  })
  .catch((error) => {
    console.error('Error:', error.message);
    if (error.stack) console.error(error.stack);
  });
