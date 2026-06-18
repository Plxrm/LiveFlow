import { useState } from 'react'
import { ArrowLeft, ArrowRight, Plus, Package, Layers, ChevronDown } from 'lucide-react'
import type { Order, OrderItem } from './CheckoutFlow'

interface BoxItem extends OrderItem {
  order_id: string
}

interface Box {
  id: string
  items: BoxItem[]
}

interface Props {
  orders: Order[]
  customerId: string
  onNext: () => void
  onBack: () => void
}

export default function PackingStep({ orders, customerId, onNext, onBack }: Props) {
  // Initialize with all items in one box
  const allItems: BoxItem[] = orders.flatMap(o =>
    (o.order_items || []).map(item => ({ ...item, order_id: o.id }))
  )

  const [boxes, setBoxes] = useState<Box[]>([
    { id: 'box-1', items: allItems },
  ])
  const [saving, setSaving] = useState(false)

  const addBox = () => {
    setBoxes(prev => [
      ...prev,
      { id: `box-${Date.now()}`, items: [] },
    ])
  }

  const mergeAll = () => {
    setBoxes([{ id: 'box-1', items: allItems }])
  }

  const moveItem = (item: BoxItem, fromBoxId: string, toBoxId: string) => {
    if (fromBoxId === toBoxId) return
    setBoxes(prev =>
      prev.map(box => {
        if (box.id === fromBoxId) {
          return { ...box, items: box.items.filter(i => i.id !== item.id) }
        }
        if (box.id === toBoxId) {
          return { ...box, items: [...box.items, item] }
        }
        return box
      })
    )
  }

  const handleSaveAndNext = async () => {
    setSaving(true)
    try {
      const payload = {
        order_ids: orders.map(o => o.id),
        boxes: boxes.map(box => ({
          items: box.items.map(item => ({
            order_item_id: item.id,
            quantity: item.quantity,
          })),
        })),
      }
      await fetch('/api/checkout/boxes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      onNext()
    } catch {
      onNext() // skip box saving on error, still proceed
    } finally {
      setSaving(false)
    }
  }

  const otherBoxes = (currentBoxId: string) =>
    boxes.filter(b => b.id !== currentBoxId)

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg">📦</span>
            <h3 className="text-sm font-bold text-gray-700">จัดกล่อง</h3>
          </div>
          <span className="text-xs text-gray-400">{boxes.length} กล่อง</span>
        </div>
        <div className="px-5 py-3 bg-blue-50 text-xs text-blue-700">
          แต่ละกล่อง = จัดส่งแยก • กดปุ่มย้ายสินค้าระหว่างกล่อง
        </div>
      </div>

      {/* Boxes */}
      {boxes.map((box, boxIdx) => (
        <div
          key={box.id}
          className="bg-white rounded-2xl shadow-sm border-2 border-blue-100 overflow-hidden"
        >
          {/* Box header */}
          <div className="px-4 py-3 bg-blue-50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Package size={16} className="text-blue-600" />
              <span className="text-sm font-bold text-blue-700">กล่องที่ {boxIdx + 1}</span>
            </div>
            <span className="text-xs text-blue-500">{box.items.length} ชิ้น</span>
          </div>

          {box.items.length === 0 ? (
            <div className="px-4 py-8 text-center text-gray-400 text-sm">
              ยังไม่มีสินค้า
            </div>
          ) : (
            <div className="flex flex-col divide-y divide-gray-50">
              {box.items.map(item => (
                <div key={item.id} className="px-4 py-3">
                  <div className="flex items-start justify-between gap-3">
                    {/* Item info */}
                    <div className="flex items-center gap-2.5 flex-1 min-w-0">
                      <div className="w-1.5 h-8 bg-blue-300 rounded-full flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-gray-800 leading-tight truncate">
                          {item.product_name}
                        </p>
                        <p className="text-xs text-gray-400">
                          {item.quantity > 1 ? `× ${item.quantity} · ` : ''}
                          ฿{(item.price * item.quantity).toLocaleString()}
                        </p>
                      </div>
                    </div>

                    {/* Move buttons (touch-friendly) */}
                    {boxes.length > 1 && (
                      <div className="flex-shrink-0">
                        {otherBoxes(box.id).length === 1 ? (
                          // Single other box → simple button
                          <button
                            onClick={() => moveItem(item, box.id, otherBoxes(box.id)[0].id)}
                            className="flex items-center gap-1 text-xs font-semibold text-blue-600 bg-blue-50 border border-blue-200 px-3 py-2 rounded-xl active:scale-95 transition-transform whitespace-nowrap"
                          >
                            ย้ายไปกล่อง {boxes.indexOf(otherBoxes(box.id)[0]) + 1} →
                          </button>
                        ) : (
                          // Multiple other boxes → dropdown
                          <div className="relative">
                            <select
                              className="appearance-none text-xs font-semibold text-blue-600 bg-blue-50 border border-blue-200 px-3 py-2 pr-7 rounded-xl outline-none active:scale-95 transition-transform"
                              defaultValue=""
                              onChange={e => {
                                if (e.target.value) {
                                  moveItem(item, box.id, e.target.value)
                                  e.target.value = ''
                                }
                              }}
                            >
                              <option value="" disabled>ย้ายไป...</option>
                              {otherBoxes(box.id).map(tb => (
                                <option key={tb.id} value={tb.id}>
                                  กล่องที่ {boxes.indexOf(tb) + 1}
                                </option>
                              ))}
                            </select>
                            <ChevronDown
                              size={12}
                              className="absolute right-2 top-1/2 -translate-y-1/2 text-blue-500 pointer-events-none"
                            />
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}

      {/* Action row */}
      <div className="flex gap-3">
        <button
          onClick={addBox}
          className="flex-1 flex items-center justify-center gap-2 py-3 border-2 border-blue-200 text-blue-600 font-semibold text-sm rounded-xl active:bg-blue-50 transition-colors"
        >
          <Plus size={16} /> เพิ่มกล่อง
        </button>
        {boxes.length > 1 && (
          <button
            onClick={mergeAll}
            className="flex-1 flex items-center justify-center gap-2 py-3 border-2 border-gray-200 text-gray-600 font-semibold text-sm rounded-xl active:bg-gray-50 transition-colors"
          >
            <Layers size={16} /> รวมกล่องเดียว
          </button>
        )}
      </div>

      {/* Nav buttons */}
      <div className="flex gap-3 mt-1">
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-5 py-4 border-2 border-gray-200 text-gray-600 font-bold rounded-2xl active:scale-95 transition-transform"
        >
          <ArrowLeft size={18} />
        </button>
        <button
          onClick={handleSaveAndNext}
          disabled={saving}
          className="flex-1 py-4 bg-blue-600 text-white font-bold text-base rounded-2xl shadow-lg shadow-blue-200 flex items-center justify-center gap-2 active:scale-95 transition-transform disabled:opacity-50"
        >
          {saving ? 'กำลังบันทึก...' : <>ถัดไป <ArrowRight size={18} /></>}
        </button>
      </div>
    </div>
  )
}
