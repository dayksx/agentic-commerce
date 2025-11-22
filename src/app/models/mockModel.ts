import { ChatOpenAI } from "@langchain/openai";
import { Model } from "../interfaces.js";
import { MessagesAnnotation } from "@langchain/langgraph";
import { AIMessage } from "@langchain/core/messages";
import { bazarTool, mockTool, agentSearchTool } from "../tools/index.js";

/**
 * Mock LLM node implementation
 * Uses GPT-4o-mini model for chat completions
 */
export const mockModel: Model = async (state: typeof MessagesAnnotation.State) => {
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) throw new Error("OPENAI_API_KEY environment variable is not set");

    const llm = new ChatOpenAI({
        model: "gpt-4o-mini",
        apiKey: apiKey,
    });

    const tools = [mockTool, bazarTool, agentSearchTool] as any;
    const llmWithTools = llm.bindTools(tools);
    const response = await llmWithTools.invoke(state.messages)
    return { messages: [response as AIMessage] };
};

