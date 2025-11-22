"use client"

import { useState } from "react"
import { HumanAgentCard } from "@/components/human-agent-card"
import { ChatAgentWithChat } from "@/components/chat-agent-with-chat"
import { ServerAgentCard } from "@/components/server-agent-card"

export default function A2APage() {
  const [highlightServices, setHighlightServices] = useState(false)

  const handleSendMessage = () => {
    setHighlightServices(true)
    setTimeout(() => {
      setHighlightServices(false)
    }, 2000) // Highlight for 2 seconds
  }

  return (
    <div className="min-h-screen bg-[#F4F4F8] p-6 md:p-10 font-sans selection:bg-[#FF9F7C] selection:text-white">
      <div className="grid grid-cols-1 md:grid-cols-[auto_1fr_1fr] lg:grid-cols-[auto_1fr_1fr] gap-4 max-w-[1600px] mx-auto items-stretch">
        {/* First Box: Human Agent */}
        <div className="min-w-0">
          <HumanAgentCard 
            address="0x4D8aD86dEe297B5703E92465692999abDB0508c8"
            ens="dayksx.eth"
          />
        </div>

        {/* Second Box: Chat Agent with Chat */}
        <ChatAgentWithChat 
          address="0x4D8aD86dEe297B5703E92465692999abDB0508c8"
          ens="dayksx.eth"
          onSendMessage={handleSendMessage}
        />

        {/* Third Column: Server Agents Stacked */}
        <div className="h-full flex flex-col gap-4">
          {/* Server Agent 1 */}
          <div className="flex-1 min-h-0">
            <ServerAgentCard 
              address="0x4D8aD86dEe297B5703E92465692999abDB0508c8"
              ens="dayksx.eth"
              services={["Bazaar Research", "Agent Research"]}
              serverWalletAddress="0x42849E96716efDBCCb6416e7E099830C0b1Eb34f"
              title="Server Agent"
              showEndpoints={true}
              highlightServices={highlightServices}
            />
          </div>

          {/* Server Agent 2 */}
          <div className="flex-shrink-0">
            <ServerAgentCard 
              address="0x4D8aD86dEe297B5703E92465692999abDB0508c8"
              ens="dayksx.eth"
              services={["agent reputation scoring"]}
              serverWalletAddress="0x42849E96716efDBCCb6416e7E099830C0b1Eb34f"
              title="Server Agent 2"
              compact={true}
            />
          </div>

          {/* Server Agent 3 */}
          <div className="flex-shrink-0">
            <ServerAgentCard 
              address="0x4D8aD86dEe297B5703E92465692999abDB0508c8"
              ens="dayksx.eth"
              services={["agent feedback management"]}
              serverWalletAddress="0x42849E96716efDBCCb6416e7E099830C0b1Eb34f"
              title="Server Agent 3"
              compact={true}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

