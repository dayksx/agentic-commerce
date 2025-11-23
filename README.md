# Agentic Commerce

This project is an **ETHGlobal hackathon** submission that demonstrates a full-stack agentic commerce platform with payment integration using **Coinbase Developer Platform (CDP)** for **x402** payments.

## Overview

This monorepo implements an AI agent runtime built with LangGraph that exposes its capabilities through an MCP (Model Context Protocol) endpoint, paired with a modern Next.js UI for agent interaction and payment management. The server agent requires payment via x402 (HTTP 402 Payment Required) protocol.

## Architecture

The project is organized as a monorepo with two main packages:

### Agent (`agent/`)

The **agent package** contains the server-side agent runtime:

- **AgentRuntime**: Core runtime orchestrating LangGraph workflows and servers
- **MCP Server**: Model Context Protocol endpoint (port 8001) with x402 payment middleware
- **Agent Card Server**: Agent discovery and metadata service (port 3000)
- **Tools & Models**: Extensible agent capabilities including yield monitoring, bazaar integration, and more
- **Client Scripts**: Utilities for testing x402 payment flows

### UI (`ui/`)

The **UI package** is a Next.js application providing:

- **Agent-to-Agent (A2A) Interface**: Chat-based agent interaction at `/a2a`
- **Payment Dashboard**: x402 payment tracking and management
- **Treasury Management**: Financial monitoring and allocation views
- **CRM Integration**: Customer relationship management placeholders
- **Modern UI Components**: Built with Radix UI and Tailwind CSS

## Infrastructure

