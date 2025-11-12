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
 * Common interface for client implementations
 * All clients must implement this interface to ensure compatibility
 */
export interface Client {
    /**
     * Starts the client
     * @returns Promise that resolves when the client has started
     */
    start(): Promise<void>;

    /**
     * Stops the client
     * @returns Promise that resolves when the client has stopped
     */
    stop(): Promise<void>;

    /**
     * Checks if the client is currently running
     * @returns true if the client is running, false otherwise
     */
    isRunning(): boolean;
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

/**
 * TextPart represents a text content part in a message
 */
export interface TextPart {
    type: "text";
    text: string;
}

/**
 * FilePart represents a file reference in a message
 */
export interface FilePart {
    type: "file";
    file: FileBase;
}

/**
 * DataPart represents structured data (JSON) in a message
 */
export interface DataPart {
    type: "data";
    data: any;
    mimeType?: string;
}

/**
 * Part is a union type representing different message parts
 */
export type Part = TextPart | FilePart | DataPart;

/**
 * FileBase represents a file reference
 */
export interface FileBase {
    name: string;
    mimeType?: string;
    size?: number;
}

/**
 * FileWithBytes represents a file with inline bytes
 */
export interface FileWithBytes extends FileBase {
    bytes: string; // Base64-encoded
}

/**
 * FileWithUri represents a file with a URI reference
 */
export interface FileWithUri extends FileBase {
    uri: string;
}

/**
 * Message represents a message in a conversation
 */
export interface Message {
    role: "user" | "assistant" | "system";
    parts: Part[];
    timestamp?: string;
}

/**
 * Artifact represents a result or output from a task
 */
export interface Artifact {
    id: string;
    type: string;
    mimeType?: string;
    data?: any;
    uri?: string;
    metadata?: { [key: string]: any };
}

