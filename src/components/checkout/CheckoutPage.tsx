import { Check, MapPin, CheckCircle, CreditCard, ChevronDown, ArrowRight, ArrowLeft, Truck } from 'lucide-react'

const STEPS = [
  { key: 'box', label: 'เลือกกล่อง', icon: Check, done: true },
  { key: 'address', label: 'กรอกที่อยู่', icon: MapPin, active: true },
  { key: 'confirm', label: 'ยืนยัน', icon: CheckCircle },
  { key: 'payment', label: 'ชำระเงิน', icon: CreditCard },
]

export default function CheckoutPage() {
  return (
    <div className="flex flex-col gap-6 pb-32">
      {/* Step Indicator */}
      <section>
        <div className="flex justify-between items-start w-full relative">
          {/* Progress line */}
          <div className="absolute top-4 left-0 w-full h-0.5 bg-gray-200 -z-10">
            <div className="h-full bg-blue-500 transition-all duration-500" style={{ width: '33%' }} />
          </div>

          {STEPS.map(({ key, label, icon: Icon, done, active }) => (
            <div key={key} className="flex flex-col items-center gap-1.5 flex-1">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center shadow-sm ${
                  done || active ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-400'
                } ${active ? 'ring-4 ring-blue-100' : ''}`}
              >
                <Icon size={16} />
              </div>
              <span className={`text-[11px] font-semibold ${active ? 'text-blue-600' : done ? 'text-gray-500' : 'text-gray-400'}`}>
                {label}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* Address Form */}
      <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-5">รายละเอียดที่อยู่จัดส่ง</h2>
        <form className="flex flex-col gap-4" onSubmit={(e) => e.preventDefault()}>
          {/* Full name */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold uppercase text-gray-400 tracking-wider">ชื่อ-นามสกุล</label>
            <input
              type="text"
              placeholder="ระบุชื่อจริงและนามสกุล"
              className="w-full bg-white border border-gray-200 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all"
            />
          </div>

          {/* Phone */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold uppercase text-gray-400 tracking-wider">เบอร์โทรศัพท์</label>
            <input
              type="tel"
              placeholder="08X-XXX-XXXX"
              className="w-full bg-white border border-gray-200 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all"
            />
          </div>

          {/* Address */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold uppercase text-gray-400 tracking-wider">บ้านเลขที่, ถนน, ซอย</label>
            <textarea
              rows={3}
              placeholder="ระบุเลขที่บ้าน หมู่บ้าน ถนน ซอย"
              className="w-full bg-white border border-gray-200 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all resize-none"
            />
          </div>

          {/* Province */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold uppercase text-gray-400 tracking-wider">จังหวัด</label>
            <div className="relative">
              <select className="w-full bg-white border border-gray-200 rounded-lg px-4 py-3 text-sm appearance-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all">
                <option value="">เลือกจังหวัด</option>
                <option>กรุงเทพมหานคร</option>
                <option>เชียงใหม่</option>
                <option>ขอนแก่น</option>
              </select>
              <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400" />
            </div>
          </div>

          {/* District & Subdistrict */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold uppercase text-gray-400 tracking-wider">อำเภอ/เขต</label>
              <div className="relative">
                <select className="w-full bg-white border border-gray-200 rounded-lg px-4 py-3 text-sm appearance-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none">
                  <option value="">ระบุอำเภอ</option>
                </select>
                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400" />
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold uppercase text-gray-400 tracking-wider">ตำบล/แขวง</label>
              <div className="relative">
                <select className="w-full bg-white border border-gray-200 rounded-lg px-4 py-3 text-sm appearance-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none">
                  <option value="">ระบุตำบล</option>
                </select>
                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400" />
              </div>
            </div>
          </div>

          {/* Postal code */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold uppercase text-gray-400 tracking-wider">รหัสไปรษณีย์</label>
            <input
              type="number"
              placeholder="XXXXX"
              className="w-full bg-white border border-gray-200 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all"
            />
          </div>
        </form>
      </section>

      {/* Shipping summary */}
      <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex items-center gap-4">
        <div className="bg-blue-600 text-white p-2 rounded-lg">
          <Truck size={18} />
        </div>
        <div>
          <p className="text-sm font-semibold text-blue-700">จัดส่งด่วน (Express)</p>
          <p className="text-xs text-gray-500">ระยะเวลา 1-3 วันทำการ</p>
        </div>
      </div>

      {/* Fixed bottom action buttons */}
      <div className="fixed bottom-0 left-0 w-full bg-white shadow-[0_-4px_24px_rgba(0,0,0,0.06)] px-4 py-4 z-50">
        <div className="max-w-2xl mx-auto flex gap-3">
          <button className="flex-1 py-3 border border-blue-600 text-blue-600 font-semibold rounded-xl text-sm hover:bg-blue-50 active:scale-95 transition-all flex items-center justify-center gap-2">
            <ArrowLeft size={16} /> ย้อนกลับ
          </button>
          <button className="flex-[2] py-3 bg-blue-600 text-white font-semibold rounded-xl text-sm hover:bg-blue-700 active:scale-95 transition-all shadow-lg shadow-blue-200 flex items-center justify-center gap-2">
            ถัดไป <ArrowRight size={16} />
          </button>
        </div>
      </div>
    </div>
  )
}
