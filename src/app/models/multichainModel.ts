import { ChatOpenAI } from "@langchain/openai";
import { Model } from "../interfaces";
import { MessagesAnnotation } from "@langchain/langgraph";
import { AIMessage } from "langchain";
import { multichainTool } from "../tools";
import { z } from "zod";

const ChainInfo = z.object({
    chainId: z.string(),
    chainName: z.string(),
    contractAddress: z.string(),
    tokenSymbol: z.string(),
});

/**
 * Multichain LLM node implementation
 * Uses GPT-4o-mini model for chat completions
 */
export const multichainModel: Model = async (state: typeof MessagesAnnotation.State) => {
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) throw new Error("OPENAI_API_KEY environment variable is not set");

    const llm = new ChatOpenAI({
        model: "gpt-4o-mini",
        apiKey: apiKey,
    });

    // Obtenir la réponse normale avec les outils pour le workflow
    const tools = [multichainTool] as any;
    const llmWithTools = llm.bindTools(tools);
    const response = await llmWithTools.invoke(state.messages);

    // Obtenir une réponse structurée pour le log (appel séparé)
    try {
        // @ts-expect-error - Type instantiation depth issue with LangChain types
        const modelWithStructure = llm.withStructuredOutput(ChainInfo, { method: "json_schema" });
        const responseWithStructure = await modelWithStructure.invoke(state.messages);
        console.log("Response with structure:", responseWithStructure);
    } catch (error) {
        // Si l'extraction structurée échoue, on continue quand même
        console.warn("Failed to extract structured output:", error);
    }
    
    return { messages: [response as AIMessage] };
};
