import type React from "react"
import { MessageSquare, Zap, Globe, Activity } from "lucide-react"

const Card = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <div
    className={`bg-white rounded-[32px] border border-white/50 shadow-[0_20px_40px_-10px_rgba(45,43,66,0.05)] p-8 h-full ${className}`}
  >
    {children}
  </div>
)

const A2A_DATA = {
  name: "A2A Agent",
  status: "Active",
  endpoint: "http://localhost:3001/api/a2a",
  connections: 12,
  messagesToday: 342,
}

export function A2AAgentCard() {
  return (
    <Card className="space-y-8 flex flex-col">
      <div className="flex items-center justify-between">
        <div className="relative">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#A78BFA] to-[#F472B6] p-[2px] shadow-lg shadow-purple-500/20">
            <div className="w-full h-full rounded-full bg-white flex items-center justify-center overflow-hidden">
              <MessageSquare size={32} className="text-[#A78BFA]" />
            </div>
          </div>
          <div className="absolute bottom-0 right-0 w-6 h-6 bg-[#D4FF00] rounded-full border-4 border-white" />
        </div>

        <div className="text-right">
          <h2 className="text-xl font-bold text-[#2D2B42] tracking-tight">{A2A_DATA.name}</h2>
          <p className="text-sm font-medium text-[#8F8F9D] mt-1">{A2A_DATA.status}</p>
        </div>
      </div>

      <div className="space-y-4 flex-1">
        <div className="group p-4 rounded-2xl bg-[#FAFAFC] hover:bg-[#F0F0F5] transition-colors cursor-pointer border border-transparent hover:border-[#E0E0EB]">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Zap size={14} className="text-[#8F8F9D]" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#8F8F9D]">A2A Endpoint</span>
            </div>
            <div className="w-1.5 h-1.5 rounded-full bg-[#D4FF00]" />
          </div>
          <p className="text-xs font-medium text-[#2D2B42] truncate font-mono">{A2A_DATA.endpoint}</p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 rounded-2xl bg-gradient-to-br from-[#A78BFA]/10 to-[#F472B6]/10 border border-[#A78BFA]/20">
            <div className="flex items-center gap-2 mb-2">
              <Activity size={14} className="text-[#A78BFA]" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#8F8F9D]">Connections</span>
            </div>
            <p className="text-2xl font-bold text-[#2D2B42]">{A2A_DATA.connections}</p>
          </div>

          <div className="p-4 rounded-2xl bg-gradient-to-br from-[#A78BFA]/10 to-[#F472B6]/10 border border-[#A78BFA]/20">
            <div className="flex items-center gap-2 mb-2">
              <MessageSquare size={14} className="text-[#F472B6]" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#8F8F9D]">Messages</span>
            </div>
            <p className="text-2xl font-bold text-[#2D2B42]">{A2A_DATA.messagesToday}</p>
          </div>
        </div>
      </div>
    </Card>
  )
}

