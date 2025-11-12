import 'dotenv/config';

import { StateGraph, START, END, MessagesAnnotation } from "@langchain/langgraph";
import { HumanMessage } from "@langchain/core/messages";
import { ToolNode } from "@langchain/langgraph/prebuilt";
import { TavilySearch } from "@langchain/tavily";

import { chatModel } from "./models/chatModel";
import { multichainModel } from "./models/multichainModel";
import { eip8004Model } from "./models/eip8004Model";

import { AgentCardServer } from "./servers/AgentCardServer";
import { MCPServer } from "./servers/MCPServer";
import { A2AServer } from "./servers/A2AServer";
import { AgentCardConfig } from "./config/AgentCardConfig";

import { TelegramClient } from "./clients/TelegramClient";
import { eip8004Search, multichainTool } from "./tools";

export type WorkflowId = 'telegram' | 'mcp' | 'a2a' | string;
export type Workflow = any

export class AgentRuntime {

    private agentCardServer: AgentCardServer | null = null;
    private mcpServer: MCPServer | null = null;
    private a2aServer: A2AServer | null = null;
    private telegramClient: TelegramClient | null = null;
    private workflows: Map<WorkflowId, Workflow> = new Map();

    constructor() {
        this.workflows.set('default', this.defineDefaultWorkflow());
        this.workflows.set('mcp', this.defineMCPWorkflow());
        this.workflows.set('a2a', this.defineA2AWorkflow());
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
        const tools = [new TavilySearch({ maxResults: 3 })] as any;
        const toolNode = new ToolNode(tools);

        return new StateGraph(MessagesAnnotation)
            .addNode("chatNode", chatModel)
            .addNode("toolNode", toolNode)
            .addEdge(START, "chatNode")
            .addConditionalEdges("chatNode", this.shouldContinueToToolNode)
            .addEdge("toolNode", "chatNode")
            .compile();
    }

    private defineMCPWorkflow() {

        const tools = [eip8004Search] as any;
        const toolNode = new ToolNode(tools);

        return new StateGraph(MessagesAnnotation)
            .addNode("eip8004Node", eip8004Model)
            .addNode("toolNode", toolNode)
            .addEdge(START, "eip8004Node")
            .addConditionalEdges("eip8004Node", this.shouldContinueToToolNode)
            .addEdge("toolNode", "eip8004Node")
            .addEdge("eip8004Node", END)
            .compile();
    }

    private defineA2AWorkflow() {

        const tools = [multichainTool] as any;
        const toolNode = new ToolNode(tools);

        return new StateGraph(MessagesAnnotation)
            .addNode("multichainNode", multichainModel)
            .addNode("toolNode", toolNode)
            .addEdge(START, "multichainNode")
            .addConditionalEdges("multichainNode", this.shouldContinueToToolNode)
            .addEdge("toolNode", "multichainNode")
            .addEdge("multichainNode", END)
            .compile();
    }

    public async start(): Promise<void> {
        const result = await this.workflows.get('default')?.invoke({
            messages: [new HumanMessage("Hello, how are you?")]
        });
        console.log(result);
    }

    /**
     * Registers a client
     * 
     */
    public async registerTelegramClient(): Promise<void> {
        this.telegramClient = new TelegramClient(async (message: string) => {
            console.log("✉️  Telegram Client: Executing workflow with message: '", message, "'"  );
            const result = await this.workflows.get('default')?.invoke({
                messages: [new HumanMessage(message)]
            });
            const messages = (result as { messages: any[] }).messages;
            const lastMessage = messages[messages.length - 1];

            // Handle empty content when tool_calls are present
            if (!lastMessage || (!lastMessage.content && (!('tool_calls' in lastMessage) || !lastMessage.tool_calls))) {
                return "I'm processing your request, but didn't receive a response yet.";
            }

            // If content is empty but there are tool_calls, the workflow should have executed them
            // This shouldn't happen if ToolNode is properly configured, but handle it gracefully
            if (typeof lastMessage.content === 'string' && lastMessage.content.trim() === '') {
                return "I'm still processing your request. Please try again in a moment.";
            }

            return typeof lastMessage.content === 'string' 
                ? lastMessage.content 
                : JSON.stringify(lastMessage.content);
        });
        await this.telegramClient.start();
    }

    /**
     * Creates an MCP server
     * 
     */
    public async createMCPServer(port: number): Promise<void> {
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
            port
        );

        await this.mcpServer.start();
    }


    /**
     * Creates an A2A server
     * 
     */
    public async createA2AServer(port: number, enablePayment?: boolean): Promise<void> {
        this.a2aServer = new A2AServer(async (prompt: string) => {
            console.log("✉️  A2A Server: Executing workflow with prompt: '", prompt, "'");

            const result = await this.workflows.get('a2a')?.invoke({
                messages: [new HumanMessage(prompt)]
            });
            
            // Extraire le dernier message de la réponse
            const messages = (result as { messages: any[] }).messages;
            const lastMessage = messages[messages.length - 1];
            
            // Retourner le contenu du message sous forme de string
            return typeof lastMessage.content === 'string' 
                ? lastMessage.content 
                : JSON.stringify(lastMessage.content);
        }, port, enablePayment);

        await this.a2aServer.start();
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

}
