import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { z } from "zod";
import express, { Express } from "express";
import { Server as HttpServer } from "http";
import { paymentMiddleware } from "x402-express";
import { Server } from "../interfaces";

/**
 * MCP Server that exposes a LangGraph workflow as an MCP tool.
 * The server can be accessed via MultiServerMCPClient from other agents.
 */
export class MCPServer implements Server {
    private server: McpServer | null = null;
    private httpServer: HttpServer | null = null;
    private expressApp: Express | null = null;
    private executeWorkflow: (prompt: string) => Promise<string>;
    private port: number;
    private enablePayment: boolean;

    constructor(
        executeWorkflow: (prompt: string) => Promise<string>,
        port: number,
        enablePayment?: boolean
    ) {
        this.executeWorkflow = executeWorkflow;
        this.port = port;
        this.enablePayment = enablePayment ?? (process.env.MCP_REQUIRE_PAYMENT === 'true');
    }

    /**
     * Starts the MCP server
     */
    public async start(): Promise<void> {
        if (this.expressApp) {
            console.warn('MCP Server is already running');
            return;
        }

        // Create the MCP server
        this.server = new McpServer({
            name: "basic-agent-mcp-server",
            version: "1.0.0"
        });

        this.registerTool();
        
        // Set up Express server
        this.expressApp = express();
        this.expressApp.use(express.json());

        this.registerRoutes();

        this.httpServer = this.expressApp.listen(this.port, () => {
            const address = this.httpServer?.address();
            const hostname = address && typeof address === 'object' 
                ? (address.address === '0.0.0.0' || address.address === '::' ? '0.0.0.0' : address.address)
                : 'localhost';
            const port = address && typeof address === 'object' ? address.port : this.port;
            console.log(`🚀 MCP server running on http://${hostname}:${port}/mcp`);
        }).on('error', (error) => {
            console.error('MCP Server error:', error);
            process.exit(1);
        });
    }

    /**
     * Registers routes for the MCP server
     */
    private registerRoutes(): void {
        if (!this.expressApp) return;

        // Appliquer le middleware de paiement uniquement si activé
        if (this.enablePayment) {
            this.expressApp.use(paymentMiddleware(
                "0x224b11F0747c7688a10aCC15F785354aA6493ED6",
                {
                  "/mcp": {
                    price: "$0.10",
                    network: "base-sepolia",
                    config: {
                      description: "Access to premium content",
                    }
                  }
                }
            ));
        }

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
    }

    /**
     * Registers MCP tools
     */
    private registerTool(): void {
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

    /**
     * Stops the MCP server
     */
    public async stop(): Promise<void> {
        if (this.httpServer) {
            this.httpServer.close();
            this.httpServer = null;
        }
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

