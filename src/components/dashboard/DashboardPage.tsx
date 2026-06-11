import {
  Package2,
  ShoppingCart,
  Truck,
  Banknote,
  ArrowRight,
  CheckCircle,
  Clock,
  XCircle,
  ZoomIn,
  Image as ImageIcon,
} from 'lucide-react'
import { formatPrice, formatTime, formatDate, formatStatus } from '../../utils/format'

const STATUS_CONFIG: Record<string, { icon: typeof CheckCircle; cls: string }> = {
  paid: { icon: CheckCircle, cls: 'bg-emerald-100 text-emerald-700' },
  completed: { icon: CheckCircle, cls: 'bg-emerald-100 text-emerald-700' },
  pending: { icon: Clock, cls: 'bg-yellow-100 text-yellow-700' },
  cancelled: { icon: XCircle, cls: 'bg-red-100 text-red-700' },
  shipping: { icon: Truck, cls: 'bg-blue-100 text-blue-700' },
  confirmed: { icon: CheckCircle, cls: 'bg-teal-100 text-teal-700' },
}

interface DashboardProps {
  statsData: string
  recentOrdersData: string
  pendingPaymentsData: string
  liveSessionData: string
}

export default function DashboardPage({ statsData, recentOrdersData, pendingPaymentsData, liveSessionData }: DashboardProps) {
  const stats = JSON.parse(statsData)
  const recentOrders = JSON.parse(recentOrdersData)
  const pendingPayments = JSON.parse(pendingPaymentsData)
  const liveSession = JSON.parse(liveSessionData)

  console.log('Pending payments data:', JSON.stringify(pendingPayments, null, 2))

  const handleConfirmPayment = async (paymentId: string) => {
    if (!paymentId) {
      console.error('Payment ID is missing!')
      alert('ไม่พบข้อมูลการชำระเงิน')
      return
    }
    console.log('Confirm payment:', paymentId)
    try {
      const res = await fetch(`/api/payments/${paymentId}/confirm`, { method: 'PUT' })
      const data = await res.json()
      console.log('Result:', data)

      if (data.success) {
        alert('✅ ยืนยันสำเร็จ')
        window.location.reload()
      } else {
        alert('❌ ' + (data.error || 'ยืนยันไม่สำเร็จ'))
      }
    } catch (err) {
      console.error('Error:', err)
      alert('เกิดข้อผิดพลาด')
    }
  }

  const handleRejectPayment = async (paymentId: string) => {
    if (!paymentId) {
      console.error('Payment ID is missing!')
      alert('ไม่พบข้อมูลการชำระเงิน')
      return
    }
    if (!confirm('ต้องการปฏิเสธสลิปนี้?')) return
    try {
      const res = await fetch(`/api/payments/${paymentId}/reject`, { method: 'PUT' })
      const data = await res.json()
      if (data.success) {
        alert('ปฏิเสธแล้ว')
        window.location.reload()
      }
    } catch (err) {
      alert('เกิดข้อผิดพลาด')
    }
  }

  const STAT_CARDS = [
    {
      label: 'ออเดอร์ทั้งหมด',
      value: stats.totalOrders.toLocaleString(),
      icon: Package2,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
    },
    {
      label: 'รอยืนยัน (รอชำระ)',
      value: stats.pendingOrders.toLocaleString(),
      icon: ShoppingCart,
      color: 'text-amber-500',
      bg: 'bg-amber-50',
    },
    {
      label: 'ลูกค้าทั้งหมด',
      value: stats.totalCustomers.toLocaleString(),
      icon: Truck,
      color: 'text-emerald-500',
      bg: 'bg-emerald-50',
    },
    {
      label: 'ยอดขายวันนี้',
      value: formatPrice(stats.todayRevenue),
      icon: Banknote,
      color: 'text-blue-700',
      bg: 'bg-blue-50',
    },
  ]

  return (
    <div className="max-w-[1440px] mx-auto flex flex-col lg:flex-row gap-6">
      {/* Left Column */}
      <div className="flex-1 flex flex-col gap-6">
        {/* Live Banner */}
        {liveSession && (
          <div className="bg-white rounded-xl border-l-4 border-red-500 p-5 flex flex-col sm:flex-row items-center justify-between shadow-sm relative overflow-hidden">
            <div className="absolute -right-8 -top-8 w-28 h-28 bg-red-500 opacity-5 rounded-full blur-2xl pointer-events-none" />
            <div className="flex items-center gap-4">
              <div className="w-11 h-11 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                <span className="w-4 h-4 bg-red-500 rounded-full animate-pulse" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-800">{liveSession.title}</h2>
                <p className="text-sm font-medium text-red-500 mt-0.5">กำลังไลฟ์สด • {liveSession.product_count} สินค้า</p>
              </div>
            </div>
            <div className="mt-4 sm:mt-0 flex gap-2">
              <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors">
                จัดการไลฟ์
              </button>
            </div>
          </div>
        )}

        {/* Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {STAT_CARDS.map(({ label, value, icon: Icon, color, bg }) => (
            <div
              key={label}
              className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 flex flex-col gap-3 hover:shadow-md transition-shadow duration-300"
            >
              <div className={`w-10 h-10 rounded-lg ${bg} flex items-center justify-center`}>
                <Icon size={20} className={color} />
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase text-gray-400 tracking-wider mb-1">{label}</p>
                <h3 className="text-2xl font-bold text-gray-800">{value}</h3>
              </div>
            </div>
          ))}
        </div>

        {/* Recent Orders */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm flex flex-col flex-1">
          <div className="p-5 border-b border-gray-100 flex justify-between items-center">
            <h3 className="text-base font-semibold text-gray-800">รายการล่าสุด</h3>
            <a href="/orders" className="text-blue-600 text-sm font-medium hover:underline flex items-center gap-1">
              ดูทั้งหมด <ArrowRight size={14} />
            </a>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  {['ออเดอร์', 'ลูกค้า', 'ยอด', 'สถานะ', 'เวลา'].map((h) => (
                    <th key={h} className="py-3 px-5 text-[11px] font-semibold uppercase text-gray-400 tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="text-sm text-gray-700">
                {recentOrders.length > 0 ? (
                  recentOrders.map((row) => {
                    const statusKey = row.status.toLowerCase()
                    const s = STATUS_CONFIG[statusKey] || { icon: CheckCircle, cls: 'bg-gray-100 text-gray-700' }
                    return (
                      <tr key={row.order_number} className="border-b border-gray-50 hover:bg-blue-50/30 transition-colors h-14">
                        <td className="py-2 px-5 text-gray-400 font-mono text-xs">{row.order_number}</td>
                        <td className="py-2 px-5 font-medium">{row.customer_name}</td>
                        <td className="py-2 px-5 font-semibold">{formatPrice(row.total)}</td>
                        <td className="py-2 px-5">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold ${s.cls}`}>
                            <s.icon size={11} />
                            {formatStatus(row.status)}
                          </span>
                        </td>
                        <td className="py-2 px-5 text-gray-400">
                          {formatDate(row.created_at)} {formatTime(row.created_at)}
                        </td>
                      </tr>
                    )
                  })
                ) : (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-gray-400">ยังไม่มีออเดอร์</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Right Panel — Slip Verification */}
      <div className="lg:w-[320px] xl:w-[360px] shrink-0 flex flex-col gap-4">
        <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
          รอยืนยันยอด
          {pendingPayments.length > 0 && (
            <span className="ml-auto bg-blue-100 text-blue-700 text-xs font-bold px-2 py-0.5 rounded-full">
              {pendingPayments.length} รายการ
            </span>
          )}
        </h3>

        {pendingPayments.length > 0 ? (
          pendingPayments.map((payment, idx) => (
            <div key={idx} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 flex flex-col gap-4">
              {/* Slip image placeholder / rendering */}
              <div className="aspect-[3/4] bg-gray-100 rounded-lg border border-gray-200 flex items-center justify-center relative group overflow-hidden">
                {payment.slip_url ? (
                  <img src={payment.slip_url} alt="Slip" className="w-full h-full object-cover" />
                ) : (
                  <div className="text-center text-gray-400">
                    <ImageIcon size={32} className="mx-auto mb-2 opacity-40" />
                    <p className="text-xs">ไม่มีรูปสลิป</p>
                  </div>
                )}
                <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                  <button className="bg-white text-gray-700 p-2 rounded-full hover:bg-blue-50 transition-colors">
                    <ZoomIn size={20} />
                  </button>
                </div>
              </div>

              {/* Order info */}
              <div className="flex flex-col gap-1 text-center bg-gray-50 p-3 rounded-lg border border-gray-100">
                <span className="text-[10px] font-semibold uppercase text-gray-400 tracking-wider">โอนจาก</span>
                <span className="text-base font-semibold text-gray-800">{payment.customer_name}</span>
                <span className="text-xl font-bold text-blue-700 mt-1">{formatPrice(payment.amount)}</span>
                <span className="text-[11px] text-gray-400 mt-1">
                  #{payment.order_number} • {formatTime(payment.created_at)}
                </span>
              </div>

              {/* Actions */}
              <div className="flex flex-col gap-2 mt-1">
                <button
                  onClick={() => handleConfirmPayment(payment.id)}
                  className="w-full bg-blue-600 text-white py-3 rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors shadow-sm active:scale-[0.98]"
                >
                  ยืนยันยอดเงิน
                </button>
                <button
                  onClick={() => handleRejectPayment(payment.id)}
                  className="w-full bg-transparent text-gray-500 py-2 rounded-lg text-sm hover:bg-gray-100 transition-colors"
                >
                  แจ้งปัญหา
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 flex flex-col items-center justify-center text-gray-400 text-center gap-2">
            <CheckCircle size={32} className="text-gray-300" />
            <p className="text-sm font-medium">ไม่มีสลิปรอตรวจ</p>
          </div>
        )}
      </div>
    </div>
  )
}
