import express, { Express, Request, Response } from "express";
import {
    Task,
    TaskState,
    TaskStatus,
    JSONRPCRequest,
    JSONRPCResponse,
    JSONRPCError,
    MessageSendParams,
    TaskQueryParams,
    ListTasksParams,
    ListTasksResult,
    TaskIdParams,
    A2AErrorCode,
} from "./A2ATypes";
import { Message, Part, Artifact, TextPart } from "../interfaces";
import { paymentMiddleware } from "x402-express";
import { Server } from "../interfaces";

/**
 * A2A Server that exposes a LangGraph workflow as an A2A service.
 * The server can be accessed via A2A clients from other agents.
 */
export class A2AServer implements Server {
    private expressApp: Express | null = null;
    private executeWorkflow: (prompt: string) => Promise<string>;
    private port: number;
    private enablePayment: boolean;
    private tasks: Map<string, Task> = new Map();
    private taskIdCounter: number = 1;

    constructor(
        executeWorkflow: (prompt: string) => Promise<string>, 
        port: number,
        enablePayment?: boolean
    ) {
        this.executeWorkflow = executeWorkflow;
        this.port = port;
        this.enablePayment = enablePayment ?? (process.env.A2A_REQUIRE_PAYMENT === 'true');
    }

    /**
     * Starts the A2A server
     */
    public async start(): Promise<void> {
        if (this.expressApp) {
            console.warn('A2A Server is already running');
            return;
        }

        // Set up Express server
        this.expressApp = express();
        this.expressApp.use(express.json());

        this.registerRoutes();

        this.expressApp.listen(this.port, () => {
            console.log(`🚀 A2A server running on http://localhost:${this.port}/a2a/v1`);
        }).on('error', (error) => {
            console.error('A2A Server error:', error);
            process.exit(1);
        });
    }

    /**
     * Registers routes for the A2A server
     * Implements A2A Protocol Specification v0.3.0
     */
    private registerRoutes(): void {
        if (!this.expressApp) return;

        // Appliquer le middleware de paiement uniquement si activé
        if (this.enablePayment) {
            this.expressApp.use(paymentMiddleware(
                "0x224b11F0747c7688a10aCC15F785354aA6493ED6",
                {
                  "/a2a/v1/message/send": {
                    price: "$0.10",
                    network: "base-sepolia",
                    config: {
                      description: "Access to premium content",
                    }
                  }
                }
            ));
        }
        // JSON-RPC 2.0 endpoint (single endpoint for all methods)
        this.expressApp.post('/a2a/v1', this.handleJSONRPC.bind(this));

        // HTTP+JSON/REST endpoints
        // Core methods (MUST implement)
        this.expressApp.post('/a2a/v1/message/send', this.handleMessageSend.bind(this));
        this.expressApp.get('/a2a/v1/tasks/:taskId', this.handleTaskGet.bind(this));
        this.expressApp.post('/a2a/v1/tasks/:taskId/cancel', this.handleTaskCancel.bind(this));

        // Optional methods
        this.expressApp.get('/a2a/v1/tasks', this.handleTasksList.bind(this));
        this.expressApp.post('/a2a/v1/message/stream', this.handleMessageStream.bind(this));
        this.expressApp.post('/a2a/v1/tasks/:taskId/resubscribe', this.handleTaskResubscribe.bind(this));
        this.expressApp.get('/a2a/v1/agent/getAuthenticatedExtendedCard', this.handleGetAuthenticatedExtendedCard.bind(this));

        // Push notification config endpoints (optional)
        this.expressApp.post('/a2a/v1/tasks/:taskId/pushNotificationConfig/set', this.handlePushNotificationConfigSet.bind(this));
        this.expressApp.get('/a2a/v1/tasks/:taskId/pushNotificationConfig/get', this.handlePushNotificationConfigGet.bind(this));
        this.expressApp.get('/a2a/v1/tasks/:taskId/pushNotificationConfig/list', this.handlePushNotificationConfigList.bind(this));
        this.expressApp.delete('/a2a/v1/tasks/:taskId/pushNotificationConfig/delete', this.handlePushNotificationConfigDelete.bind(this));
    }

