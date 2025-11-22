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
