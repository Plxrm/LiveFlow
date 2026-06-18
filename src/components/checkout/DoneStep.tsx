import { Package, ExternalLink } from 'lucide-react'
import type { Order } from './CheckoutFlow'

interface Shipment {
  id: string
  tracking_number: string | null
  kex_con_no: string | null
  box_number: number
  carrier: string
}

interface Props {
  orders: Order[]
  shipments: Shipment[]
}

const KEX_TRACKING_URL = 'https://th.kerryexpress.com/th/track/?track='

export default function DoneStep({ orders, shipments }: Props) {
  const hasTracking = shipments.some(s => s.tracking_number || s.kex_con_no)

  return (
    <div className="flex flex-col gap-4 pb-8">
      {/* Hero */}
      <div className="bg-gradient-to-br from-green-500 to-emerald-500 rounded-2xl p-8 text-white text-center shadow-xl flex flex-col items-center gap-4">
        <div className="text-6xl animate-bounce">🎉</div>
        <div>
          <h1 className="text-2xl font-black">เสร็จเรียบร้อย!</h1>
          <p className="text-green-100 text-sm mt-1">ขอบคุณที่อุดหนุนนะคะ 💙</p>
        </div>
        <div className="bg-white/20 rounded-xl px-5 py-3 text-sm font-semibold">
          {orders.map(o => o.order_number).join(', ')}
        </div>
      </div>

      {/* Shipments */}
      {hasTracking ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-50 flex items-center gap-2">
            <Package size={18} className="text-blue-600" />
            <h3 className="text-sm font-bold text-gray-700">ข้อมูลพัสดุ</h3>
          </div>
          <div className="flex flex-col divide-y divide-gray-50">
            {shipments.map((shipment, idx) => {
              const trackNo = shipment.kex_con_no || shipment.tracking_number
              return (
                <div key={shipment.id || idx} className="px-5 py-4 flex items-center justify-between gap-3">
                  <div className="flex flex-col gap-0.5">
                    {shipments.length > 1 && (
                      <span className="text-xs text-gray-400">กล่องที่ {shipment.box_number}</span>
                    )}
                    <span className="font-mono text-sm font-bold text-gray-900">{trackNo || 'กำลังสร้าง...'}</span>
                    <span className="text-xs text-gray-400">Kerry Express</span>
                  </div>
                  {trackNo && (
                    <a
                      href={KEX_TRACKING_URL + trackNo}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 text-xs font-semibold text-blue-600 bg-blue-50 px-3 py-2 rounded-xl hover:bg-blue-100 transition-colors"
                    >
                      ติดตาม <ExternalLink size={12} />
                    </a>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 text-center">
          <p className="text-gray-500 text-sm">
            📦 กำลังเตรียมจัดส่งสินค้าของคุณ
          </p>
          <p className="text-gray-400 text-xs mt-1">
            เลขพัสดุจะแจ้งผ่าน LINE เมื่อจัดส่งแล้ว
          </p>
        </div>
      )}

      {/* Status summary */}
      <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5 flex flex-col gap-3">
        <h3 className="text-sm font-bold text-blue-800">สถานะ</h3>
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-3 text-sm">
            <span className="text-green-500 text-lg">✅</span>
            <span className="text-gray-700">ชำระเงินสำเร็จ</span>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <span className="text-green-500 text-lg">✅</span>
            <span className="text-gray-700">ที่อยู่จัดส่งบันทึกแล้ว</span>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <span className="text-blue-500 text-lg">📦</span>
            <span className="text-gray-700">กำลังเตรียมจัดส่ง</span>
          </div>
        </div>
      </div>

      {/* Close hint */}
      <p className="text-center text-xs text-gray-400 mt-2">
        สามารถปิดหน้านี้ได้แล้วค่ะ
      </p>

      <button
        onClick={() => window.close()}
        className="w-full py-4 bg-gray-100 text-gray-600 font-semibold text-base rounded-2xl active:scale-95 transition-transform"
      >
        ปิดหน้านี้
      </button>
    </div>
  )
}
