import { StateGraph, START, END, MessagesAnnotation } from "@langchain/langgraph";
import { HumanMessage } from "@langchain/core/messages";
import { ToolNode } from "@langchain/langgraph/prebuilt";

import { mockModel } from "./models/mockModel.js";
import { yieldModel } from "./models/yieldModel.js";

import { AgentCardServer } from "./servers/AgentCardServer.js";
import { MCPServer } from "./servers/MCPServer.js";
import { AgentCardConfig } from "./config/AgentCardConfig.js";
import { YieldMonitor } from "./services/YieldMonitor.js";

import { bazarTool, mockTool } from "./tools/index.js";

export type WorkflowId = 'mcp' | string;
export type Workflow = any

export class AgentRuntime {

    private agentCardServer: AgentCardServer | null = null;
    private mcpServer: MCPServer | null = null;
    private workflows: Map<WorkflowId, Workflow> = new Map();
    private yieldMonitor: YieldMonitor | null = null;

    constructor() {
        this.workflows.set('default', this.defineDefaultWorkflow());
        this.workflows.set('mcp', this.defineMCPWorkflow());
        this.workflows.set('yield', this.defineYieldWorkflow());
    }

    /**
     * Conditional edge function: routes to toolNode if there are tool_calls, otherwise END
     */
    private shouldContinueToToolNode = (state: typeof MessagesAnnotation.State) => {
        const messages = state.messages;
        const lastMessage = messages[messages.length - 1];
        if (lastMessage && 'tool_calls' in lastMessage) {
            const toolCalls = (lastMessage as any).tool_calls;
            if (toolCalls && Array.isArray(toolCalls) && toolCalls.length > 0) {
                return "toolNode";
            }
        }
        return END;
    };

    private defineDefaultWorkflow() {
        const tools = [mockTool, bazarTool] as any;
        const toolNode = new ToolNode(tools);

        return new StateGraph(MessagesAnnotation)
            .addNode("chatNode", mockModel)
            .addNode("toolNode", toolNode)
            .addEdge(START, "chatNode")
            .addConditionalEdges("chatNode", this.shouldContinueToToolNode)
            .addEdge("toolNode", "chatNode")
            .compile();
    }

    private defineMCPWorkflow() {

        const tools = [mockTool, bazarTool] as any;
        const toolNode = new ToolNode(tools);

        return new StateGraph(MessagesAnnotation)
            .addNode("mockModel", mockModel)
            .addNode("toolNode", toolNode)
            .addEdge(START, "mockModel")
            .addConditionalEdges("mockModel", this.shouldContinueToToolNode)
            .addEdge("toolNode", "mockModel")
            .compile();
    }

    /**
     * Defines the yield generation workflow
     * This workflow is triggered by onchain USDC transfer events
     */
    private defineYieldWorkflow() {
        return new StateGraph(MessagesAnnotation)
            .addNode("yieldModel", yieldModel)
            .addEdge(START, "yieldModel")
            .addEdge("yieldModel", END)
            .compile();
    }

    /**
     * Creates an MCP server
     * 
     */
    public async createMCPServer(port: number, enablePayment?: boolean): Promise<void> {
        this.mcpServer = new MCPServer(
            async (prompt: string) => {
                console.log("✉️  MCP Server: Executing workflow with prompt: '", prompt, "'");

                const result = await this.workflows.get('mcp')?.invoke({
                    messages: [new HumanMessage(prompt)]
                });
                
                // Extraire le dernier message de la réponse
                const messages = (result as { messages: any[] }).messages;
                const lastMessage = messages[messages.length - 1];
                
                // Retourner le contenu du message sous forme de string
                return typeof lastMessage.content === 'string' 
                    ? lastMessage.content 
                    : JSON.stringify(lastMessage.content);
            },
            port,
            enablePayment
        );

        await this.mcpServer.start();
    }

    /**
     * Agent Card Server
     */
    public async createAgentCardServer(port: number): Promise<void> {
        const config = AgentCardConfig.fromEnvironment({ port });
        const agentCard = AgentCardConfig.buildAgentCard(config);
        
        this.agentCardServer = new AgentCardServer({
            port: port,
            agentCard
        });
        await this.agentCardServer.start();
    }

    /**
     * Listens for onchain USDC payments on Base Sepolia
     * Monitors USDC transfers (0x036CbD53842c5426634e7929541eC2318f3dCF7e) to the payment address
     * and triggers the yield generation workflow when payments are received
     * 
     * @param pollIntervalMs - Polling interval in milliseconds (default: 30000 = 30 seconds)
     */
    public async listenOnchainPayments(pollIntervalMs?: number): Promise<void> {
        if (this.yieldMonitor) {
            console.warn("Onchain payment listener is already running");
            return;
        }

        this.yieldMonitor = new YieldMonitor(pollIntervalMs);
        
        // Set up event handler to trigger yield workflow when USDC is received
        this.yieldMonitor.onUSDCTransfer(async (event) => {
            console.log(`💰 USDC payment received: ${event.amountFormatted} USDC from ${event.from}`);
            console.log(`💰 Triggering yield generation workflow...`);
            
            try {
                const yieldWorkflow = this.workflows.get('yield');
                if (yieldWorkflow) {
                    await yieldWorkflow.invoke({
                        messages: [
                            new HumanMessage(
                                `Generate yield: Convert 25% of received USDC (${event.amountFormatted} USDC from transaction ${event.transactionHash}) to ETH`
                            )
                        ]
                    });
                }
            } catch (error) {
                console.error("Error executing yield workflow:", error);
            }
        });

        await this.yieldMonitor.start();
        console.log("💰 Listening for USDC payments on Base Sepolia...");
    }

    /**
     * Stops listening for onchain payments
     */
    public stopListeningOnchainPayments(): void {
        if (this.yieldMonitor) {
            this.yieldMonitor.stop();
            this.yieldMonitor = null;
            console.log("💰 Stopped listening for onchain payments");
        }
    }

}
