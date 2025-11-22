import express, { Express } from 'express';
import { Server } from 'http';

/**
 * Supported A2A transport protocols.
 */
export enum TransportProtocol {
  JSONRPC = "JSONRPC",
  GRPC = "GRPC",
  HTTP_JSON = "HTTP+JSON",
}

/**
 * Represents the service provider of an agent.
 */
export interface AgentProvider {
  /** The name of the agent provider's organization. */
  organization: string;
  /** A URL for the agent provider's website or relevant documentation. */
  url: string;
}

/**
 * A declaration of a protocol extension supported by an Agent.
 */
export interface AgentExtension {
  /** The unique URI identifying the extension. */
  uri: string;
  /** A human-readable description of how this agent uses the extension. */
  description?: string;
  /**
   * If true, the client must understand and comply with the extension's requirements
   * to interact with the agent.
   */
  required?: boolean;
  /** Optional, extension-specific configuration parameters. */
  params?: { [key: string]: any };
}

/**
 * Defines optional capabilities supported by an agent.
 */
export interface AgentCapabilities {
  /** Indicates if the agent supports Server-Sent Events (SSE) for streaming responses. */
  streaming?: boolean;
  /** Indicates if the agent supports sending push notifications for asynchronous task updates. */
  pushNotifications?: boolean;
  /** Indicates if the agent provides a history of state transitions for a task. */
  stateTransitionHistory?: boolean;
  /** A list of protocol extensions supported by the agent. */
  extensions?: AgentExtension[];
}

/**
 * Declares a combination of a target URL and a transport protocol for interacting with the agent.
 */
export interface AgentInterface {
  /**
   * The URL where this interface is available. Must be a valid absolute HTTPS URL in production.
   */
  url: string;
  /**
   * The transport protocol supported at this URL.
   */
  transport: TransportProtocol | string;
}

/**
 * Represents a distinct capability or function that an agent can perform.
 */
export interface AgentSkill {
  /** A unique identifier for the agent's skill. */
  id: string;
  /** A human-readable name for the skill. */
  name: string;
  /**
   * A detailed description of the skill, intended to help clients or users
   * understand its purpose and functionality.
   */
  description: string;
  /**
   * A set of keywords describing the skill's capabilities.
   */
  tags: string[];
  /**
   * Example prompts or scenarios that this skill can handle. Provides a hint to
   * the client on how to use the skill.
   */
  examples?: string[];
  /**
   * The set of supported input MIME types for this skill, overriding the agent's defaults.
   */
  inputModes?: string[];
  /**
   * The set of supported output MIME types for this skill, overriding the agent's defaults.
   */
  outputModes?: string[];
  /**
   * Security schemes necessary for the agent to leverage this skill.
   */
  security?: { [scheme: string]: string[] }[];
}

/**
 * Security scheme types for authentication
 */
export type SecurityScheme =
  | APIKeySecurityScheme
  | HTTPAuthSecurityScheme
  | OAuth2SecurityScheme
  | OpenIdConnectSecurityScheme
  | MutualTLSSecurityScheme;

export interface APIKeySecurityScheme {
  type: "apiKey";
  name: string;
  in: "query" | "header" | "cookie";
  description?: string;
}

export interface HTTPAuthSecurityScheme {
  type: "http";
  scheme: string;
  bearerFormat?: string;
  description?: string;
}

export interface OAuth2SecurityScheme {
  type: "oauth2";
  flows: {
    authorizationCode?: {
      authorizationUrl: string;
      tokenUrl: string;
      scopes: { [key: string]: string };
    };
    implicit?: {
      authorizationUrl: string;
      scopes: { [key: string]: string };
    };
    password?: {
      tokenUrl: string;
      scopes: { [key: string]: string };
    };
    clientCredentials?: {
      tokenUrl: string;
      scopes: { [key: string]: string };
    };
  };
  description?: string;
}

export interface OpenIdConnectSecurityScheme {
  type: "openIdConnect";
  openIdConnectUrl: string;
  description?: string;
}

export interface MutualTLSSecurityScheme {
  type: "mutualTLS";
  description?: string;
}

/**
 * AgentCardSignature represents a JWS signature of an AgentCard.
 */
export interface AgentCardSignature {
  /**
   * The protected JWS header for the signature. This is a Base64url-encoded
   * JSON object, as per RFC 7515.
   */
  protected: string;
  /** The computed signature, Base64url-encoded. */
  signature: string;
  /** The unprotected JWS header values. */
  header?: { [key: string]: any };
}

/**
 * The AgentCard is a self-describing manifest for an agent. It provides essential
 * metadata including the agent's identity, capabilities, skills, supported
 * communication methods, and security requirements.
 */
