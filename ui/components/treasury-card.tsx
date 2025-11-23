import { Wallet } from "lucide-react"

const TREASURY_DATA = {
  balance: 121491.01,
  currency: "xUSDC",
  apr: 3.2,
}
interface TreasuryCardProps {
  balance: string;
}

export function TreasuryCard({ balance }: TreasuryCardProps) {
  return (
    <div className="relative overflow-hidden rounded-[32px] p-8 text-white shadow-[0_20px_40px_-10px_rgba(45,43,66,0.05)]">
      <div className="absolute inset-0 bg-gradient-to-br from-[#A78BFA] to-[#F472B6]"></div>
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>

      <div className="relative z-10 flex justify-between items-start">
        <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-md">
          <Wallet className="text-white" size={24} />
        </div>
        <div className="px-4 py-4 rounded-full bg-white/20 backdrop-blur-md text-xs font-bold tracking-wide">
          +{TREASURY_DATA.apr}% APR
        </div>
      </div>

      <div className="relative z-10 mt-8">
        <p className="text-white/80 font-medium text-sm mb-1">Liquid Balance</p>
        <h3 className="text-4xl font-bold tracking-tight">
        {Number(balance).toLocaleString("en-US", {
            minimumFractionDigits: 2,
          })}
          <span className="text-lg opacity-60 ml-2 font-normal">{TREASURY_DATA.currency}</span>
        </h3>
      </div>
    </div>
  )
}
