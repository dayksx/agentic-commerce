import type React from "react"
import { Server, Globe, Zap } from "lucide-react"

const Card = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <div
    className={`bg-white rounded-[32px] border border-white/50 shadow-[0_20px_40px_-10px_rgba(45,43,66,0.05)] p-8 ${className}`}
  >
    {children}
  </div>
)

const AGENT_DATA = {
  name: "AgentX Server",
  status: "Operational",
  mcpEndpoint: "https://api.agentx/mcp",
  a2aEndpoint: "https://api.agentx/a2a",
}

export function AgentIdentityCard() {
  return (
    <Card className="space-y-8">
      <div className="flex items-center justify-between">
        <div className="relative">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#FF9F7C] to-[#FF6B95] p-[2px] shadow-lg shadow-pink-500/20">
            <div className="w-full h-full rounded-full bg-white flex items-center justify-center overflow-hidden">
              <Server size={32} className="text-[#FF6B95]" />
            </div>
          </div>
          <div className="absolute bottom-0 right-0 w-6 h-6 bg-[#D4FF00] rounded-full border-4 border-white" />
        </div>

        <div className="text-right">
          <h2 className="text-xl font-bold text-[#2D2B42] tracking-tight">{AGENT_DATA.name}</h2>
          <p className="text-sm font-medium text-[#8F8F9D] mt-1">{AGENT_DATA.status}</p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="group p-4 rounded-2xl bg-[#FAFAFC] hover:bg-[#F0F0F5] transition-colors cursor-pointer border border-transparent hover:border-[#E0E0EB]">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Globe size={14} className="text-[#8F8F9D]" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#8F8F9D]">MCP Endpoint</span>
            </div>
            <div className="w-1.5 h-1.5 rounded-full bg-[#D4FF00]" />
          </div>
          <p className="text-xs font-medium text-[#2D2B42] truncate font-mono">{AGENT_DATA.mcpEndpoint}</p>
        </div>

        <div className="group p-4 rounded-2xl bg-[#FAFAFC] hover:bg-[#F0F0F5] transition-colors cursor-pointer border border-transparent hover:border-[#E0E0EB]">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Zap size={14} className="text-[#8F8F9D]" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#8F8F9D]">A2A Endpoint</span>
            </div>
            <div className="w-1.5 h-1.5 rounded-full bg-[#D4FF00]" />
          </div>
          <p className="text-xs font-medium text-[#2D2B42] truncate font-mono">{AGENT_DATA.a2aEndpoint}</p>
        </div>
      </div>
    </Card>
  )
}
