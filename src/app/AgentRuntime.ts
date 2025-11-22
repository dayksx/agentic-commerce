import { StateGraph, START, END, MessagesAnnotation } from "@langchain/langgraph";
import { HumanMessage } from "@langchain/core/messages";
import { ToolNode } from "@langchain/langgraph/prebuilt";

import { mockModel } from "./models/mockModel.js";

import { AgentCardServer } from "./servers/AgentCardServer.js";
import { MCPServer } from "./servers/MCPServer.js";
import { AgentCardConfig } from "./config/AgentCardConfig.js";

import { mockTool } from "./tools/index.js";

export type WorkflowId = 'mcp' | string;
export type Workflow = any

export class AgentRuntime {

    private agentCardServer: AgentCardServer | null = null;
    private mcpServer: MCPServer | null = null;
    private workflows: Map<WorkflowId, Workflow> = new Map();

    constructor() {
        this.workflows.set('default', this.defineDefaultWorkflow());
        this.workflows.set('mcp', this.defineMCPWorkflow());
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
        const tools = [mockTool] as any;
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

        const tools = [mockTool] as any;
        const toolNode = new ToolNode(tools);

        return new StateGraph(MessagesAnnotation)
            .addNode("eip8004Model", mockModel)
            .addNode("toolNode", toolNode)
            .addEdge(START, "eip8004Model")
            .addConditionalEdges("eip8004Model", this.shouldContinueToToolNode)
            .addEdge("toolNode", "eip8004Model")
            .addEdge("eip8004Model", END)
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

}
