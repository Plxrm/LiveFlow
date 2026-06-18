import { useState } from 'react'
import { ArrowLeft, ArrowRight, Plus, Package, Layers } from 'lucide-react'
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
  const [dragItem, setDragItem] = useState<{ item: BoxItem; fromBoxId: string } | null>(null)

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
      prev
        .map(box => {
          if (box.id === fromBoxId) {
            return { ...box, items: box.items.filter(i => i.id !== item.id) }
          }
          if (box.id === toBoxId) {
            return { ...box, items: [...box.items, item] }
          }
          return box
        })
        .filter(box => box.items.length > 0 || boxes.indexOf(box) === 0) // keep at least first box
    )
  }

  const handleDrop = (e: React.DragEvent, toBoxId: string) => {
    e.preventDefault()
    if (!dragItem) return
    moveItem(dragItem.item, dragItem.fromBoxId, toBoxId)
    setDragItem(null)
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
          แต่ละกล่อง = จัดส่งแยก ลาก–วางสินค้าเพื่อแบ่งกล่อง
        </div>
      </div>

      {/* Boxes */}
      {boxes.map((box, boxIdx) => (
        <div
          key={box.id}
          onDragOver={e => e.preventDefault()}
          onDrop={e => handleDrop(e, box.id)}
          className="bg-white rounded-2xl shadow-sm border-2 border-dashed border-blue-200 overflow-hidden"
        >
          <div className="px-4 py-3 bg-blue-50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Package size={16} className="text-blue-600" />
              <span className="text-sm font-bold text-blue-700">กล่องที่ {boxIdx + 1}</span>
            </div>
            <span className="text-xs text-blue-500">{box.items.length} ชิ้น</span>
          </div>

          {box.items.length === 0 ? (
            <div className="px-4 py-8 text-center text-gray-400 text-sm">
              วางสินค้าที่นี่
            </div>
          ) : (
            <div className="flex flex-col divide-y divide-gray-50">
              {box.items.map(item => (
                <div
                  key={item.id}
                  draggable
                  onDragStart={() => setDragItem({ item, fromBoxId: box.id })}
                  className="flex items-center justify-between px-4 py-3 cursor-grab active:cursor-grabbing active:bg-blue-50"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-1.5 h-8 bg-blue-200 rounded-full" />
                    <div>
                      <p className="text-sm font-semibold text-gray-800 leading-tight">{item.product_name}</p>
                      {item.quantity > 1 && <p className="text-xs text-gray-400">× {item.quantity}</p>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-gray-700">฿{(item.price * item.quantity).toLocaleString()}</span>
                    {/* Quick move to other boxes */}
                    {boxes.length > 1 && boxes
                      .filter(b => b.id !== box.id)
                      .map(targetBox => (
                        <button
                          key={targetBox.id}
                          onClick={() => moveItem(item, box.id, targetBox.id)}
                          className="text-xs text-blue-500 hover:text-blue-700 bg-blue-50 px-2 py-1 rounded-lg"
                          title={`ย้ายไปกล่องที่ ${boxes.indexOf(targetBox) + 1}`}
                        >
                          →{boxes.indexOf(targetBox) + 1}
                        </button>
                      ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}

      {/* Actions row */}
      <div className="flex gap-3">
        <button
          onClick={addBox}
          className="flex-1 flex items-center justify-center gap-2 py-3 border-2 border-blue-200 text-blue-600 font-semibold text-sm rounded-xl hover:bg-blue-50 transition-colors"
        >
          <Plus size={16} /> เพิ่มกล่อง
        </button>
        {boxes.length > 1 && (
          <button
            onClick={mergeAll}
            className="flex-1 flex items-center justify-center gap-2 py-3 border-2 border-gray-200 text-gray-600 font-semibold text-sm rounded-xl hover:bg-gray-50 transition-colors"
          >
            <Layers size={16} /> รวมกล่องเดียว
          </button>
        )}
      </div>

      <p className="text-xs text-center text-gray-400">
        💡 ค้างที่สินค้าแล้วลากเพื่อย้ายกล่อง หรือกดปุ่ม →{boxes.length} เพื่อย้ายด่วน
      </p>

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
