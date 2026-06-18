import { Check } from 'lucide-react'

type StepKey = 'summary' | 'payment' | 'verify' | 'packing' | 'address' | 'done'

const ALL_STEPS: Array<{ key: StepKey; label: string }> = [
  { key: 'summary',  label: 'สรุปยอด' },
  { key: 'payment',  label: 'ชำระเงิน' },
  { key: 'verify',   label: 'ตรวจสลิป' },
  { key: 'packing',  label: 'จัดกล่อง' },
  { key: 'address',  label: 'ที่อยู่' },
  { key: 'done',     label: 'เสร็จ' },
]

interface Props {
  current: StepKey
  hasMultipleItems: boolean
}

export default function StepIndicator({ current, hasMultipleItems }: Props) {
  const steps = hasMultipleItems
    ? ALL_STEPS
    : ALL_STEPS.filter(s => s.key !== 'packing')

  const currentIdx = steps.findIndex(s => s.key === current)

  return (
    <div className="py-5 mb-2">
      {/* Progress bar */}
      <div className="relative flex items-center justify-between">
        {/* Track line */}
        <div className="absolute left-0 top-[18px] w-full h-0.5 bg-gray-200 -z-10">
          <div
            className="h-full bg-blue-500 transition-all duration-500"
            style={{ width: `${(currentIdx / (steps.length - 1)) * 100}%` }}
          />
        </div>

        {steps.map((s, idx) => {
          const isDone = idx < currentIdx
          const isActive = idx === currentIdx
          return (
            <div key={s.key} className="flex flex-col items-center gap-1 flex-1">
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 shadow-sm border-2 ${
                  isDone
                    ? 'bg-green-500 border-green-500 text-white'
                    : isActive
                    ? 'bg-blue-600 border-blue-600 text-white ring-4 ring-blue-100'
                    : 'bg-white border-gray-200 text-gray-400'
                }`}
              >
                {isDone ? <Check size={16} /> : <span>{idx + 1}</span>}
              </div>
              <span
                className={`text-[10px] font-semibold text-center leading-tight ${
                  isActive ? 'text-blue-600' : isDone ? 'text-green-600' : 'text-gray-400'
                }`}
              >
                {s.label}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
