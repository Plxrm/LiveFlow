import { ShoppingBag, ArrowRight } from 'lucide-react'
import type { Order, CheckoutSettings } from './CheckoutFlow'

interface Props {
  orders: Order[]
  settings: CheckoutSettings | null
  onNext: () => void
}

export default function SummaryStep({ orders, onNext }: Props) {
  const subtotal = orders.reduce((sum, o) => {
    const itemsTotal = o.order_items?.reduce((s, i) => s + i.price * i.quantity, 0) || 0
    return sum + itemsTotal
  }, 0)
  const shipping = orders.reduce((sum, o) => sum + (o.shipping_fee || 0), 0)
  const total = orders.reduce((sum, o) => sum + o.total, 0)

  const allItems = orders.flatMap(o =>
    (o.order_items || []).map(item => ({ ...item, order_number: o.order_number }))
  )

  return (
    <div className="flex flex-col gap-4">
      {/* Header card */}
      <div className="bg-gradient-to-br from-blue-600 to-blue-500 rounded-2xl p-5 text-white shadow-lg">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
            <ShoppingBag size={18} />
          </div>
          <div>
            <p className="font-bold text-base">สรุปรายการสั่งซื้อ</p>
            <p className="text-blue-100 text-xs">{allItems.length} รายการ</p>
          </div>
        </div>
        <div className="text-3xl font-black tracking-tight">
          ฿{total.toLocaleString()}
        </div>
        <p className="text-blue-100 text-xs mt-0.5">ยอดชำระทั้งหมด</p>
      </div>

      {/* Items list */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-50">
          <h3 className="text-sm font-bold text-gray-700">รายการสินค้า</h3>
        </div>
        <div className="flex flex-col divide-y divide-gray-50">
          {allItems.map((item, i) => (
            <div key={i} className="flex items-center justify-between px-5 py-3.5">
              <div className="flex flex-col gap-0.5 flex-1 min-w-0 pr-4">
                <span className="text-sm font-semibold text-gray-800 leading-tight line-clamp-1">
                  {item.product_name}
                </span>
                {orders.length > 1 && (
                  <span className="text-[11px] text-gray-400">{item.order_number}</span>
                )}
                {item.quantity > 1 && (
                  <span className="text-xs text-gray-400">× {item.quantity}</span>
                )}
              </div>
              <span className="text-sm font-bold text-gray-900 flex-shrink-0">
                ฿{(item.price * item.quantity).toLocaleString()}
              </span>
            </div>
          ))}
        </div>

        {/* Totals */}
        <div className="bg-gray-50 px-5 py-4 flex flex-col gap-2 border-t border-gray-100">
          <div className="flex justify-between text-sm text-gray-600">
            <span>ค่าสินค้ารวม</span>
            <span>฿{subtotal.toLocaleString()}</span>
          </div>
          {shipping > 0 && (
            <div className="flex justify-between text-sm text-gray-600">
              <span>ค่าจัดส่ง</span>
              <span>฿{shipping.toLocaleString()}</span>
            </div>
          )}
          <div className="h-px bg-gray-200 my-1" />
          <div className="flex justify-between font-bold text-base text-gray-900">
            <span>💰 ยอดชำระทั้งหมด</span>
            <span className="text-blue-600">฿{total.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* CTA */}
      <button
        onClick={onNext}
        className="w-full py-4 bg-blue-600 text-white font-bold text-base rounded-2xl shadow-lg shadow-blue-200 flex items-center justify-center gap-2 active:scale-95 transition-transform"
      >
        ไปหน้าชำระเงิน <ArrowRight size={18} />
      </button>
    </div>
  )
}
