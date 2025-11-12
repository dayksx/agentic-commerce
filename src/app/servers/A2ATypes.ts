/**
 * A2A Protocol Type Definitions
 * Based on A2A Protocol Specification v0.3.0
 * https://a2a-protocol.org/dev/specification/
 */

import { Message, Artifact } from "../interfaces";

/**
 * TaskState enum represents the current state of a task
 */
export enum TaskState {
  PENDING = "pending",
  RUNNING = "running",
  COMPLETED = "completed",
  FAILED = "failed",
  CANCELLED = "cancelled",
  INPUT_REQUIRED = "input_required",
}

/**
 * TaskStatus represents the status of a task
 */
export interface TaskStatus {
  taskId: string;
  state: TaskState;
  message?: string;
  artifacts?: Artifact[];
  messages?: Message[];
  error?: {
    code: string | number;
    message: string;
    data?: any;
  };
  metadata?: { [key: string]: any };
}

/**
 * Task represents a complete task object
 */
export interface Task {
  taskId: string;
  status: TaskStatus;
  createdAt: string;
  updatedAt: string;
}

/**
 * JSON-RPC 2.0 Request structure
 */
export interface JSONRPCRequest {
  jsonrpc: "2.0";
  id: string | number | null;
  method: string;
  params?: any;
}

/**
 * JSON-RPC 2.0 Response structure
 */
export interface JSONRPCResponse {
  jsonrpc: "2.0";
  id: string | number | null;
  result?: any;
  error?: JSONRPCError;
}

/**
 * JSON-RPC 2.0 Error structure
 */
export interface JSONRPCError {
  code: number;
  message: string;
  data?: any;
}

/**
 * MessageSendParams for message/send method
 */
export interface MessageSendParams {
  message: Message;
  taskId?: string;
  skillId?: string;
  configuration?: MessageSendConfiguration;
}

/**
 * MessageSendConfiguration for message/send
 */
export interface MessageSendConfiguration {
  streaming?: boolean;
  timeout?: number;
  metadata?: { [key: string]: any };
}

/**
 * TaskQueryParams for tasks/get method
 */
export interface TaskQueryParams {
  taskId: string;
}

/**
 * ListTasksParams for tasks/list method
 */
export interface ListTasksParams {
  limit?: number;
  cursor?: string;
  state?: TaskState;
}

/**
 * ListTasksResult for tasks/list response
 */
export interface ListTasksResult {
  tasks: Task[];
  cursor?: string;
  hasMore?: boolean;
}

/**
 * TaskIdParams for tasks/cancel and other methods
 */
export interface TaskIdParams {
  taskId: string;
}

/**
 * A2A Standard Error Codes
 */
export enum A2AErrorCode {
  // Standard JSON-RPC errors
  PARSE_ERROR = -32700,
  INVALID_REQUEST = -32600,
  METHOD_NOT_FOUND = -32601,
  INVALID_PARAMS = -32602,
  INTERNAL_ERROR = -32603,

  // A2A-specific errors
  TASK_NOT_FOUND = -32001,
  TASK_ALREADY_COMPLETED = -32002,
  TASK_ALREADY_CANCELLED = -32003,
  INVALID_MESSAGE_FORMAT = -32004,
  SKILL_NOT_FOUND = -32005,
  AUTHENTICATION_REQUIRED = -32006,
  AUTHORIZATION_FAILED = -32007,
  RATE_LIMIT_EXCEEDED = -32008,
  INVALID_TASK_STATE = -32009,
}

