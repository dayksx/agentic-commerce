"use client"

import { Activity } from "lucide-react"
import { AgentIdentityCard } from "@/components/agent-card"
import { TreasuryCard } from "@/components/treasury-card"
import { AllocationPie } from "@/components/allocation-pie"
import { PaymentsTable } from "@/components/payments-table"
import { CrmTable } from "@/components/crm-table"
import { CrmDetailPlaceholder } from "@/components/crm-detail-placeholder"
import { useEffect, useState } from "react"

interface PaymentInfo {
  transactionHash: string;
  blockNumber: bigint | number;
  timestamp: Date | string;
  from: string;
  amount: string;
  amountUSD: string;
}

export default function Dashboard() {
  const [payments, setPayments] = useState<PaymentInfo[]>([]);
  const [isLoadingPayments, setIsLoadingPayments] = useState(true);

  useEffect(() => {
    async function fetchPayments() {
      try {
        const response = await fetch("/api/payments?limit=50");
        if (response.ok) {
          const data = await response.json();
          console.log(data);
          setPayments(data);
        }
      } catch (error) {
        console.error('Failed to fetch payments:', error);
      } finally {
        setIsLoadingPayments(false);
      }
    }

    fetchPayments();
  }, []) 

  return (
    <div className="min-h-screen bg-[#F4F4F8] p-6 md:p-10 font-sans selection:bg-[#FF9F7C] selection:text-white">
      <header className="mb-10 flex items-center justify-between max-w-[1600px] mx-auto">
        <div>
          <h1 className="text-3xl font-bold text-[#2D2B42] tracking-tight">Infrastructure</h1>
          <p className="text-sm font-medium text-[#8F8F9D] mt-1">November 22, 2025</p>
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

      <div className="flex flex-col md:flex-row gap-8 items-start max-w-[1600px] mx-auto">
        {/* LEFT COLUMN: Agent Economics */}
        <div className="w-full md:w-[360px] lg:w-[400px] flex-shrink-0 space-y-8">
          <AgentIdentityCard />
          <TreasuryCard />
          <div className="grid grid-cols-1 gap-8">
            <AllocationPie />
            
            {/* <PaymentsTable /> */}
          </div>
        </div>

        {/* RIGHT COLUMN: CRM Intelligence */}
        <div className="flex-1 w-full space-y-8 min-w-0">
          <div className="h-[50vh]">
              <PaymentsTable payments={payments} isLoading={isLoadingPayments} />
          </div>
            <CrmTable />
        </div>
      </div>
    </div>
  )
}
