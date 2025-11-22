import type React from "react"
import { User } from "lucide-react"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"

const Card = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <div
    className={`bg-gradient-to-br from-violet-50 via-violet-100/50 to-violet-50 rounded-[32px] border border-violet-200/60 shadow-[0_20px_40px_-10px_rgba(139,92,246,0.15)] p-8 h-full ${className}`}
  >
    {children}
  </div>
)

interface HumanAgentCardProps {
  photo?: string
  address?: string
  ens?: string
}

export function HumanAgentCard({ photo, address = "0x0000...0000", ens }: HumanAgentCardProps) {
  const displayAddress = ens || address

  return (
    <Card className="space-y-6 flex flex-col min-w-0 max-w-xs">
      <div className="flex items-center gap-4">
        <div className="relative">
          <Avatar className="w-20 h-20 border-2 border-violet-300/40">
            {photo ? (
              <AvatarImage src={photo} alt="Human Agent" />
            ) : (
              <AvatarFallback className="bg-gradient-to-br from-pink-400 to-violet-500">
                <User size={32} className="text-white" />
              </AvatarFallback>
            )}
          </Avatar>
          <div className="absolute bottom-0 right-0 w-6 h-6 bg-violet-500 rounded-full border-4 border-violet-50" />
        </div>

        <div className="flex-1">
          <h2 className="text-xl font-bold text-violet-900 tracking-tight">Human Agent</h2>
          <p className="text-sm font-medium text-violet-600/80 mt-1">You</p>
        </div>
      </div>

      <div className="space-y-4 flex-1">
        <div className="group p-4 rounded-2xl bg-white/60 hover:bg-white/80 transition-colors border border-violet-200/50 hover:border-violet-300/60 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold uppercase tracking-widest text-violet-600/80">
              {ens ? "ENS" : "Ethereum Address"}
            </span>
            <div className="w-1.5 h-1.5 rounded-full bg-violet-500" />
          </div>
          <p className="text-xs font-medium text-violet-900 truncate font-mono">{displayAddress}</p>
        </div>
      </div>
    </Card>
  )
}