- Deployed on [Oasis Runtime Off-Chain Logic (ROFL)](https://docs.oasis.io/build/rofl/)

## Prerequisites

- Node.js (v18 or higher)
- pnpm (v10.6.5 or compatible)
- A private key for wallet operations (for client payments)
- Environment variables configured (see Setup)
- [Oasis ROFL CLI](https://docs.oasis.io/build/tools/cli/setup)

## Installation

Install dependencies for both packages:

```bash
# Install agent dependencies
cd agent
pnpm install

# Install UI dependencies
cd ../ui
pnpm install
```

## Setup

### Agent Configuration

Create a `.env` file in the `agent/` directory:

```env
# Required for client operations (payment handling)
PRIVATE_KEY=your_private_key_here

# Optional: MCP endpoint URL (defaults to http://0.0.0.0:8001/mcp)
MCP_ENDPOINT=http://0.0.0.0:8001/mcp

# Optional: Enable payment requirement on MCP server
MCP_REQUIRE_PAYMENT=true
```

### UI Configuration

Create a `.env.local` file in the `ui/` directory:

```env
# Add any UI-specific environment variables here
NEXT_PUBLIC_AGENT_ENDPOINT=http://localhost:3000
```

## Running the Application

### Development Mode

**Start the Agent Server:**

```bash
cd agent
pnpm dev
```

This starts:

- Agent Card Server on port 3000
- MCP Server on port 8001 (with payment enabled)

**Start the UI (in a separate terminal):**

```bash
cd ui
pnpm dev
```

This starts the Next.js application on port 3001.

Access the application at:

- UI: `http://localhost:3001`
- Agent Card Server: `http://localhost:3000`
- MCP Endpoint: `http://0.0.0.0:8001/mcp`

### Production Mode

**Build and run the agent:**

```bash
cd agent
pnpm build
pnpm start
```

**Build and run the UI:**

```bash
cd ui
pnpm build
pnpm start
```

## Deployment

### Publishing the Docker Image

Build and push the agent Docker image:

```bash
cd agent
pnpm docker:ship
```

### Deploy to Oasis ROFL

Navigate to the `agent` directory:

```bash
cd agent
```

#### Verify Current Deployment

To check whether the source code in front of you is the one currently registered on-chain and running on the nodes, run:

```bash
# Linux
oasis rofl build --verify

# Other platforms
docker run --platform linux/amd64 --volume .:/src -it ghcr.io/oasisprotocol/rofl-dev:main oasis rofl build --verify
```

Current verification passed:

```bash
Adding runtime as init...
Runtime hash: 2cd0468ec2ea5f4264f47f728c5c3b0fcce93f5a537e568f8cbab8a53b526ae7
Adding extra files...
Creating squashfs filesystem...
Creating tar archive: /tmp/oasis-build4288022190/rootfs.squashfs.tar
TAR archive SHA256: ded5db3a9150d30c7a9b4ff84526c200b1d641c01e132bb8ae86f2d6f4c6491d
Creating dm-verity hash tree...
Creating ORC bundle...
ROFL app built and bundle written to 'agent.default.orc'.
Computing enclave identity...
Built enclave identities MATCH latest manifest enclave identities.
Manifest enclave identities MATCH on-chain enclave identities.
```

#### Deploy your own instance

To build your own instance run:

```bash
oasis rofl init --reset
```

Then create a new ROFL, set secrets and deploy it.

```bash
oasis rofl create --network testnet
```

#### Generate ORC Bundle

This operation packs `docker-compose.yaml`, specific operating system components and the hash of a trusted block on the Sapphire chain. All these pieces are needed to safely execute the app inside a TEE.

```bash
# Linux
oasis rofl build

# Other platforms
docker run --platform linux/amd64 --volume .:/src -it ghcr.io/oasisprotocol/rofl-dev:main oasis rofl build
```

#### Encrypt secrets

```bash
# for each secret
echo -n "<secret>" | oasis rofl secret set <ENV_VAR> -
```

#### Update On-chain App Config

After any changes to the [app's policy](https://docs.oasis.io/build/rofl/features/manifest#policy) defined in the manifest, the on-chain app config needs to be updated in order for the changes to take effect.

```bash
oasis rofl update
```

#### Deploy app to a ROFL node

ROFLs can be deployed to any ParaTime that has the ROFL module installed. Most common is Sapphire which implements all ROFL functionalities.

Your app will be deployed to a ROFL node. This is a light Oasis Node with support for TEE and configured Sapphire ParaTime.

```bash
oasis rofl deploy
```

#### Testing it out

Obtain the URL of your agent by invoking

```bash
oasis rofl machine show
```

Look for the Proxy: section, for example:

```bash
Proxy:
  Domain: m1147.test-proxy-b.rofl.app
  Ports from compose file:
    8001 (agentic-commerce): https://p8001.m1147.test-proxy-b.rofl.app
    3000 (agentic-commerce): https://p3000.m1147.test-proxy-b.rofl.app
```

In the setup above the agent is available on:

- [https://p8001.m1147.test-proxy-b.rofl.app](https://p8001.m1147.test-proxy-b.rofl.app)
- [https://p3000.m1147.test-proxy-b.rofl.app](https://p3000.m1147.test-proxy-b.rofl.app)

#### Pay for machine uptime

Machines require gas to keep on running. Make sure there is enough gas to pay for execution.

For example, to pay for 3 hours usage, run the following command:

```bash
oasis rofl machine top-up --term hour --term-count 3
```

## Testing

### Test x402 Payment Flows

To test the agent's x402-enabled MCP endpoint:

```bash
cd agent
pnpm call-x402
```

This script will:

1. Create a wallet client configured for Base Sepolia testnet
2. Make a POST request to the MCP endpoint
3. Handle the x402 payment flow automatically
4. Display the response and payment information

### Query Payment History

```bash
cd agent
pnpm query-payments
```

### Test UI Payments

```bash
cd ui
pnpm test:payments
```

## Project Structure

```plaintext
agentic-commerce/
├── agent/                          # Backend agent runtime
│   ├── src/
│   │   ├── index.ts               # Entry point
│   │   └── app/
│   │       ├── AgentRuntime.ts    # Main runtime orchestrator
│   │       ├── servers/
│   │       │   ├── MCPServer.ts   # MCP server with x402 payments
│   │       │   └── AgentCardServer.ts
│   │       ├── models/            # LangGraph model implementations
│   │       │   ├── mockModel.ts
│   │       │   └── yieldModel.ts
│   │       ├── tools/             # Agent tools and capabilities
│   │       │   ├── agentsSearchTool.ts
│   │       │   ├── bazarTool.ts
│   │       │   └── index.ts
│   │       ├── services/          # Business logic services
│   │       │   └── YieldMonitor.ts
│   │       └── config/            # Configuration management
│   │           └── AgentCardConfig.ts
│   ├── client/                    # Client utilities
│   │   ├── call-x402-endpoint.ts
│   │   └── query-x402-payments.ts
│   ├── docker-compose.yml
│   ├── Dockerfile
│   └── package.json
│
├── ui/                             # Frontend Next.js application
│   ├── app/
│   │   ├── page.tsx               # Homepage
│   │   ├── layout.tsx
│   │   ├── a2a/                   # Agent-to-Agent interface
│   │   │   └── page.tsx
│   │   └── api/                   # API routes
│   │       ├── a2a/
│   │       └── payments/
│   ├── components/
│   │   ├── a2a-agent-card.tsx     # A2A components
│   │   ├── a2a-chatbot.tsx
│   │   ├── agent-card.tsx
│   │   ├── payments-table.tsx     # Payment management
│   │   ├── treasury-card.tsx      # Treasury dashboard
│   │   ├── crm-table.tsx          # CRM components
│   │   └── ui/                    # Reusable UI components
│   ├── lib/
│   │   ├── utils.ts
│   │   └── mock-data/
│   ├── scripts/                   # Utility scripts
│   └── package.json
│
└── README.md
```

## Key Technologies

### Agent Package

- **LangGraph**: Agent workflow orchestration
- **MCP (Model Context Protocol)**: Protocol for agent communication
- **x402**: HTTP 402 Payment Required protocol implementation
- **Coinbase Developer Platform (CDP)**: Payment infrastructure
- **Express**: HTTP server framework
- **TypeScript**: Type-safe development

### UI Package

- **Next.js 15**: React framework with App Router
- **Radix UI**: Accessible component primitives
- **Tailwind CSS**: Utility-first styling
- **Recharts**: Data visualization
- **React Hook Form**: Form management
- **Zod**: Schema validation

## Features

### Agent Runtime

- ✅ MCP server with HTTP/SSE transport
- ✅ x402 payment integration for monetized API access
- ✅ LangGraph-based agent workflows
- ✅ Extensible tool and model system
- ✅ Agent Card Server for agent discovery
- ✅ Client-side payment handling with x402-fetch
- ✅ Yield monitoring and financial tools
- ✅ Bazaar integration for agent marketplace

### User Interface

- ✅ Agent-to-Agent (A2A) chat interface
- ✅ Payment tracking and history
- ✅ Treasury management dashboard
- ✅ Allocation visualization with pie charts
- ✅ CRM table components
- ✅ Responsive design with dark/light mode
- ✅ Modern component library with Radix UI

## Development

### Agent Development

The agent package uses TypeScript and requires compilation before running in production:

```bash
cd agent

# Watch mode (development)
pnpm dev

# Build
pnpm build

# Run production build
pnpm start
```

### UI Development

The UI package uses Next.js with hot module replacement:

```bash
cd ui

# Development mode with hot reload
pnpm dev

# Build for production
pnpm build

# Run production server
pnpm start

# Lint code
pnpm lint
```

## Payment Configuration

The MCP server is configured with x402 payment middleware:

- **Price**: $0.10 per request
- **Network**: Base Sepolia (testnet)
- **Payment Address**: `0x4D8aD86dEe297B5703E92465692999abDB0508c8`
- **Facilitator**: [https://x402.org/facilitator](https://x402.org/facilitator)

Payment can be enabled/disabled via the `MCP_REQUIRE_PAYMENT` environment variable or the `enablePayment` parameter when creating the MCP server.

## License

ISC
