import { ArrowDownLeft } from "lucide-react"

interface PaymentInfo {
  transactionHash: string;
  blockNumber: bigint | number;
  timestamp: Date | string;
  from: string;
  amount: string;
  amountUSD: string;
}

interface PaymentsTableProps {
  payments?: PaymentInfo[];
  isLoading?: boolean;
}

function formatRelativeTime(date: Date | string): string {
  const now = new Date();
  const then = typeof date === 'string' ? new Date(date) : date;
  const diffMs = now.getTime() - then.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return then.toLocaleDateString();
}

function shortenAddress(address: string): string {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function shortenHash(hash: string): string {
  return `${hash.slice(0, 8)}...${hash.slice(-6)}`;
}

function formatBlockNumber(blockNumber: bigint | number | string): string {
  const num = typeof blockNumber === 'string' ? parseInt(blockNumber, 10) : Number(blockNumber);
  return num.toLocaleString();
}

export function PaymentsTable({ payments = [], isLoading = false }: PaymentsTableProps) {
  if (isLoading) {
    return (
      <div className="bg-white rounded-[32px] border border-white/50 shadow-[0_20px_40px_-10px_rgba(45,43,66,0.05)] p-8 flex-1">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-bold text-[#2D2B42] tracking-tight">Payments</h3>
        </div>
        <div className="text-sm text-[#8F8F9D]">Loading payments...</div>
      </div>
    );
  }

  if (payments.length === 0) {
    return (
      <div className="bg-white rounded-[32px] border border-white/50 shadow-[0_20px_40px_-10px_rgba(45,43,66,0.05)] p-8 flex-1">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-bold text-[#2D2B42] tracking-tight">Payments</h3>
        </div>
        <div className="text-sm text-[#8F8F9D]">No payments found</div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-[32px] border-2 border-[#A78BFA]/20 shadow-[0_20px_40px_-10px_rgba(167,139,250,0.15)] h-full flex flex-col overflow-hidden">
      <div className="p-8 border-b-2 border-[#A78BFA]/30 bg-gradient-to-r from-[#A78BFA]/10 via-[#F472B6]/5 to-transparent">
        <h3 className="text-2xl font-bold text-[#2D2B42] tracking-tight">Payments</h3>
        <p className="text-sm text-[#8F8F9D] mt-1">Recent payment transactions</p>
      </div>
      <div className="flex-1 overflow-auto p-2">
        <table className="w-full text-left border-collapse">
          <thead className="sticky top-0 z-10 bg-white">
            <tr>
              <th className="p-6 text-[10px] font-bold text-[#8F8F9D] uppercase tracking-widest"></th>
              <th className="p-6 text-[10px] font-bold text-[#8F8F9D] uppercase tracking-widest">Tx Hash</th>
              <th className="p-6 text-[10px] font-bold text-[#8F8F9D] uppercase tracking-widest">Block</th>
              <th className="p-6 text-[10px] font-bold text-[#8F8F9D] uppercase tracking-widest">From</th>
              <th className="p-6 text-[10px] font-bold text-[#8F8F9D] uppercase tracking-widest">Time</th>
              <th className="p-6 text-[10px] font-bold text-[#8F8F9D] uppercase tracking-widest text-right">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#A78BFA]/10">
            {payments.map((payment) => {
              const amount = parseFloat(payment.amount);
              return (
                <tr key={payment.transactionHash} className="hover:bg-gradient-to-r hover:from-[#A78BFA]/5 hover:to-[#F472B6]/5 transition-colors cursor-pointer group rounded-xl">
                  <td className="p-6">
                    <div className="p-2 rounded-full bg-gradient-to-br from-[#A78BFA]/20 to-[#F472B6]/20 text-[#A78BFA] w-fit">
                      <ArrowDownLeft size={16} />
                    </div>
                  </td>
                  <td className="p-6">
                    <span className="font-mono text-sm font-semibold text-[#2D2B42]">
                      {shortenHash(payment.transactionHash)}
                    </span>
                  </td>
                  <td className="p-6">
                    <span className="text-sm font-medium text-[#8F8F9D] font-mono">
                      {formatBlockNumber(payment.blockNumber)}
                    </span>
                  </td>
                  <td className="p-6">
                    <span className="font-mono text-sm font-semibold text-[#2D2B42]">
                      {shortenAddress(payment.from)}
                    </span>
                  </td>
                  <td className="p-6">
                    <span className="text-sm font-medium text-[#8F8F9D]">
                      {formatRelativeTime(payment.timestamp)}
                    </span>
                  </td>
                  <td className="p-6 text-right">
                    <span className="text-sm font-bold bg-gradient-to-r from-[#A78BFA] to-[#F472B6] bg-clip-text text-transparent">
                      ${(amount * 1000).toFixed(2)}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
