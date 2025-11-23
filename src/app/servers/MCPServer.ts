import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import express, { Express } from "express";

/**
 * MCP Server that exposes a LangGraph workflow as an MCP tool.
 * The server can be accessed via MultiServerMCPClient from other agents.
 */
export class MCPServer {
    private server: McpServer | null = null;
    private expressApp: Express | null = null;
    private executeWorkflow: (prompt: string) => Promise<string>;

    constructor(executeWorkflow: (prompt: string) => Promise<string>) {
        this.executeWorkflow = executeWorkflow;
    }

    /**
     * Starts the MCP server
     */
    public async start(transport: "stdio" | "sse" = "stdio"): Promise<void> {
        if (this.server) {
            console.warn('MCP Server is already running');
            return;
        }

        // Create the MCP server
        this.server = new McpServer({
            name: "basic-agent-mcp-server",
            version: "1.0.0"
        });

        this.registerTool();
        
        if (transport === "sse") {
            this.launchSSEServer(8001);
        } else {
            this.launchStdioServer();
        }
    }

    public registerTool() {

        // Tool pour interroger le registry EIP-8004
        this.server?.tool(
            'query_agent_registry',
            'Recherche et récupère des informations sur des agents enregistrés dans un registry EIP-8004. Prend un prompt en entrée et exécute le workflow LangGraph pour obtenir la réponse.',
            { prompt: z.string() },
            async ({ prompt }) => {
                try {
                    // Exécuter le workflow avec le prompt
                    const result = await this.executeWorkflow(prompt);

                    return {
                        content: [{ type: 'text', text: result }],
                        structuredContent: { response: result }
                    };
                } catch (error) {
                    const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue lors de l\'exécution du workflow';
                    return {
                        content: [{ 
                            type: 'text', 
                            text: JSON.stringify({ 
                                error: errorMessage,
                                prompt
                            }, null, 2) 
                        }],
                        structuredContent: {
                            error: errorMessage,
                            prompt
                        }
                    };
                }
            }
        );
    }

    public launchStdioServer() {
        this.server?.connect(new StdioServerTransport());
    }

    public launchSSEServer(port: number = 8001): void {

        // Set up Express and HTTP transport
        this.expressApp = express();
        this.expressApp.use(express.json());

        this.expressApp.post('/mcp', async (req, res) => {
            // Ensure Accept header is set for StreamableHTTPServerTransport
            if (!req.headers.accept) {
                req.headers.accept = 'application/json, text/event-stream';
            } else if (!req.headers.accept.includes('application/json') || !req.headers.accept.includes('text/event-stream')) {
                req.headers.accept = 'application/json, text/event-stream';
            }

            // Create a new transport for each request to prevent request ID collisions
            const transport = new StreamableHTTPServerTransport({
                sessionIdGenerator: undefined,
                enableJsonResponse: true
            });

            res.on('close', () => {
                transport.close();
            });

            await this.server!.connect(transport);
            await transport.handleRequest(req, res, req.body);
        });

        this.expressApp.listen(port, () => {
            console.log(`🚀 MCP server running on http://localhost:${port}/mcp`);
        }).on('error', (error) => {
            console.error('Server error:', error);
            process.exit(1);
        });
    }

    /**
     * Stops the MCP server
     */
    public stop(): void {
        if (this.expressApp) {
            this.expressApp = null;
        }
        this.server = null;
    }

    /**
     * Checks if the server is currently running
     */
    public isRunning(): boolean {
        return this.server !== null;
    }
}

