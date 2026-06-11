import { useState, useEffect } from 'react'
import { Check, MapPin, CheckCircle, CreditCard, Package } from 'lucide-react'

const STEPS = [
  { key: 'box', label: 'เลือกกล่อง', icon: Check, done: true },
  { key: 'address', label: 'กรอกที่อยู่', icon: MapPin, active: true },
  { key: 'confirm', label: 'ยืนยัน', icon: CheckCircle },
  { key: 'payment', label: 'ชำระเงิน', icon: CreditCard },
]

export default function CheckoutPage({ orderId }: { orderId: string }) {
  const [order, setOrder] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)

  const [form, setForm] = useState({
    display_name: '',
    phone: '',
    address_detail: '',
    subdistrict: '',
    district: '',
    province: '',
    zipcode: ''
  })

  useEffect(() => {
    if (!orderId) {
      setLoading(false)
      return
    }
    fetch(`/api/orders/${orderId}/checkout`)
      .then(res => res.json())
      .then(data => {
        if (!data.error) {
          setOrder(data)
          if (data.customers) {
            setForm({
              display_name: data.customers.display_name || '',
              phone: data.customers.phone || '',
              address_detail: data.customers.address_detail || '',
              subdistrict: data.customers.subdistrict || '',
              district: data.customers.district || '',
              province: data.customers.province || '',
              zipcode: data.customers.zipcode || ''
            })
            // หากมีที่อยู่แล้ว ถือว่า success เลย
            if (data.customers.address_detail || data.customers.subdistrict) {
              setSuccess(true)
            }
          }
        }
      })
      .finally(() => setLoading(false))
  }, [orderId])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!order?.customers?.id) return

    setSaving(true)
    try {
      const res = await fetch(`/api/customers/${order.customers.id}/address`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      })
      const data = await res.json()
      if (data.success) {
        setSuccess(true)
      } else {
        alert(data.error || 'เกิดข้อผิดพลาด')
      }
    } catch (err) {
      alert('เกิดข้อผิดพลาดในการเชื่อมต่อ')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="text-center py-20 text-gray-500">กำลังโหลด...</div>
  if (!order) return <div className="text-center py-20 text-gray-500">ไม่พบออเดอร์ หรือออเดอร์ถูกลบไปแล้ว</div>

  return (
    <div className="flex flex-col gap-6 pb-32 max-w-xl mx-auto">
      {/* Step Indicator */}
      <section>
        <div className="flex justify-between items-start w-full relative">
          <div className="absolute top-4 left-0 w-full h-0.5 bg-gray-200 -z-10">
            <div className="h-full bg-blue-500 transition-all duration-500" style={{ width: success ? '66%' : '33%' }} />
          </div>

          {STEPS.map(({ key, label, icon: Icon, done, active }, index) => {
             const isDone = success ? index <= 2 : done
             const isActive = success ? index === 2 : active
             return (
              <div key={key} className="flex flex-col items-center gap-1.5 flex-1">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center shadow-sm ${
                    isDone || isActive ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-400'
                  } ${isActive ? 'ring-4 ring-blue-100' : ''}`}
                >
                  <Icon size={16} />
                </div>
                <span className={`text-[11px] font-semibold ${isActive ? 'text-blue-600' : isDone ? 'text-gray-500' : 'text-gray-400'}`}>
                  {label}
                </span>
              </div>
            )
          })}
        </div>
      </section>

      {/* Order Summary */}
      <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <Package size={20} className="text-blue-500"/>
          สรุปออเดอร์: {order.order_number}
        </h2>
        <div className="flex flex-col gap-3">
          {order.order_items?.map((item: any, i: number) => (
            <div key={i} className="flex justify-between items-center text-sm">
              <span className="text-gray-700">{item.quantity}x {item.product_name}</span>
              <span className="font-semibold">฿{(item.price * item.quantity).toLocaleString()}</span>
            </div>
          ))}
          <div className="h-px bg-gray-100 my-1"/>
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-500">ค่าจัดส่ง</span>
            <span className="font-semibold">฿{order.shipping_fee}</span>
          </div>
          <div className="flex justify-between items-center text-base pt-2 font-bold">
            <span className="text-gray-800">ยอดรวมทั้งสิ้น</span>
            <span className="text-blue-600">฿{order.total.toLocaleString()}</span>
          </div>
        </div>
      </section>

      {/* Address Form */}
      {success ? (
         <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-8 text-center flex flex-col items-center gap-4">
           <div className="w-16 h-16 bg-emerald-500 text-white rounded-full flex items-center justify-center">
             <CheckCircle size={32} />
           </div>
           <div>
             <h2 className="text-xl font-bold text-emerald-800 mb-1">บันทึกสำเร็จ ✅</h2>
             <p className="text-emerald-600 font-medium">รอรับพัสดุได้เลย แอดมินกำลังเตรียมจัดส่งค่ะ</p>
           </div>
         </div>
      ) : (
        <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-5">รายละเอียดที่อยู่จัดส่ง</h2>
          <form className="flex flex-col gap-4" onSubmit={handleSave}>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold uppercase text-gray-400 tracking-wider">ชื่อ-นามสกุล</label>
              <input type="text" name="display_name" value={form.display_name} onChange={handleChange} required placeholder="ระบุชื่อจริงและนามสกุล" className="w-full bg-white border border-gray-200 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all" />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold uppercase text-gray-400 tracking-wider">เบอร์โทรศัพท์</label>
              <input type="tel" name="phone" value={form.phone} onChange={handleChange} required placeholder="08X-XXX-XXXX" className="w-full bg-white border border-gray-200 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all" />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold uppercase text-gray-400 tracking-wider">บ้านเลขที่, ถนน, ซอย</label>
              <textarea name="address_detail" value={form.address_detail} onChange={handleChange} required rows={3} placeholder="ระบุเลขที่บ้าน หมู่บ้าน ถนน ซอย" className="w-full bg-white border border-gray-200 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all resize-none" />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold uppercase text-gray-400 tracking-wider">จังหวัด</label>
              <input type="text" name="province" value={form.province} onChange={handleChange} required placeholder="เช่น กรุงเทพมหานคร" className="w-full bg-white border border-gray-200 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold uppercase text-gray-400 tracking-wider">อำเภอ/เขต</label>
                <input type="text" name="district" value={form.district} onChange={handleChange} required placeholder="เขต/อำเภอ" className="w-full bg-white border border-gray-200 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all" />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold uppercase text-gray-400 tracking-wider">ตำบล/แขวง</label>
                <input type="text" name="subdistrict" value={form.subdistrict} onChange={handleChange} required placeholder="แขวง/ตำบล" className="w-full bg-white border border-gray-200 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all" />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold uppercase text-gray-400 tracking-wider">รหัสไปรษณีย์</label>
              <input type="text" name="zipcode" value={form.zipcode} onChange={handleChange} required placeholder="XXXXX" className="w-full bg-white border border-gray-200 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all" />
            </div>

            <button type="submit" disabled={saving} className="mt-4 w-full py-3 bg-blue-600 text-white font-semibold rounded-xl text-sm hover:bg-blue-700 active:scale-95 transition-all shadow-lg shadow-blue-200 disabled:opacity-50 flex justify-center">
              {saving ? 'กำลังบันทึก...' : 'บันทึกที่อยู่จัดส่ง'}
            </button>
          </form>
        </section>
      )}
    </div>
  )
}
