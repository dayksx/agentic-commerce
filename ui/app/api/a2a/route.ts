import { NextResponse } from 'next/server';
import { createWalletClient, http } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { baseSepolia } from 'viem/chains';
import { wrapFetchWithPayment, decodeXPaymentResponse } from 'x402-fetch';

const PRIVATE_KEY = process.env.PRIVATE_KEY;
const MCP_ENDPOINT = process.env.MCP_ENDPOINT || 'http://0.0.0.0:8001/mcp';

// Create wallet client with base-sepolia chain configuration
let walletClient: ReturnType<typeof createWalletClient> | null = null;
let fetchWithPayment: typeof fetch | null = null;

// Initialize wallet client and payment wrapper
if (PRIVATE_KEY) {
  try {
    const account = privateKeyToAccount(PRIVATE_KEY as `0x${string}`);
    walletClient = createWalletClient({
      account,
      transport: http(),
      chain: baseSepolia,
    });
    // Type assertion needed due to version mismatch between x402-fetch and viem types
    fetchWithPayment = wrapFetchWithPayment(fetch, walletClient as any);
  } catch (error) {
    console.error('Failed to initialize wallet client:', error);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { message, conversationId } = body;

    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    if (!PRIVATE_KEY) {
      return NextResponse.json(
        { error: 'PRIVATE_KEY environment variable is not set' },
        { status: 500 }
      );
    }

    if (!fetchWithPayment) {
      return NextResponse.json(
        { error: 'Failed to initialize payment client' },
        { status: 500 }
      );
    }

    // Call MCP server with x402 payment handling
    const response = await fetchWithPayment(MCP_ENDPOINT, {
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
            prompt: message,
          },
        },
      }),
    });

    if (response.status === 402) {
      console.log('⚠️ Still got 402 - payment flow may have failed');
      const errorBody = await response.json();
      return NextResponse.json(
        { 
          error: 'Payment required',
          details: errorBody,
          message: 'Payment processing failed. Please try again.'
        },
        { status: 402 }
      );
    }

    if (!response.ok) {
      const errorBody = await response.text();
      return NextResponse.json(
        { 
          error: 'MCP server error',
          details: errorBody,
          message: 'Failed to communicate with MCP server.'
        },
        { status: response.status }
      );
    }

    const data = await response.json();
    
    // Extract payment response if available
    const paymentResponseHeader = response.headers.get('x-payment-response');
    let paymentResponse = null;
    if (paymentResponseHeader) {
      try {
        paymentResponse = decodeXPaymentResponse(paymentResponseHeader);
      } catch (error) {
        console.warn('Failed to decode payment response:', error);
      }
    }

    // Extract the result from the MCP response
    let resultMessage = 'I received your message.';
    if (data.result?.content) {
      // Handle array of content items
      if (Array.isArray(data.result.content)) {
        resultMessage = data.result.content
          .map((item: any) => item.text || JSON.stringify(item))
          .join('\n');
      } else if (typeof data.result.content === 'string') {
        resultMessage = data.result.content;
      }
    } else if (data.result?.structuredContent?.response) {
      resultMessage = data.result.structuredContent.response;
    } else if (data.error) {
      resultMessage = `Error: ${data.error.message || JSON.stringify(data.error)}`;
    }

    return NextResponse.json({
      message: resultMessage,
      conversationId: conversationId || `conv_${Date.now()}`,
      timestamp: new Date().toISOString(),
      paymentResponse,
    });
  } catch (error) {
    console.error('Error in A2A chatbot:', error);
    return NextResponse.json(
      { error: 'Failed to process chat message', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  return NextResponse.json({
    service: 'A2A Chatbot',
    status: 'active',
    endpoint: '/api/a2a',
    methods: ['POST'],
  });
}

