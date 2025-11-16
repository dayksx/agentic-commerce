import { AgentRuntime } from "./app/AgentRuntime";

const agentRuntime = new AgentRuntime();

// agentRuntime.registerTelegramClient().catch((error) => {
//     console.error("Failed to start Telegram client:", error);
//     process.exit(1);
// });

agentRuntime.createAgentCardServer(3000).catch((error) => {
    console.error("Failed to start Agent Card server:", error);
    process.exit(1);
});

// Create MCP server with SSE transport for HTTP/curl access
agentRuntime.createMCPServer(8001, true).catch((error) => {
    console.error("Failed to start MCP server:", error);
    process.exit(1);
});

// Create A2A server
agentRuntime.createA2AServer(3001, true).catch((error) => {
    console.error("Failed to start A2A server:", error);
    process.exit(1);
});

// Optional: run a test invocation
// agentRuntime.start();