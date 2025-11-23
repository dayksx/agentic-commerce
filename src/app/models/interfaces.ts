import { MessagesAnnotation } from "@langchain/langgraph";

/**
 * Common interface for LLM node implementations
 * All LLM nodes must implement this interface to ensure compatibility
 */
export interface LLMModel {
    /**
     * Processes messages using the LLM and returns updated messages
     * @param state - The current state containing messages
     * @returns Updated state with new messages from the LLM
     */
    (state: typeof MessagesAnnotation.State): Promise<{ messages: typeof MessagesAnnotation.State.messages }>;
}


