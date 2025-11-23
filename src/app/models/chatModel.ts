import { ChatOpenAI } from "@langchain/openai";
import { LLMModel } from "./interfaces";
import { MessagesAnnotation } from "@langchain/langgraph";
import { AIMessage } from "langchain";
import { TavilySearch } from "@langchain/tavily";

/**
 * OpenAI LLM node implementation
 * Uses GPT-4o-mini model for chat completions
 */
export const chatModel: LLMModel = async (state: typeof MessagesAnnotation.State) => {
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) throw new Error("OPENAI_API_KEY environment variable is not set");

    const llm = new ChatOpenAI({
        model: "gpt-4o-mini",
        apiKey: apiKey,
    });

    const tools = [new TavilySearch({ maxResults: 3 })] as any;
    const llmWithTools = llm.bindTools(tools);
    const response = await llmWithTools.invoke(state.messages)
    return { messages: [response as AIMessage] };
};

