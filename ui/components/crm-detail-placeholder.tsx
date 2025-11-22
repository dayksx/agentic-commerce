import { Users } from "lucide-react"

export function CrmDetailPlaceholder() {
  return (
    <div className="relative rounded-[32px] border-2 border-dashed border-[#E0E0EB] bg-[#FAFAFC] flex flex-col items-center justify-center h-full min-h-[200px]">
      <div className="w-16 h-16 rounded-full bg-[#F0F0F5] flex items-center justify-center text-[#8F8F9D] mb-4">
        <Users size={24} />
      </div>
      <h3 className="text-lg font-bold text-[#2D2B42]">Client Details</h3>
      <p className="text-sm text-[#8F8F9D] mt-1">Select a client to view connection history</p>
    </div>
  )
}
