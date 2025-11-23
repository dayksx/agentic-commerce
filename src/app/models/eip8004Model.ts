import { ChatOpenAI } from "@langchain/openai";
import { LLMModel } from "./interfaces";
import { MessagesAnnotation } from "@langchain/langgraph";
import { AIMessage } from "langchain";
import { eip8004Search } from "../tools";

/**
 * EIP-8004 LLM node implementation
 * Lists agent identity NFTs from EIP-8004 identity registry ERC721
 */
export const eip8004Model: LLMModel = async (state: typeof MessagesAnnotation.State) => {
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) throw new Error("OPENAI_API_KEY environment variable is not set");

    const llm = new ChatOpenAI({
        model: "gpt-4o-mini",
        apiKey: apiKey,
    });

    const tools = [eip8004Search] as any;
    const llmWithTools = llm.bindTools(tools);
    const response = await llmWithTools.invoke(state.messages)
    return { messages: [response as AIMessage] };
};

