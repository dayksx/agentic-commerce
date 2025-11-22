import type React from "react"
import { Bot } from "lucide-react"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"

const Card = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <div
    className={`bg-white rounded-[32px] border border-white/50 shadow-[0_20px_40px_-10px_rgba(45,43,66,0.05)] p-8 h-full ${className}`}
  >
    {children}
  </div>
)

interface ChatAgentCardProps {
  photo?: string
  address?: string
  ens?: string
}

export function ChatAgentCard({ photo, address = "0x0000...0000", ens }: ChatAgentCardProps) {
  const displayAddress = ens || address

  return (
    <Card className="space-y-6 flex flex-col">
      <div className="flex items-center gap-4">
        <div className="relative">
          <Avatar className="w-20 h-20 border-2 border-[#A78BFA]/20">
            {photo ? (
              <AvatarImage src={photo} alt="Chat Agent" />
            ) : (
              <AvatarFallback className="bg-gradient-to-br from-[#A78BFA] to-[#F472B6]">
                <Bot size={32} className="text-white" />
              </AvatarFallback>
            )}
          </Avatar>
          <div className="absolute bottom-0 right-0 w-6 h-6 bg-[#D4FF00] rounded-full border-4 border-white" />
        </div>

        <div className="flex-1">
          <h2 className="text-xl font-bold text-[#2D2B42] tracking-tight">Chat Agent</h2>
          <p className="text-sm font-medium text-[#8F8F9D] mt-1">A2A Assistant</p>
        </div>
      </div>

      <div className="space-y-4 flex-1">
        <div className="group p-4 rounded-2xl bg-[#FAFAFC] hover:bg-[#F0F0F5] transition-colors border border-transparent hover:border-[#E0E0EB]">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#8F8F9D]">
              {ens ? "ENS" : "Ethereum Address"}
            </span>
            <div className="w-1.5 h-1.5 rounded-full bg-[#D4FF00]" />
          </div>
          <p className="text-xs font-medium text-[#2D2B42] truncate font-mono">{displayAddress}</p>
        </div>
      </div>
    </Card>
  )
}

