import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { z } from "zod";
import express, { Express } from "express";
import { Server as HttpServer } from "http";
import { paymentMiddleware, Network } from "x402-express";
import { createFacilitatorConfig, facilitator } from "@coinbase/x402";
import { CdpClient } from "@coinbase/cdp-sdk";
import { Server } from "../interfaces.js";
import dotenv from 'dotenv';

dotenv.config();

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
    private cdpClient: CdpClient | null = null;
    private paymentAddress: string | null = null;

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

        this.server = new McpServer({
            name: "basic-agent-mcp-server",
            version: "1.0.0"
        });

        this.registerTool();
        
        // Initialize CDP server wallet for payment receiving address
        if (this.enablePayment) {
            await this.initializePaymentAddress();
        }
        
        // Set up Express server
        this.expressApp = express();
        this.expressApp.use(express.json());

        await this.registerRoutes();

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
     * Initializes the payment receiving address using CDP server wallet
     */
    private async initializePaymentAddress(): Promise<void> {
        try {
            // Check if a specific account name or address is provided in env (for reusing existing account)
            const accountName = process.env.CDP_PAYMENT_ACCOUNT_NAME;
            const accountAddress = process.env.CDP_PAYMENT_ACCOUNT_ADDRESS;
            
            this.cdpClient = new CdpClient();
            
            if (accountName) {
                // Use getOrCreateAccount to reuse existing account by name or create new one
                const account = await this.cdpClient.evm.getOrCreateAccount({ name: accountName });
                this.paymentAddress = account.address;
                console.log(`✅ Using CDP server wallet account (name: ${accountName}): ${this.paymentAddress}`);
            } else if (accountAddress) {
                // Try to get existing account by address
                try {
                    const account = await this.cdpClient.evm.getAccount({ address: accountAddress as `0x${string}` });
                    this.paymentAddress = account.address;
                    console.log(`✅ Using existing CDP server wallet account: ${this.paymentAddress}`);
                } catch (error) {
                    console.warn(`⚠️  Could not retrieve account ${accountAddress}, creating new account...`);
                    const account = await this.cdpClient.evm.createAccount();
                    this.paymentAddress = account.address;
                    console.log(`✅ Created new CDP server wallet account: ${this.paymentAddress}`);
                    console.log(`   Set CDP_PAYMENT_ACCOUNT_ADDRESS=${account.address} in .env to reuse this account`);
                }
            } else {
                // Create a new account with a default name
                const account = await this.cdpClient.evm.getOrCreateAccount({ name: "mcp-payment-receiver" });
                this.paymentAddress = account.address;
                console.log(`✅ Created CDP server wallet account for payments: ${this.paymentAddress}`);
                console.log(`   Set CDP_PAYMENT_ACCOUNT_NAME=mcp-payment-receiver in .env to reuse this account`);
            }
        } catch (error) {
            console.warn('⚠️  Failed to initialize CDP server wallet, falling back to environment variable or default address');
            console.warn(`   Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
            
            // Fallback to env variable or default address
            this.paymentAddress = process.env.MCP_PAYMENT_ADDRESS || "0x4D8aD86dEe297B5703E92465692999abDB0508c8";
            console.log(`   Using payment address: ${this.paymentAddress}`);
        }
    }

    /**
     * Registers routes for the MCP server
     */
    private async registerRoutes(): Promise<void> {
        if (!this.expressApp) return;

        
        if (this.enablePayment) {
            const paymentAddress = (this.paymentAddress || process.env.MCP_PAYMENT_ADDRESS || "0x4D8aD86dEe297B5703E92465692999abDB0508c8") as `0x${string}`;
            
            // Determine facilitator configuration
            // Use CDP's facilitator for mainnet, testnet facilitator URL for testnet
            const networkEnv = process.env.MCP_PAYMENT_NETWORK || "base-sepolia";
            // Ensure network is one of the supported types
            const network: "base-sepolia" | "base" = (networkEnv === "base" || networkEnv === "base-mainnet") ? "base" : "base-sepolia";
            
            // For mainnet with CDP, use CDP's facilitator; otherwise use testnet facilitator
            const facilitatorConfig: { url: `https://${string}` } | ReturnType<typeof createFacilitatorConfig> = network === "base" && this.cdpClient
                ? createFacilitatorConfig() // CDP facilitator config for mainnet
                : { url: "https://x402.org/facilitator" as `https://${string}` }; // for testnet
            
            this.expressApp.use(paymentMiddleware(
                paymentAddress,
                {
                  "/mcp": {
                    price: "$0.001",
                    network: network,
                    config: {
                      description: "Access to premium content",
                      maxTimeoutSeconds: 300, // 5 minutes - gives more time for payment processing
                    }
                  }
                },
                facilitatorConfig
            ));
            
            console.log(`💰 Payment enabled - receiving payments at: ${paymentAddress} on ${network}`);
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