    /**
     * Handles JSON-RPC 2.0 requests
     */
    private async handleJSONRPC(req: Request, res: Response): Promise<void> {
        try {
            const request: JSONRPCRequest = req.body;

            // Validate JSON-RPC request
            if (request.jsonrpc !== "2.0" || !request.method) {
                const error: JSONRPCError = {
                    code: A2AErrorCode.INVALID_REQUEST,
                    message: "Invalid JSON-RPC request",
                };
                res.status(400).json({
                    jsonrpc: "2.0",
                    id: request.id || null,
                    error,
                });
                return;
            }

            let result: any;
            const method = request.method;

            // Route to appropriate handler
            switch (method) {
                case 'message/send':
                    result = await this.processMessageSend(request.params as MessageSendParams);
                    break;
                case 'tasks/get':
                    result = await this.processTaskGet(request.params as TaskQueryParams);
                    break;
                case 'tasks/cancel':
                    result = await this.processTaskCancel(request.params as TaskIdParams);
                    break;
                case 'tasks/list':
                    result = await this.processTasksList(request.params as ListTasksParams);
                    break;
                case 'message/stream':
                    // Streaming is handled differently
                    res.status(501).json({
                        jsonrpc: "2.0",
                        id: request.id,
                        error: {
                            code: A2AErrorCode.METHOD_NOT_FOUND,
                            message: "Streaming not yet implemented",
                        },
                    });
                    return;
                case 'tasks/resubscribe':
                    res.status(501).json({
                        jsonrpc: "2.0",
                        id: request.id,
                        error: {
                            code: A2AErrorCode.METHOD_NOT_FOUND,
                            message: "Resubscribe not yet implemented",
                        },
                    });
                    return;
                case 'agent/getAuthenticatedExtendedCard':
                    result = await this.processGetAuthenticatedExtendedCard();
                    break;
                default:
                    res.status(404).json({
                        jsonrpc: "2.0",
                        id: request.id,
                        error: {
                            code: A2AErrorCode.METHOD_NOT_FOUND,
                            message: `Method not found: ${method}`,
                        },
                    });
                    return;
            }

            const response: JSONRPCResponse = {
                jsonrpc: "2.0",
                id: request.id,
                result,
            };

            res.json(response);
        } catch (error) {
            // Determine appropriate error code based on error message
            let errorCode = A2AErrorCode.INTERNAL_ERROR;
            let statusCode = 500;
            
            if (error instanceof Error) {
                const message = error.message.toLowerCase();
                if (message.includes('not found')) {
                    errorCode = A2AErrorCode.TASK_NOT_FOUND;
                    statusCode = 404;
                } else if (message.includes('required') || message.includes('invalid')) {
                    errorCode = A2AErrorCode.INVALID_PARAMS;
                    statusCode = 400;
                } else if (message.includes('already completed')) {
                    errorCode = A2AErrorCode.TASK_ALREADY_COMPLETED;
                    statusCode = 400;
                } else if (message.includes('already cancelled')) {
                    errorCode = A2AErrorCode.TASK_ALREADY_CANCELLED;
                    statusCode = 400;
                }
            }

            const errorResponse: JSONRPCResponse = {
                jsonrpc: "2.0",
                id: req.body?.id || null,
                error: {
                    code: errorCode,
                    message: error instanceof Error ? error.message : String(error),
                },
            };
            res.status(statusCode).json(errorResponse);
        }
    }

    /**
     * HTTP+JSON/REST handler for message/send
     */
    private async handleMessageSend(req: Request, res: Response): Promise<void> {
        try {
            const params: MessageSendParams = req.body;
            const result = await this.processMessageSend(params);
            res.json(result);
        } catch (error) {
            res.status(500).json({
                error: {
                    code: A2AErrorCode.INTERNAL_ERROR,
                    message: error instanceof Error ? error.message : String(error),
                },
            });
        }
    }

    /**
     * HTTP+JSON/REST handler for tasks/get
     */
    private async handleTaskGet(req: Request, res: Response): Promise<void> {
        try {
            const taskId = req.params.taskId;
            if (!taskId) {
                res.status(400).json({
                    error: {
                        code: A2AErrorCode.INVALID_PARAMS,
                        message: "taskId is required",
                    },
                });
                return;
            }
            const params: TaskQueryParams = { taskId };
            const result = await this.processTaskGet(params);
            res.json(result);
        } catch (error) {
            if (error instanceof Error && error.message.includes('not found')) {
                res.status(404).json({
                    error: {
                        code: A2AErrorCode.TASK_NOT_FOUND,
                        message: error.message,
                    },
                });
            } else {
                res.status(500).json({
                    error: {
                        code: A2AErrorCode.INTERNAL_ERROR,
                        message: error instanceof Error ? error.message : String(error),
                    },
                });
            }
        }
    }

