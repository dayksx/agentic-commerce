# ETHGlobal Server Agent

This project is an **ETHGlobal hackathon** submission that demonstrates a server agent architecture with payment integration using **Coinbase Developer Platform (CDP)** for **x402** payments.

## Overview

This project implements an AI agent runtime built with LangGraph that exposes its capabilities through an MCP (Model Context Protocol) endpoint. The server agent requires payment via x402 (HTTP 402 Payment Required) protocol, and the client agent demonstrates how to interact with the server using x402 payment flows.

## Architecture

### Server Agent
<<<<<<< Updated upstream

The **server agent** is represented by the `AgentRuntime` class, which:

- Runs an MCP server endpoint (default: port 8001)
- Implements LangGraph workflows for agent execution
- Integrates x402 payment middleware for monetized API access
- Exposes tools and capabilities via the MCP protocol

### Client Agent

The **client agent** is currently represented by a script (`call-x402-endpoint.ts`) that:

- Makes HTTP requests to the MCP endpoint
- Handles x402 payment flows using `x402-fetch`
- Demonstrates payment-enabled client-server interaction

## Infrastructure

- Deployed on to [Oasis Runtime Off-Chain Logic (ROFL)](https://docs.oasis.io/build/rofl/)

## Prerequisites

=======
The **server agent** is represented by the `AgentRuntime` class, which:
- Runs an MCP server endpoint (default: port 8001)
- Implements LangGraph workflows for agent execution
- Integrates x402 payment middleware for monetized API access
- Exposes tools and capabilities via the MCP protocol

### Client Agent
The **client agent** is currently represented by a script (`call-x402-endpoint.ts`) that:
- Makes HTTP requests to the MCP endpoint
- Handles x402 payment flows using `x402-fetch`
- Demonstrates payment-enabled client-server interaction

## Prerequisites

>>>>>>> Stashed changes
- Node.js (v18 or higher)
- pnpm (v10.6.5 or compatible)
- A private key for wallet operations (for client payments)
- Environment variables configured (see Setup)
<<<<<<< Updated upstream
- [Oasis ROFL CLI](https://docs.oasis.io/build/tools/cli/setup)
=======
>>>>>>> Stashed changes

## Installation

```bash
# Install dependencies
pnpm install
```

## Setup

Create a `.env` file in the project root with the following variables:

```env
# Required for client agent (payment operations)
PRIVATE_KEY=your_private_key_here

# Optional: MCP endpoint URL (defaults to http://0.0.0.0:8001/mcp)
MCP_ENDPOINT=http://0.0.0.0:8001/mcp

# Optional: Enable payment requirement on MCP server
MCP_REQUIRE_PAYMENT=true
```

## Running the Server Agent

### Development Mode
<<<<<<< Updated upstream

=======
>>>>>>> Stashed changes
```bash
pnpm dev
```

This starts the server agent with:
<<<<<<< Updated upstream

=======
>>>>>>> Stashed changes
- Agent Card Server on port 3000
- MCP Server on port 8001 (with payment enabled)

### Production Mode
<<<<<<< Updated upstream

=======
>>>>>>> Stashed changes
```bash
# Build the project
pnpm build

# Start the server
pnpm start
```

The server will be available at:
<<<<<<< Updated upstream

- Agent Card Server: `http://localhost:3000`
- MCP Endpoint: `http://0.0.0.0:8001/mcp`

## Deployment

### Publishing the docker image

Build the docker image and push it to the public registry

```bash
pnpm docker:ship
```

### Deploy to Oasis ROFL

#### Generate orc bundle

This operation packs `docker-compose.yaml`, specific operating system components and the hash of a trusted block on the Sapphire chain. All these pieces are needed to safely execute our app inside a TEE.

```bash
# linux
oasis rofl build
# or any other platform
docker run --platform linux/amd64 --volume .:/src -it ghcr.io/oasisprotocol/rofl-dev:main oasis rofl build
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

#### Pay for machine uptime

Machines require gas to keep on running. Make sure there is enough gas to pay for execution.

For example, to pay for 3 hours usage, run the following command:

```bash
oasis rofl machine top-up --term hour --term-count 3
```

## Running the Client Agent

To test the client agent that calls the x402-enabled MCP endpoint:

```bash
pnpm call-x402
```

This script will:

1. Create a wallet client configured for Base Sepolia testnet
2. Make a POST request to the MCP endpoint
3. Handle the x402 payment flow automatically
4. Display the response and payment information

## Project Structure

```bash
agentic-commerce/
├── src/
│   ├── app/
│   │   ├── AgentRuntime.ts      # Main runtime orchestrating workflows and servers
│   │   ├── servers/
│   │   │   ├── MCPServer.ts     # MCP server with x402 payment integration
│   │   │   └── AgentCardServer.ts
│   │   ├── models/              # LangGraph model implementations
│   │   ├── tools/               # Agent tools and capabilities
│   │   └── config/              # Configuration management
│   └── index.ts                 # Entry point
├── scripts/
│   └── call-x402-endpoint.ts    # Client agent script
├── package.json
└── README.md
```

## Key Technologies

- **LangGraph**: Agent workflow orchestration
- **MCP (Model Context Protocol)**: Protocol for agent communication
- **x402**: HTTP 402 Payment Required protocol implementation
- **Coinbase Developer Platform (CDP)**: Payment infrastructure
- **Express**: HTTP server framework
- **TypeScript**: Type-safe development

## Features

=======
- Agent Card Server: `http://localhost:3000`
- MCP Endpoint: `http://0.0.0.0:8001/mcp`

## Running the Client Agent

To test the client agent that calls the x402-enabled MCP endpoint:

```bash
pnpm call-x402
```

This script will:
1. Create a wallet client configured for Base Sepolia testnet
2. Make a POST request to the MCP endpoint
3. Handle the x402 payment flow automatically
4. Display the response and payment information

## Project Structure

```
ethglobal-server-agent/
├── src/
│   ├── app/
│   │   ├── AgentRuntime.ts      # Main runtime orchestrating workflows and servers
│   │   ├── servers/
│   │   │   ├── MCPServer.ts     # MCP server with x402 payment integration
│   │   │   └── AgentCardServer.ts
│   │   ├── models/              # LangGraph model implementations
│   │   ├── tools/               # Agent tools and capabilities
│   │   └── config/              # Configuration management
│   └── index.ts                 # Entry point
├── scripts/
│   └── call-x402-endpoint.ts    # Client agent script
├── package.json
└── README.md
```

## Key Technologies

- **LangGraph**: Agent workflow orchestration
- **MCP (Model Context Protocol)**: Protocol for agent communication
- **x402**: HTTP 402 Payment Required protocol implementation
- **Coinbase Developer Platform (CDP)**: Payment infrastructure
- **Express**: HTTP server framework
- **TypeScript**: Type-safe development

## Features

>>>>>>> Stashed changes
- ✅ MCP server with HTTP/SSE transport
- ✅ x402 payment integration for monetized API access
- ✅ LangGraph-based agent workflows
- ✅ Extensible tool and model system
- ✅ Agent Card Server for agent discovery
- ✅ Client-side payment handling with x402-fetch

## Development

The project uses TypeScript and requires compilation before running in production:

```bash
# Watch mode (development)
pnpm dev

# Build
pnpm build

# Run production build
pnpm start
```

## Payment Configuration

The MCP server is configured with x402 payment middleware:
<<<<<<< Updated upstream

- **Price**: $0.10 per request
- **Network**: Base Sepolia (testnet)
- **Payment Address**: `0x4D8aD86dEe297B5703E92465692999abDB0508c8`
- **Facilitator**: [https://x402.org/facilitator](https://x402.org/facilitator)

=======
- **Price**: $0.10 per request
- **Network**: Base Sepolia (testnet)
- **Payment Address**: `0x4D8aD86dEe297B5703E92465692999abDB0508c8`
- **Facilitator**: https://x402.org/facilitator

>>>>>>> Stashed changes
Payment can be enabled/disabled via the `MCP_REQUIRE_PAYMENT` environment variable or the `enablePayment` parameter when creating the MCP server.

## License

ISC
<<<<<<< Updated upstream
=======

>>>>>>> Stashed changes
