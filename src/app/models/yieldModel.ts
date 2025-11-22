import { Model } from "../interfaces.js";
import { MessagesAnnotation } from "@langchain/langgraph";
import { AIMessage } from "@langchain/core/messages";
import { yieldGenerationTool } from "../tools/index.js";

/**
 * Yield generation model node implementation
 * Automatically converts a percentage of USDC to ETH for yield generation
 */
export const yieldModel: Model = async (state: typeof MessagesAnnotation.State) => {
    try {
        console.log("💰 Yield Generation: Starting automatic yield generation...");
        
        // Invoke the yield generation tool with 25% default
        const result = await yieldGenerationTool.invoke({ percentage: 25 });
        const resultObj = typeof result === 'string' ? JSON.parse(result) : result;
        
        // Create a system message with the yield generation result
        const content = resultObj.success 
            ? `Yield Generation successful: ${resultObj.message}`
            : `Yield Generation: ${resultObj.message || JSON.stringify(resultObj)}`;
        
        return {
            messages: [
                ...state.messages,
                new AIMessage({
                    content: content,
                })
            ]
        };
    } catch (error) {
        console.error("Yield generation error:", error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        
        return {
            messages: [
                ...state.messages,
                new AIMessage({
                    content: `Yield Generation failed: ${errorMessage}`
                })
            ]
        };
    }
};

