import packageJson from '../../../package.json';
import { AgentCard, AgentCapabilities, AgentSkill, TransportProtocol } from '../servers/AgentCardServer';

/**
 * Configuration options for building an AgentCard
 */
export interface AgentCardConfigOptions {
    port?: number;
    hostname?: string;
    baseUrl?: string;
    name?: string;
    version?: string;
    description?: string;
    streaming?: boolean;
    skills?: AgentSkill[];
    defaultInputModes?: string[];
    defaultOutputModes?: string[];
}

/**
 * Builder class for creating AgentCard configurations
 */
export class AgentCardConfig {
    private static getEnvOrPackageValue(envKey: string, packageValue: string, defaultValue: string): string {
        return process.env[envKey] || packageValue || defaultValue;
    }

    private static getEnvBoolean(envKey: string, defaultValue: boolean = false): boolean {
        const value = process.env[envKey];
        return value === 'true' ? true : value === 'false' ? false : defaultValue;
    }

    /**
     * Builds configuration from environment variables and package.json
     */
    static fromEnvironment(options: Partial<AgentCardConfigOptions> = {}): AgentCardConfigOptions {
        const port = options.port ?? parseInt(process.env.PORT || '3000', 10);
        const hostname = options.hostname || process.env.AGENT_HOSTNAME || '0.0.0.0';
        const protocol = hostname === '0.0.0.0' ? 'http' : 'https';
        const baseUrl = options.baseUrl || process.env.AGENT_URL || `${protocol}://${hostname}:${port}`;

        const config: AgentCardConfigOptions = {
            port,
            hostname,
            baseUrl,
            name: options.name || this.getEnvOrPackageValue('AGENT_NAME', packageJson.name, 'basic-agent'),
            version: options.version || this.getEnvOrPackageValue('AGENT_VERSION', packageJson.version, '1.0.0'),
            description: options.description || 
                this.getEnvOrPackageValue(
                    'AGENT_DESCRIPTION', 
                    packageJson.description || '', 
                    'A basic LangGraph agent using OpenAI for conversational AI capabilities'
                ),
            streaming: options.streaming ?? this.getEnvBoolean('AGENT_STREAMING', false),
            defaultInputModes: options.defaultInputModes || ['text/plain'],
            defaultOutputModes: options.defaultOutputModes || ['text/plain'],
        };

        if (options.skills !== undefined) {
            config.skills = options.skills;
        }

        return config;
    }

    /**
     * Creates default capabilities
     */
    static createCapabilities(streaming: boolean = false): AgentCapabilities {
        return {
            streaming,
            pushNotifications: false,
            stateTransitionHistory: false,
        };
    }

    /**
     * Creates default conversational AI skill
     */
    static createDefaultSkill(): AgentSkill {
        return {
            id: 'conversational-ai',
            name: 'Conversational AI',
            description: 'Engages in natural language conversations using OpenAI GPT models',
            tags: ['conversation', 'chat', 'ai', 'language-model', 'openai'],
            examples: [
                'Hello, how are you?',
                'Can you help me with a question?',
                'What can you do?'
            ],
            inputModes: ['text/plain'],
            outputModes: ['text/plain'],
        };
    }

    /**
     * Builds a complete AgentCard from configuration
     */
    static buildAgentCard(config: AgentCardConfigOptions): AgentCard {
        const skills = config.skills || [this.createDefaultSkill()];
        const capabilities = this.createCapabilities(config.streaming);

        return {
            protocolVersion: '0.3.0',
            name: config.name!,
            description: config.description!,
            url: `${config.baseUrl}/a2a/v1`,
            preferredTransport: TransportProtocol.JSONRPC,
            version: config.version!,
            capabilities,
            defaultInputModes: config.defaultInputModes!,
            defaultOutputModes: config.defaultOutputModes!,
            skills,
            supportsAuthenticatedExtendedCard: false,
        };
    }
}