    /**
     * HTTP+JSON/REST handler for tasks/cancel
     */
    private async handleTaskCancel(req: Request, res: Response): Promise<void> {
        try {
            const taskId = req.params.taskId;
            if (!taskId) {
                res.status(400).json({
                    error: {
                        code: A2AErrorCode.INVALID_PARAMS,
                        message: "taskId is required",
                    },
                });
                return;
            }
            const params: TaskIdParams = { taskId };
            const result = await this.processTaskCancel(params);
            res.json(result);
        } catch (error) {
            if (error instanceof Error && error.message.includes('not found')) {
                res.status(404).json({
                    error: {
                        code: A2AErrorCode.TASK_NOT_FOUND,
                        message: error.message,
                    },
                });
            } else {
                res.status(500).json({
                    error: {
                        code: A2AErrorCode.INTERNAL_ERROR,
                        message: error instanceof Error ? error.message : String(error),
                    },
                });
            }
        }
    }

    /**
     * HTTP+JSON/REST handler for tasks/list
     */
    private async handleTasksList(req: Request, res: Response): Promise<void> {
        try {
            const params: ListTasksParams = {};
            if (req.query.limit) {
                params.limit = parseInt(req.query.limit as string, 10);
            }
            if (req.query.cursor) {
                params.cursor = req.query.cursor as string;
            }
            if (req.query.state) {
                params.state = req.query.state as TaskState;
            }
            const result = await this.processTasksList(params);
            res.json(result);
        } catch (error) {
            res.status(500).json({
                error: {
                    code: A2AErrorCode.INTERNAL_ERROR,
                    message: error instanceof Error ? error.message : String(error),
                },
            });
        }
    }

    /**
     * HTTP+JSON/REST handler for message/stream (SSE)
     */
    private async handleMessageStream(req: Request, res: Response): Promise<void> {
        res.status(501).json({
            error: {
                code: A2AErrorCode.METHOD_NOT_FOUND,
                message: "Streaming not yet implemented",
            },
        });
    }

    /**
     * HTTP+JSON/REST handler for tasks/resubscribe
     */
    private async handleTaskResubscribe(req: Request, res: Response): Promise<void> {
        res.status(501).json({
            error: {
                code: A2AErrorCode.METHOD_NOT_FOUND,
                message: "Resubscribe not yet implemented",
            },
        });
    }

    /**
     * HTTP+JSON/REST handler for agent/getAuthenticatedExtendedCard
     */
    private async handleGetAuthenticatedExtendedCard(req: Request, res: Response): Promise<void> {
        try {
            const result = await this.processGetAuthenticatedExtendedCard();
            res.json(result);
        } catch (error) {
            res.status(500).json({
                error: {
                    code: A2AErrorCode.INTERNAL_ERROR,
                    message: error instanceof Error ? error.message : String(error),
                },
            });
        }
    }

    /**
     * Push notification config handlers (stubs for now)
     */
    private async handlePushNotificationConfigSet(req: Request, res: Response): Promise<void> {
        res.status(501).json({ error: { message: "Push notifications not yet implemented" } });
    }

    private async handlePushNotificationConfigGet(req: Request, res: Response): Promise<void> {
        res.status(501).json({ error: { message: "Push notifications not yet implemented" } });
    }

    private async handlePushNotificationConfigList(req: Request, res: Response): Promise<void> {
        res.status(501).json({ error: { message: "Push notifications not yet implemented" } });
    }

    private async handlePushNotificationConfigDelete(req: Request, res: Response): Promise<void> {
        res.status(501).json({ error: { message: "Push notifications not yet implemented" } });
    }

