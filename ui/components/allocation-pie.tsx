"use client"

import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts"

const data = [
  { name: "Uniswap", value: 45, color: "#FF007A" }, // Uniswap Pink
  { name: "1inch", value: 30, color: "#2F8AF5" }, // 1inch Blue
  { name: "Unallocated", value: 25, color: "#E2E8F0" }, // Slate
]

export function AllocationPie() {
  return (
    <div className="bg-white rounded-[32px] border border-white/50 shadow-[0_20px_40px_-10px_rgba(45,43,66,0.05)] p-8">
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-bold text-[#2D2B42] tracking-tight">Allocation</h3>
      </div>

      <div className="flex flex-col items-center">
        <div className="relative w-40 h-40 flex items-center justify-center">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={70}
                paddingAngle={0}
                dataKey="value"
                stroke="none"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} strokeWidth={0} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute flex flex-col items-center justify-center pointer-events-none">
            <span className="text-xl font-bold text-[#2D2B42]">100%</span>
          </div>
        </div>

        <div className="w-full mt-4 space-y-3">
          {data.map((item, idx) => (
            <div key={idx} className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="text-[#8F8F9D] font-medium">{item.name}</span>
              </div>
              <span className="font-bold text-[#2D2B42]">{item.value}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
