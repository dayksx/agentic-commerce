import { MessagesAnnotation } from "@langchain/langgraph";

/**
 * Common interface for LLM node implementations
 * All LLM nodes must implement this interface to ensure compatibility
 */
export interface Model {
    /**
     * Processes messages using the LLM and returns updated messages
     * @param state - The current state containing messages
     * @returns Updated state with new messages from the LLM
     */
    (state: typeof MessagesAnnotation.State): Promise<{ messages: typeof MessagesAnnotation.State.messages }>;
}

/**
 * Common interface for server implementations
 * All servers must implement this interface to ensure compatibility
 */
export interface Server {
    /**
     * Starts the server
     * @returns Promise that resolves when the server has started
     */
    start(): Promise<void>;

    /**
     * Stops the server
     * @returns Promise that resolves when the server has stopped
     */
    stop(): Promise<void>;

    /**
     * Checks if the server is currently running
     * @returns true if the server is running, false otherwise
     */
    isRunning(): boolean;
}