    /**
     * Process message/send - Core method
     */
    private async processMessageSend(params: MessageSendParams): Promise<{ taskId: string }> {
        if (!params.message) {
            throw new Error("Message is required");
        }

        const taskId = params.taskId || this.generateTaskId();
        const now = new Date().toISOString();

        // Extract text from message parts
        const textParts = params.message.parts.filter((p): p is TextPart => p.type === "text");
        const prompt = textParts.map(p => p.text).join("\n");

        // Create task with pending state
        const task: Task = {
            taskId,
            status: {
                taskId,
                state: TaskState.PENDING,
                messages: [params.message],
            },
            createdAt: now,
            updatedAt: now,
        };

        this.tasks.set(taskId, task);

        // Execute workflow asynchronously
        this.executeTaskAsync(taskId, prompt);

        return { taskId };
    }

    /**
     * Process tasks/get - Core method
     */
    private async processTaskGet(params: TaskQueryParams): Promise<Task> {
        if (!params.taskId) {
            throw new Error("taskId is required");
        }

        const task = this.tasks.get(params.taskId);
        if (!task) {
            throw new Error(`Task ${params.taskId} not found`);
        }

        return task;
    }

    /**
     * Process tasks/cancel - Core method
     */
    private async processTaskCancel(params: TaskIdParams): Promise<{ taskId: string; cancelled: boolean }> {
        if (!params.taskId) {
            throw new Error("taskId is required");
        }

        const task = this.tasks.get(params.taskId);
        if (!task) {
            throw new Error(`Task ${params.taskId} not found`);
        }

        if (task.status.state === TaskState.COMPLETED) {
            throw new Error("Cannot cancel a completed task");
        }

        if (task.status.state === TaskState.CANCELLED) {
            return { taskId: params.taskId, cancelled: true };
        }

        task.status.state = TaskState.CANCELLED;
        task.status.message = "Task cancelled by client";
        task.updatedAt = new Date().toISOString();

        return { taskId: params.taskId, cancelled: true };
    }

    /**
     * Process tasks/list - Optional method
     */
    private async processTasksList(params: ListTasksParams): Promise<ListTasksResult> {
        let tasks = Array.from(this.tasks.values());

        // Filter by state if provided
        if (params.state) {
            tasks = tasks.filter(t => t.status.state === params.state);
        }

        // Sort by creation date (newest first)
        tasks.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

        // Apply limit
        const limit = params.limit || 50;
        const limitedTasks = tasks.slice(0, limit);

        return {
            tasks: limitedTasks,
            hasMore: tasks.length > limit,
        };
    }

    /**
     * Process agent/getAuthenticatedExtendedCard - Optional method
     */
    private async processGetAuthenticatedExtendedCard(): Promise<any> {
        // Return basic agent card info
        // In a real implementation, this would return extended information
        // based on authentication
        return {
            message: "Authenticated extended card not yet fully implemented",
            // This would typically return an extended AgentCard
        };
    }

    /**
     * Execute task asynchronously
     */
    private async executeTaskAsync(taskId: string, prompt: string): Promise<void> {
        const task = this.tasks.get(taskId);
        if (!task) return;

        try {
            task.status.state = TaskState.RUNNING;
            task.updatedAt = new Date().toISOString();

            const result = await this.executeWorkflow(prompt);

            // Create artifact from result
            const artifact: Artifact = {
                id: `artifact-${taskId}-${Date.now()}`,
                type: "text",
                mimeType: "text/plain",
                data: result,
            };

            task.status.state = TaskState.COMPLETED;
            task.status.artifacts = [artifact];
            task.status.messages = [
                ...(task.status.messages || []),
                {
                    role: "assistant",
                    parts: [{ type: "text", text: result }],
                    timestamp: new Date().toISOString(),
                },
            ];
            task.updatedAt = new Date().toISOString();
        } catch (error) {
            task.status.state = TaskState.FAILED;
            task.status.error = {
                code: A2AErrorCode.INTERNAL_ERROR,
                message: error instanceof Error ? error.message : String(error),
            };
            task.updatedAt = new Date().toISOString();
        }
    }

    /**
     * Generate a unique task ID
     */
    private generateTaskId(): string {
        return `task-${Date.now()}-${this.taskIdCounter++}`;
    }

    /**
     * Stops the A2A server
     */
    public async stop(): Promise<void> {
        if (this.expressApp) {
            this.expressApp = null;
        }
    }

    /**
     * Checks if the server is currently running
     */
    public isRunning(): boolean {
        return this.expressApp !== null;
    }
}

