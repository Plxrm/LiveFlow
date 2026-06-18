import { useState, useEffect } from 'react'
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

const emptyForm = (): AddressForm => ({
  display_name: '',
  phone: '',
  address_detail: '',
  subdistrict: '',
  district: '',
  province: '',
  zipcode: '',
})

interface BoxInfo {
  box_id: string
  box_number: number
  item_names: string[]
}

export default function AddressStep({ customer, customerId, orders, onNext, onBack }: Props) {
  const [boxes, setBoxes] = useState<BoxInfo[]>([])
  const [loadingBoxes, setLoadingBoxes] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Each box has its own address form. Box index 0 is always filled.
  const [forms, setForms] = useState<AddressForm[]>([emptyForm()])
  // Whether each box (from index 1+) uses box 0's address
  const [sameAsFirst, setSameAsFirst] = useState<boolean[]>([])

  // Load box data from the API (set in PackingStep)
  useEffect(() => {
    const orderIds = orders.map(o => o.id)
    if (!orderIds.length) {
      setLoadingBoxes(false)
      return
    }
    fetch(`/api/checkout/boxes?order_ids=${orderIds.join(',')}`)
      .then(r => r.json())
      .then(data => {
        const boxList: BoxInfo[] = data.boxes || []
        if (boxList.length === 0) {
          // Single implicit box — use all items
          setBoxes([{
            box_id: 'single',
            box_number: 1,
            item_names: orders.flatMap(o =>
              (o.order_items || []).map(i => i.product_name)
            ),
          }])
          setForms([emptyForm()])
          setSameAsFirst([])
        } else {
          setBoxes(boxList)
          setForms(boxList.map(() => emptyForm()))
          setSameAsFirst(boxList.slice(1).map(() => true))
        }
      })
      .catch(() => {
        // Fallback: treat as single box
        setBoxes([{
          box_id: 'single',
          box_number: 1,
          item_names: orders.flatMap(o =>
            (o.order_items || []).map(i => i.product_name)
          ),
        }])
        setForms([emptyForm()])
        setSameAsFirst([])
      })
      .finally(() => setLoadingBoxes(false))
  }, [orders])

  const handleFormChange = (
    boxIdx: number,
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setForms(prev => {
      const next = [...prev]
      next[boxIdx] = { ...next[boxIdx], [e.target.name]: e.target.value }
      return next
    })
  }

  const toggleSameAsFirst = (boxIdx: number) => {
    // boxIdx is 1-based (for sameAsFirst array index = boxIdx - 1)
    const arrIdx = boxIdx - 1
    setSameAsFirst(prev => {
      const next = [...prev]
      next[arrIdx] = !next[arrIdx]
      return next
    })
  }

  const getEffectiveForm = (boxIdx: number): AddressForm => {
    if (boxIdx === 0) return forms[0]
    if (sameAsFirst[boxIdx - 1]) return forms[0]
    return forms[boxIdx]
  }

  const validate = (): boolean => {
    for (let i = 0; i < boxes.length; i++) {
      const f = getEffectiveForm(i)
      if (!f.display_name || !f.phone || !f.address_detail ||
        !f.subdistrict || !f.district || !f.province || !f.zipcode) {
        setError(`กรุณากรอกที่อยู่ให้ครบสำหรับกล่องที่ ${i + 1}`)
        return false
      }
    }
    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!validate()) return

    setSaving(true)
    try {
      const boxesPayload = boxes.map((box, i) => ({
        box_id: box.box_id,
        address: getEffectiveForm(i),
      }))

      const res = await fetch('/api/checkout/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_id: customerId,
          boxes: boxesPayload,
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

  if (loadingBoxes) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-4">
        <Loader2 size={32} className="text-blue-500 animate-spin" />
        <p className="text-gray-500 text-sm">กำลังโหลดข้อมูลกล่อง...</p>
      </div>
    )
  }

  const multiBox = boxes.length > 1

  return (
    <div className="flex flex-col gap-4">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-50 flex items-center gap-2">
          <MapPin size={18} className="text-blue-600" />
          <h3 className="text-sm font-bold text-gray-700">ที่อยู่จัดส่ง</h3>
        </div>

        <form onSubmit={handleSubmit} className="p-5 flex flex-col gap-5">
          {boxes.map((box, boxIdx) => {
            const isSame = boxIdx > 0 && sameAsFirst[boxIdx - 1]
            const form = isSame ? forms[0] : forms[boxIdx]

            return (
              <div key={box.box_id} className={`flex flex-col gap-4 ${multiBox ? 'p-4 border border-gray-100 rounded-2xl' : ''}`}>
                {/* Box header */}
                {multiBox && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-blue-700">📦 กล่องที่ {box.box_number}</span>
                    </div>
                    <span className="text-xs text-gray-400 truncate max-w-[120px]">
                      {box.item_names.slice(0, 2).join(', ')}
                      {box.item_names.length > 2 ? ` +${box.item_names.length - 2}` : ''}
                    </span>
                  </div>
                )}

                {/* Same as first checkbox (box 2+) */}
                {boxIdx > 0 && (
                  <label className="flex items-center gap-3 cursor-pointer bg-blue-50 rounded-xl px-4 py-3">
                    <input
                      type="checkbox"
                      checked={sameAsFirst[boxIdx - 1]}
                      onChange={() => toggleSameAsFirst(boxIdx)}
                      className="w-5 h-5 accent-blue-600 rounded flex-shrink-0"
                    />
                    <span className="text-sm font-semibold text-blue-700">
                      ใช้ที่อยู่เดียวกับกล่องที่ 1
                    </span>
                  </label>
                )}

                {/* Address fields */}
                {!isSame && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <label className={labelClass}>ชื่อ-นามสกุล</label>
                      <input
                        type="text"
                        name="display_name"
                        value={form.display_name}
                        onChange={e => handleFormChange(boxIdx, e)}
                        required={!isSame}
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
                        onChange={e => handleFormChange(boxIdx, e)}
                        required={!isSame}
                        placeholder="08X-XXX-XXXX"
                        className={inputClass}
                      />
                    </div>

                    <div className="col-span-2">
                      <label className={labelClass}>บ้านเลขที่ / ถนน / ซอย</label>
                      <textarea
                        name="address_detail"
                        value={form.address_detail}
                        onChange={e => handleFormChange(boxIdx, e)}
                        required={!isSame}
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
                        onChange={e => handleFormChange(boxIdx, e)}
                        required={!isSame}
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
                        onChange={e => handleFormChange(boxIdx, e)}
                        required={!isSame}
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
                        onChange={e => handleFormChange(boxIdx, e)}
                        required={!isSame}
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
                        onChange={e => handleFormChange(boxIdx, e)}
                        required={!isSame}
                        placeholder="XXXXX"
                        maxLength={5}
                        className={inputClass}
                      />
                    </div>
                  </div>
                )}

                {/* Show preview when using same address */}
                {isSame && (
                  <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-xs text-green-700">
                    ✅ ใช้ที่อยู่เดียวกับกล่องที่ 1:<br />
                    <strong>{forms[0].display_name}</strong> · {forms[0].address_detail} · {forms[0].province}
                  </div>
                )}
              </div>
            )
          })}

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
