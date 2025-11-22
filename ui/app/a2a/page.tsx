"use client"

import { Activity } from "lucide-react"
import { useState } from "react"
import { A2AChatbot } from "@/components/a2a-chatbot"
import { A2AAgentCard } from "@/components/a2a-agent-card"

export default function A2APage() {
  return (
    <div className="min-h-screen bg-[#F4F4F8] p-6 md:p-10 font-sans selection:bg-[#FF9F7C] selection:text-white">
      <header className="mb-10 flex items-center justify-between max-w-[1600px] mx-auto">
        <div>
          <h1 className="text-3xl font-bold text-[#2D2B42] tracking-tight">A2A Chatbot</h1>
          <p className="text-sm font-medium text-[#8F8F9D] mt-1">Agent-to-Agent Communication</p>
        </div>
        <div className="flex items-center gap-6">
          <div className="text-right hidden sm:block">
            <p className="text-[10px] font-bold text-[#8F8F9D] uppercase tracking-widest">System Load</p>
            <p className="text-xl font-bold text-[#2D2B42] tracking-tight">42%</p>
          </div>

          <div className="w-12 h-12 rounded-full bg-white shadow-lg shadow-slate-200/50 flex items-center justify-center text-[#2D2B42]">
            <Activity size={20} strokeWidth={2.5} />
          </div>
        </div>
      </header>

      <div className="flex flex-col lg:flex-row gap-8 max-w-[1600px] mx-auto">
        {/* LEFT HALF: Chatbot */}
        <div className="flex-1 w-full lg:w-1/2">
          <A2AChatbot />
        </div>

        {/* RIGHT HALF: Agent Card */}
        <div className="flex-1 w-full lg:w-1/2">
          <A2AAgentCard />
        </div>
      </div>
    </div>
  )
}

