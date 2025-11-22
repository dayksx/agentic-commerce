export interface Transaction {
  id: string
  consumerAddress: string
  service: "MCP" | "A2A"
  amount: number
  date: string
  direction: "incoming" | "outgoing"
}

export interface CRMClient {
  id: string
  consumerAddress: string
  ipAddress: string
  totalBill: number
  loyaltyScore: number
  reputationScore: number
  dynamicPrice: number
  date: string
}

export interface AllocationData {
  name: string
  value: number
  color: string
}

export const agentData = {
  name: "AgentX Server",
  status: "Operational",
  mcpEndpoint: "https://api.agentx.io/mcp/v1",
  a2aEndpoint: "https://api.agentx.io/a2a/v1",
}

export const treasuryData = {
  balance: 852.24,
  apr: 3.2,
}

export const allocationData: AllocationData[] = [
  { name: "Uniswap LP", value: 40, color: "hsl(var(--chart-1))" },
  { name: "1inch Fusion", value: 30, color: "hsl(var(--chart-2))" },
  { name: "Unallocated", value: 30, color: "hsl(var(--chart-3))" },
]

export const recentTransactions: Transaction[] = [
  {
    id: "1",
    consumerAddress: "0x1a2b...3c4d",
    service: "MCP",
    amount: 45.32,
    date: "2m ago",
    direction: "incoming",
  },
  {
    id: "2",
    consumerAddress: "0x5e6f...7g8h",
    service: "A2A",
    amount: 128.5,
    date: "15m ago",
    direction: "incoming",
  },
  {
    id: "3",
    consumerAddress: "0x9i0j...1k2l",
    service: "MCP",
    amount: 67.89,
    date: "1h ago",
    direction: "incoming",
  },
  {
    id: "4",
    consumerAddress: "0x3m4n...5o6p",
    service: "A2A",
    amount: 200.0,
    date: "3h ago",
    direction: "outgoing",
  },
  {
    id: "5",
    consumerAddress: "0x7q8r...9s0t",
    service: "MCP",
    amount: 89.15,
    date: "1d ago",
    direction: "incoming",
  },
]

export const crmClients: CRMClient[] = [
  {
    id: "1",
    consumerAddress: "0x1a2b...3c4d",
    ipAddress: "192.168.1.100",
    totalBill: 1245.32,
    loyaltyScore: 85,
    reputationScore: 92,
    dynamicPrice: 0.85,
    date: "Oct 24, 2023",
  },
  {
    id: "2",
    consumerAddress: "0x5e6f...7g8h",
    ipAddress: "10.0.0.45",
    totalBill: 3567.89,
    loyaltyScore: 78,
    reputationScore: 88,
    dynamicPrice: 0.92,
    date: "Oct 22, 2023",
  },
  {
    id: "3",
    consumerAddress: "0x9i0j...1k2l",
    ipAddress: "172.16.0.22",
    totalBill: 892.15,
    loyaltyScore: 92,
    reputationScore: 95,
    dynamicPrice: 0.78,
    date: "Oct 21, 2023",
  },
  {
    id: "4",
    consumerAddress: "0x3m4n...5o6p",
    ipAddress: "192.168.2.50",
    totalBill: 5234.67,
    loyaltyScore: 65,
    reputationScore: 72,
    dynamicPrice: 1.15,
    date: "Oct 20, 2023",
  },
  {
    id: "5",
    consumerAddress: "0x7q8r...9s0t",
    ipAddress: "10.1.1.88",
    totalBill: 2156.43,
    loyaltyScore: 88,
    reputationScore: 90,
    dynamicPrice: 0.82,
    date: "Oct 19, 2023",
  },
  {
    id: "6",
    consumerAddress: "0xu1v2...w3x4",
    ipAddress: "172.20.10.5",
    totalBill: 4321.98,
    loyaltyScore: 72,
    reputationScore: 80,
    dynamicPrice: 0.95,
    date: "Oct 18, 2023",
  },
  {
    id: "7",
    consumerAddress: "0xy5z6...a7b8",
    ipAddress: "192.168.3.77",
    totalBill: 1678.5,
    loyaltyScore: 95,
    reputationScore: 98,
    dynamicPrice: 0.72,
    date: "Oct 15, 2023",
  },
  {
    id: "8",
    consumerAddress: "0xc9d0...e1f2",
    ipAddress: "10.2.2.120",
    totalBill: 3890.25,
    loyaltyScore: 80,
    reputationScore: 85,
    dynamicPrice: 0.88,
    date: "Oct 12, 2023",
  },
]
