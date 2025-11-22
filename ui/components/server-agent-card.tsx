import type React from "react"
import { Server, Search, Globe, Zap, Wallet } from "lucide-react"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"

const Card = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <div
    className={`bg-white rounded-[32px] border border-white/50 shadow-[0_20px_40px_-10px_rgba(45,43,66,0.05)] p-8 h-full ${className}`}
  >
    {children}
  </div>
)

interface ServerAgentCardProps {
  photo?: string
  address?: string
  ens?: string
  services?: string[]
  agentCardUrl?: string
  mcpEndpoint?: string
  mcpCost?: string
  a2aEndpoint?: string
  a2aCost?: string
  serverWalletAddress?: string
  title?: string
  showEndpoints?: boolean
  compact?: boolean
  highlightServices?: boolean
}

export function ServerAgentCard({ 
  photo, 
  address = "0x0000...0000", 
  ens,
  services = ["Bazaar Research", "Agent Research"],
  agentCardUrl = "http://localhost:3000/.well-known/agent-card.json",
  mcpEndpoint = "http://35.223.89.123:8001/mcp",
  mcpCost = "$0.0001",
  a2aEndpoint = "http://35.223.89.123:8001/a2a",
  a2aCost = "$0.0001",
  serverWalletAddress = "0x42849E96716efDBCCb6416e7E099830C0b1Eb34f",
  title = "Server Agent",
  showEndpoints = false,
  compact = false,
  highlightServices = false
}: ServerAgentCardProps) {
  const displayAddress = ens || address

  return (
    <Card className={`${compact ? 'space-y-2 p-4' : 'space-y-3 p-6'} flex flex-col ${compact ? '' : 'h-full'}`}>
      <div className={`flex items-center ${compact ? 'gap-2' : 'gap-3'}`}>
        <div className="relative">
          <Avatar className={`${compact ? 'w-10 h-10' : 'w-14 h-14'} border-2 border-[#A78BFA]/20`}>
            {photo ? (
              <AvatarImage src={photo} alt="Server Agent" />
            ) : (
              <AvatarFallback className="bg-gradient-to-br from-[#A78BFA] to-[#F472B6]">
                <Server size={compact ? 18 : 24} className="text-white" />
              </AvatarFallback>
            )}
          </Avatar>
          <div className={`absolute bottom-0 right-0 ${compact ? 'w-3 h-3 border-2' : 'w-4 h-4 border-2'} bg-[#D4FF00] rounded-full border-white`} />
        </div>

        <div className="flex-1">
          <h2 className={`${compact ? 'text-sm' : 'text-base'} font-bold text-[#2D2B42] tracking-tight`}>{title}</h2>
          <p className={`${compact ? 'text-[10px] mt-0' : 'text-xs mt-0.5'} font-medium text-[#8F8F9D]`}>MCP Server</p>
        </div>
      </div>

      <div className={`${compact ? 'space-y-1.5' : 'space-y-2'} ${compact ? '' : 'flex-1 overflow-y-auto'}`}>
        {showEndpoints && (
          <>
            {/* Agent Card URL */}
            <div className="group p-2.5 rounded-xl bg-[#FAFAFC] hover:bg-[#F0F0F5] transition-colors border border-transparent hover:border-[#E0E0EB]">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-1.5">
                  <Globe size={12} className="text-[#8F8F9D]" />
                  <span className="text-[9px] font-bold uppercase tracking-widest text-[#8F8F9D]">Agent Card URL</span>
                </div>
                <div className="w-1 h-1 rounded-full bg-[#D4FF00]" />
              </div>
              <p className="text-[10px] font-medium text-[#2D2B42] truncate font-mono">{agentCardUrl}</p>
            </div>

            {/* MCP Endpoint + Cost */}
            <div className="group p-2.5 rounded-xl bg-[#FAFAFC] hover:bg-[#F0F0F5] transition-colors border border-transparent hover:border-[#E0E0EB]">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-1.5">
                  <Zap size={12} className="text-[#8F8F9D]" />
                  <span className="text-[9px] font-bold uppercase tracking-widest text-[#8F8F9D]">MCP Endpoint</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[9px] font-bold text-[#A78BFA]">{mcpCost}</span>
                  <div className="w-1 h-1 rounded-full bg-[#D4FF00]" />
                </div>
              </div>
              <p className="text-[10px] font-medium text-[#2D2B42] truncate font-mono">{mcpEndpoint}</p>
            </div>

            {/* A2A Endpoint + Cost */}
            <div className="group p-2.5 rounded-xl bg-[#FAFAFC] hover:bg-[#F0F0F5] transition-colors border border-transparent hover:border-[#E0E0EB]">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-1.5">
                  <Zap size={12} className="text-[#8F8F9D]" />
                  <span className="text-[9px] font-bold uppercase tracking-widest text-[#8F8F9D]">A2A Endpoint</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[9px] font-bold text-[#A78BFA]">{a2aCost}</span>
                  <div className="w-1 h-1 rounded-full bg-[#D4FF00]" />
                </div>
              </div>
              <p className="text-[10px] font-medium text-[#2D2B42] truncate font-mono">{a2aEndpoint}</p>
            </div>

            {/* Server Wallet Address */}
            <div className="group p-2.5 rounded-xl bg-[#FAFAFC] hover:bg-[#F0F0F5] transition-colors border border-transparent hover:border-[#E0E0EB]">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-1.5">
                  <Wallet size={12} className="text-[#8F8F9D]" />
                  <span className="text-[9px] font-bold uppercase tracking-widest text-[#8F8F9D]">Server Wallet</span>
                </div>
                <div className="w-1 h-1 rounded-full bg-[#D4FF00]" />
              </div>
              <p className="text-[10px] font-medium text-[#2D2B42] truncate font-mono">{serverWalletAddress}</p>
            </div>
          </>
        )}

        {/* Services */}
        <div className={`${compact ? 'p-2' : 'p-2.5'} rounded-xl bg-gradient-to-br from-[#A78BFA]/10 to-[#F472B6]/10 border border-[#A78BFA]/20`}>
          <div className={`flex items-center gap-1.5 ${compact ? 'mb-1.5' : 'mb-2'}`}>
            <Search size={compact ? 10 : 12} className="text-[#A78BFA]" />
            <span className={`${compact ? 'text-[8px]' : 'text-[9px]'} font-bold uppercase tracking-widest text-[#8F8F9D]`}>Available Services</span>
          </div>
          <div className={compact ? 'space-y-1' : 'space-y-1.5'}>
            {services.map((service, index) => {
              const shouldHighlight = highlightServices && (service === "Bazaar Research" || service === "Agent Research")
              return (
                <div
                  key={index}
                  className={`${compact ? 'px-1.5 py-1 text-[10px]' : 'px-2 py-1.5 text-xs'} rounded-lg font-medium text-[#2D2B42] transition-all duration-500 ${
                    shouldHighlight 
                      ? 'bg-gradient-to-r from-[#A78BFA]/30 to-[#F472B6]/30 border border-[#A78BFA]/60 shadow-sm shadow-purple-500/20' 
                      : 'bg-white/50 border border-[#A78BFA]/20'
                  }`}
                >
                  {service}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </Card>
  )
}

