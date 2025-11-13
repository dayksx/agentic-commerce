import { ChatOpenAI } from "@langchain/openai";
import { Model } from "../interfaces";
import { MessagesAnnotation } from "@langchain/langgraph";
import { AIMessage, SystemMessage } from "@langchain/core/messages";
import { TavilySearch } from "@langchain/tavily";
import { getMainPrePrompt } from "../config/ModelConfig";

/**
 * Default node-specific pre-prompt for the chat model
 * Can be overridden via CHAT_MODEL_PRE_PROMPT environment variable
 */
const DEFAULT_CHAT_MODEL_PRE_PROMPT = "You’re a witty and mischievous conversationalist who loves to keep chats lively. You make clever, funny, and slightly spicy jokes — always playful, never mean. You challenge your interlocutors with humor, sarcasm, and confidence, making them think or laugh at the same time. You’re bold, cheeky, and charismatic, but you know how to stay on the right side of good taste. Every reply should feel like it comes from a sharp, entertaining friend who’s impossible to bore.";

/**
 * OpenAI LLM node implementation
 * Uses GPT-4o-mini model for chat completions
 * Includes main pre-prompt (shared across models) and node-specific pre-prompt
 */
export const chatModel: Model = async (state: typeof MessagesAnnotation.State) => {
    const apiKey = process.env.OPENAI_API_KEY;
    
    if (!apiKey) throw new Error("OPENAI_API_KEY environment variable is not set");

    const llm = new ChatOpenAI({
        model: "gpt-4o-mini",
        apiKey: apiKey,
    });

    // Get main pre-prompt (shared across all models)
    const mainPrePrompt = getMainPrePrompt();
    
    // Get node-specific pre-prompt from environment or use default
    const nodePrePrompt = process.env.CHAT_MODEL_PRE_PROMPT || DEFAULT_CHAT_MODEL_PRE_PROMPT;

    // Combine pre-prompts: main first, then node-specific
    const combinedPrePrompt = `${mainPrePrompt}\n\n${nodePrePrompt}`;

    // Check if a system message already exists in the messages
    const hasSystemMessage = state.messages.some(
        (msg) => msg instanceof SystemMessage || (msg as any).getType?.() === "system"
    );

    // Prepend combined pre-prompt as system message if it doesn't already exist
    // This follows LangGraph best practice of maintaining message history
    const messagesWithPrePrompt = hasSystemMessage
        ? state.messages
        : [new SystemMessage(combinedPrePrompt), ...state.messages];

    const tools = [new TavilySearch({ maxResults: 3 })] as any;
    const llmWithTools = llm.bindTools(tools);
    const response = await llmWithTools.invoke(messagesWithPrePrompt);
    return { messages: [response as AIMessage] };
};

