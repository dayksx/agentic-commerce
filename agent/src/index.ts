// Load environment variables FIRST, before any other imports
import dotenv from 'dotenv';
import { AgentRuntime } from "./app/AgentRuntime";

dotenv.config();

// Load .env from project root (works in both dev and production)
// When running from dist/, process.cwd() is still the project root
const agentRuntime = new AgentRuntime();

agentRuntime.createAgentCardServer(3000).catch((error) => {
    console.error("Failed to start Agent Card server:", error);
    process.exit(1);
});

// Create MCP server with SSE transport for HTTP/curl access
agentRuntime.createMCPServer(8001, true).catch((error) => {
    console.error("Failed to start MCP server:", error);
    process.exit(1);
});

// Listen for onchain USDC payments on Base Sepolia
// Monitors USDC transfers (0x036CbD53842c5426634e7929541eC2318f3dCF7e) to payment address
// and triggers yield generation workflow when payments are received
// Polls every 30 seconds (30000ms) - can be configured via YIELD_MONITOR_INTERVAL_MS env var

agentRuntime.listenOnchainPayments(30000).catch((error) => {
    console.error("Failed to start onchain payment listener:", error);
    // Don't exit - payment listener is optional
    console.warn("Continuing without onchain payment monitoring...");
});