export interface AgentCard {
  /**
   * The version of the A2A protocol this agent supports.
   * @default "0.3.0"
   */
  protocolVersion: string;
  /**
   * A human-readable name for the agent.
   */
  name: string;
  /**
   * A human-readable description of the agent, assisting users and other agents
   * in understanding its purpose.
   */
  description: string;
  /**
   * The preferred endpoint URL for interacting with the agent.
   * This URL MUST support the transport specified by 'preferredTransport'.
   */
  url: string;
  /**
   * The transport protocol for the preferred endpoint (the main 'url' field).
   * If not specified, defaults to 'JSONRPC'.
   */
  preferredTransport?: TransportProtocol | string;
  /**
   * A list of additional supported interfaces (transport and URL combinations).
   */
  additionalInterfaces?: AgentInterface[];
  /** An optional URL to an icon for the agent. */
  iconUrl?: string;
  /** Information about the agent's service provider. */
  provider?: AgentProvider;
  /**
   * The agent's own version number. The format is defined by the provider.
   */
  version: string;
  /** An optional URL to the agent's documentation. */
  documentationUrl?: string;
  /** A declaration of optional capabilities supported by the agent. */
  capabilities: AgentCapabilities;
  /**
   * A declaration of the security schemes available to authorize requests.
   */
  securitySchemes?: { [scheme: string]: SecurityScheme };
  /**
   * A list of security requirement objects that apply to all agent interactions.
   */
  security?: { [scheme: string]: string[] }[];
  /**
   * Default set of supported input MIME types for all skills.
   */
  defaultInputModes: string[];
  /**
   * Default set of supported output MIME types for all skills.
   */
  defaultOutputModes: string[];
  /** The set of skills, or distinct capabilities, that the agent can perform. */
  skills: AgentSkill[];
  /**
   * If true, the agent can provide an extended agent card with additional details
   * to authenticated users. Defaults to false.
   */
  supportsAuthenticatedExtendedCard?: boolean;
  /** JSON Web Signatures computed for this AgentCard. */
  signatures?: AgentCardSignature[];
}

/**
 * Configuration for the Agent Card Server
 */
export interface AgentCardServerConfig {
    port?: number;
    hostname?: string;
    path?: string;
    agentCard: AgentCard;
    onServerStart?: (port: number, hostname: string) => void;
    onServerError?: (error: Error) => void;
}

/**
 * Reusable server class for serving Agent Cards at well-known URI
 * Follows RFC 8615 for well-known URIs
 */
export class AgentCardServer {
    private expressApp: Express | null = null;
    private server: Server | null = null;
    private config: Required<Pick<AgentCardServerConfig, 'port' | 'hostname' | 'path'>> & {
        agentCard: AgentCard;
        onServerStart?: (port: number, hostname: string) => void;
        onServerError?: (error: Error) => void;
    };

    constructor(config: AgentCardServerConfig) {
        this.config = {
            port: config.port || parseInt(process.env.PORT || '3000', 10),
            hostname: config.hostname || 'localhost',
            path: config.path || '/.well-known/agent-card.json',
            agentCard: config.agentCard,
            ...(config.onServerStart !== undefined && { onServerStart: config.onServerStart }),
            ...(config.onServerError !== undefined && { onServerError: config.onServerError }),
        };
    }

    /**
     * Starts the HTTP server to serve the agent card
     */
    public async start(): Promise<void> {
        if (this.expressApp) {
            console.warn('Agent Card Server is already running');
            return;
        }

        // Set up Express server
        this.expressApp = express();

        this.registerRoutes();

        this.server = this.expressApp.listen(this.config.port, () => {
            const address = this.server?.address();
            const hostname = address && typeof address === 'object' 
                ? (address.address === '0.0.0.0' || address.address === '::' ? '0.0.0.0' : address.address)
                : this.config.hostname;
            const port = address && typeof address === 'object' ? address.port : this.config.port;
            const message = `📋 Agent Card available on http://${hostname}:${port}${this.config.path}`;
            console.log(message);
            
            if (this.config.onServerStart) {
                this.config.onServerStart(port, hostname);
            }
        });

        this.server.on('error', (error: Error) => {
            if (this.config.onServerError) {
                this.config.onServerError(error);
            } else {
                console.error('Agent Card Server error:', error);
            }
            process.exit(1);
        });
    }

    /**
     * Registers routes for the Agent Card server
     */
    private registerRoutes(): void {
        if (!this.expressApp) return;

        // Serve the agent card at the configured path
        this.expressApp.get(this.config.path, (req, res) => {
            res.setHeader('Content-Type', 'application/json');
            res.setHeader('Access-Control-Allow-Origin', '*'); // Allow CORS for discovery
            res.json(this.config.agentCard);
        });

        // Handle 404 for other paths
        this.expressApp.use((req, res) => {
            res.status(404).send('Not Found');
        });
    }

    /**
     * Stops the HTTP server
     */
    public stop(): void {
        if (this.server) {
            this.server.close(() => {
                console.log('Agent Card Server stopped');
            });
            this.server = null;
            this.expressApp = null;
        }
    }

    /**
     * Updates the agent card being served
     */
    public updateAgentCard(agentCard: AgentCard): void {
        this.config.agentCard = agentCard;
    }

    /**
     * Gets the current agent card
     */
    public getAgentCard(): AgentCard {
        return this.config.agentCard;
    }

    /**
     * Checks if the server is currently running
     */
    public isRunning(): boolean {
        return this.expressApp !== null;
    }
}
