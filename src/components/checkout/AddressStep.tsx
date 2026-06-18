import { useState } from 'react'
import { ArrowLeft, MapPin, Loader2 } from 'lucide-react'
import type { Customer, Order } from './CheckoutFlow'

interface Props {
  customer: Customer | null
  customerId: string
  orders: Order[]
  onNext: (shipments: any[]) => void
  onBack: () => void
}

interface AddressForm {
  display_name: string
  phone: string
  address_detail: string
  subdistrict: string
  district: string
  province: string
  zipcode: string
}

export default function AddressStep({ customer, customerId, orders, onNext, onBack }: Props) {
  const [form, setForm] = useState<AddressForm>({
    display_name: customer?.display_name || '',
    phone: customer?.phone || '',
    address_detail: customer?.address_detail || '',
    subdistrict: customer?.subdistrict || '',
    district: customer?.district || '',
    province: customer?.province || '',
    zipcode: customer?.zipcode || '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)

    try {
      const res = await fetch('/api/checkout/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_id: customerId,
          address: form,
          order_ids: orders.map(o => o.id),
        }),
      })
      const data = await res.json()
      if (!res.ok || data.error) throw new Error(data.error || 'บันทึกไม่สำเร็จ')
      onNext(data.shipments || [])
    } catch (err: any) {
      setError(err.message || 'เกิดข้อผิดพลาด')
    } finally {
      setSaving(false)
    }
  }

  const inputClass =
    'w-full bg-white border border-gray-200 rounded-xl px-4 py-3.5 text-base font-medium text-gray-800 focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all placeholder:text-gray-300'
  const labelClass = 'text-xs font-bold uppercase text-gray-400 tracking-wider mb-1.5 block'

  return (
    <div className="flex flex-col gap-4">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-50 flex items-center gap-2">
          <MapPin size={18} className="text-blue-600" />
          <h3 className="text-sm font-bold text-gray-700">ที่อยู่จัดส่ง</h3>
        </div>

        {customer?.address_detail && (
          <div className="mx-5 mt-4 bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-xs text-green-700">
            ✅ ดึงที่อยู่เดิมมาให้แล้ว ตรวจสอบก่อนยืนยัน
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-5 flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className={labelClass}>ชื่อ-นามสกุล</label>
              <input
                type="text"
                name="display_name"
                value={form.display_name}
                onChange={handleChange}
                required
                placeholder="ชื่อจริง นามสกุล"
                className={inputClass}
              />
            </div>

            <div className="col-span-2">
              <label className={labelClass}>เบอร์โทร</label>
              <input
                type="tel"
                name="phone"
                value={form.phone}
                onChange={handleChange}
                required
                placeholder="08X-XXX-XXXX"
                className={inputClass}
              />
            </div>

            <div className="col-span-2">
              <label className={labelClass}>บ้านเลขที่ / ถนน / ซอย</label>
              <textarea
                name="address_detail"
                value={form.address_detail}
                onChange={handleChange}
                required
                rows={2}
                placeholder="เลขที่บ้าน หมู่บ้าน ถนน ซอย"
                className={`${inputClass} resize-none`}
              />
            </div>

            <div>
              <label className={labelClass}>แขวง/ตำบล</label>
              <input
                type="text"
                name="subdistrict"
                value={form.subdistrict}
                onChange={handleChange}
                required
                placeholder="แขวง/ตำบล"
                className={inputClass}
              />
            </div>

            <div>
              <label className={labelClass}>เขต/อำเภอ</label>
              <input
                type="text"
                name="district"
                value={form.district}
                onChange={handleChange}
                required
                placeholder="เขต/อำเภอ"
                className={inputClass}
              />
            </div>

            <div>
              <label className={labelClass}>จังหวัด</label>
              <input
                type="text"
                name="province"
                value={form.province}
                onChange={handleChange}
                required
                placeholder="จังหวัด"
                className={inputClass}
              />
            </div>

            <div>
              <label className={labelClass}>รหัสไปรษณีย์</label>
              <input
                type="text"
                name="zipcode"
                value={form.zipcode}
                onChange={handleChange}
                required
                placeholder="XXXXX"
                maxLength={5}
                className={inputClass}
              />
            </div>
          </div>

          {error && (
            <p className="text-sm text-red-500 text-center bg-red-50 rounded-xl px-4 py-3">{error}</p>
          )}

          <div className="flex gap-3 mt-1">
            <button
              type="button"
              onClick={onBack}
              className="flex items-center gap-2 px-5 py-4 border-2 border-gray-200 text-gray-600 font-bold rounded-2xl active:scale-95 transition-transform"
            >
              <ArrowLeft size={18} />
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-4 bg-blue-600 text-white font-bold text-base rounded-2xl shadow-lg shadow-blue-200 flex items-center justify-center gap-2 active:scale-95 transition-transform disabled:opacity-50"
            >
              {saving ? (
                <><Loader2 size={18} className="animate-spin" /> กำลังบันทึก...</>
              ) : (
                'ยืนยัน ✓'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
