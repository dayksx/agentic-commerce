import { Chain } from "viem";
import { baseSepolia } from "viem/chains";

/**
 * EIP-8004 Identity Registry contract configuration
 */
export const EIP8004_CONFIG = {
    /**
     * Contract address on Base Sepolia
     */
    CONTRACT_ADDRESS: "0x8004AA63c570c570eBF15376c0dB199918BFe9Fb" as const,

    /**
     * Chain configuration
     */
    CHAIN: baseSepolia as Chain,

    /**
     * Contract ABI for IdentityRegistry functions
     */
    ABI: [
        {
            inputs: [{ internalType: "uint256", name: "tokenId", type: "uint256" }],
            name: "tokenURI",
            outputs: [{ internalType: "string", name: "", type: "string" }],
            stateMutability: "view",
            type: "function",
        },
        {
            inputs: [{ internalType: "uint256", name: "tokenId", type: "uint256" }],
            name: "ownerOf",
            outputs: [{ internalType: "address", name: "", type: "address" }],
            stateMutability: "view",
            type: "function",
        },
    ] as const,
} as const;


