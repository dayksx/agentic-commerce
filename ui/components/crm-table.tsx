import type React from "react"
import { Filter, Download } from "lucide-react"

const CRM_CLIENTS_DATA = [
  {
    id: 1,
    consumer: "0x71C...98A2",
    ip: "192.168.1.1",
    totalBill: 450.2,
    loyalty: 98,
    reputation: "High",
    price: 0.05,
    date: "Oct 24",
  },
  {
    id: 2,
    consumer: "0x32B...4B1C",
    ip: "10.0.0.55",
    totalBill: 120.5,
    loyalty: 45,
    reputation: "Med",
    price: 0.06,
    date: "Oct 22",
  },
  {
    id: 3,
    consumer: "0x99F...3F22",
    ip: "172.16.0.8",
    totalBill: 890.0,
    loyalty: 92,
    reputation: "High",
    price: 0.04,
    date: "Oct 21",
  },
  {
    id: 4,
    consumer: "0xAA1...9001",
    ip: "192.168.1.12",
    totalBill: 32.1,
    loyalty: 20,
    reputation: "Low",
    price: 0.08,
    date: "Oct 20",
  },
  {
    id: 5,
    consumer: "0xBB2...1123",
    ip: "10.2.4.1",
    totalBill: 210.44,
    loyalty: 75,
    reputation: "Good",
    price: 0.05,
    date: "Oct 19",
  },
  {
    id: 6,
    consumer: "0xCC3...4455",
    ip: "192.168.0.99",
    totalBill: 1200.5,
    loyalty: 99,
    reputation: "Elite",
    price: 0.03,
    date: "Oct 18",
  },
]

const Badge = ({
  children,
  type = "neutral",
}: { children: React.ReactNode; type?: "neutral" | "success" | "purple" }) => {
  const styles = {
    neutral: "bg-[#F0F0F5] text-[#6E6E7A]",
    success: "bg-[#D4FF00] text-[#4A5900]", // Neon Lime style
    purple: "bg-[#F3F0FF] text-[#7C3AED]",
  }
  return (
    <span className={`px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-wider ${styles[type]}`}>
      {children}
    </span>
  )
}

export function CrmTable() {
  return (
    <div className="bg-white rounded-[32px] border border-white/50 shadow-[0_20px_40px_-10px_rgba(45,43,66,0.05)] h-full flex flex-col overflow-hidden">
      <div className="p-8 border-b border-[#F0F0F5] flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold text-[#2D2B42] tracking-tight">CRM Intelligence</h3>
          <p className="text-sm text-[#8F8F9D] mt-1">Active consumer connections</p>
        </div>
        <div className="flex gap-3">
          <button className="p-3 bg-[#FAFAFC] text-[#8F8F9D] rounded-2xl hover:bg-[#F0F0F5] transition-colors">
            <Filter size={20} />
          </button>
          <button className="px-6 py-3 bg-gradient-to-r from-[#FF9F7C] to-[#FF6B95] text-white rounded-2xl text-sm font-bold tracking-wide hover:opacity-90 transition-opacity shadow-lg shadow-pink-500/20 flex items-center gap-2">
            <Download size={16} />
            <span>Export Report</span>
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-2">
        <table className="w-full text-left border-collapse">
          <thead className="sticky top-0 z-10 bg-white">
            <tr>
              <th className="p-6 text-[10px] font-bold text-[#8F8F9D] uppercase tracking-widest">Consumer</th>
              <th className="p-6 text-[10px] font-bold text-[#8F8F9D] uppercase tracking-widest">IP Address</th>
              <th className="p-6 text-[10px] font-bold text-[#8F8F9D] uppercase tracking-widest">Date</th>
              <th className="p-6 text-[10px] font-bold text-[#8F8F9D] uppercase tracking-widest text-right">
                Total Bill
              </th>
              <th className="p-6 text-[10px] font-bold text-[#8F8F9D] uppercase tracking-widest text-center">
                Loyalty
              </th>
              <th className="p-6 text-[10px] font-bold text-[#8F8F9D] uppercase tracking-widest">Reputation</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#F4F4F8]">
            {CRM_CLIENTS_DATA.map((client) => (
              <tr key={client.id} className="hover:bg-[#FAFAFC] transition-colors cursor-pointer group rounded-xl">
                <td className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-[#F0F0F5] flex items-center justify-center text-xs font-bold text-[#8F8F9D]">
                      {client.consumer.substring(2, 4)}
                    </div>
                    <span className="font-mono text-sm font-semibold text-[#2D2B42]">{client.consumer}</span>
                  </div>
                </td>
                <td className="p-6 text-sm font-medium text-[#8F8F9D]">{client.ip}</td>
                <td className="p-6 text-sm font-medium text-[#8F8F9D]">{client.date}</td>
                <td className="p-6 text-sm font-bold text-[#2D2B42] text-right">${client.totalBill.toFixed(2)}</td>
                <td className="p-6 text-center">
                  <div className="text-sm font-bold text-[#2D2B42]">
                    {client.loyalty} <span className="text-[#8F8F9D] font-normal text-xs">/ 100</span>
                  </div>
                </td>
                <td className="p-6">
                  <Badge type={client.reputation === "Elite" ? "success" : "neutral"}>{client.reputation}</Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
