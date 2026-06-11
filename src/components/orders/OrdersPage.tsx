import { useState, useEffect } from 'react'
import { Search, CalendarDays, ChevronLeft, ChevronRight, CheckCircle, Clock, Truck, XCircle, Package, Printer } from 'lucide-react'
import { formatPrice, formatDate, formatTime, formatStatus } from '../../utils/format'

interface Order {
  id: string
  order_number: string
  customer_name: string
  customer_line_id: string
  total: number
  status: string
  live_session_title: string | null
  created_at: string
}

interface OrdersPageProps {
  initialOrdersData: string
  statsData: string
}

type OrderStatus = 'all' | 'pending' | 'confirmed' | 'paid' | 'shipping' | 'completed' | 'cancelled'

export default function OrdersPage({ initialOrdersData, statsData }: OrdersPageProps) {
  const [orders, setOrders] = useState<Order[]>(() => JSON.parse(initialOrdersData))
  const stats = JSON.parse(statsData)
  const [activeTab, setActiveTab] = useState<OrderStatus>('all')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(false)

  const TABS: { key: OrderStatus; label: string; count: number }[] = [
    { key: 'all', label: 'ทั้งหมด', count: Object.values(stats).reduce((a, b) => a + b, 0) - stats.totalRevenue },
    { key: 'pending', label: 'รอยืนยัน', count: stats.pending },
    { key: 'confirmed', label: 'ยืนยันแล้ว', count: stats.confirmed },
    { key: 'paid', label: 'ชำระแล้ว', count: stats.paid },
    { key: 'shipping', label: 'กำลังจัดส่ง', count: stats.shipping },
    { key: 'completed', label: 'สำเร็จ', count: stats.completed },
    { key: 'cancelled', label: 'ยกเลิก', count: stats.cancelled },
  ]

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending': return 'bg-yellow-100 text-yellow-700'
      case 'confirmed': return 'bg-blue-100 text-blue-700'
      case 'paid': return 'bg-green-100 text-green-700'
      case 'shipping': return 'bg-purple-100 text-purple-700'
      case 'completed': return 'bg-emerald-100 text-emerald-700'
      case 'cancelled': return 'bg-red-100 text-red-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending': return <Clock size={11} />
      case 'shipping': return <Truck size={11} />
      case 'cancelled': return <XCircle size={11} />
      default: return <CheckCircle size={11} />
    }
  }

  const fetchOrders = async (queryStatus: string, querySearch: string) => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (queryStatus !== 'all') params.append('status', queryStatus)
      if (querySearch) params.append('search', querySearch)
      
      const res = await fetch(`/api/orders?${params.toString()}`)
      if (res.ok) {
        const data = await res.json()
        setOrders(data)
      }
    } catch (error) {
      console.error('Error fetching orders:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchOrders(activeTab, search)
  }, [activeTab]) // Trigger when tab changes immediately

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchOrders(activeTab, search)
    }, 500)
    return () => clearTimeout(delayDebounceFn)
  }, [search]) // Debounce search

  const handleStatusChange = async (id: string, newStatus: string) => {
    if (!confirm(`ต้องการเปลี่ยนสถานะออเดอร์เป็น "${formatStatus(newStatus)}" ใช่หรือไม่?`)) return
    try {
      setLoading(true)
      const res = await fetch(`/api/orders/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      })
      if (res.ok) {
        fetchOrders(activeTab, search) // Refresh list
      } else {
        alert('เกิดข้อผิดพลาดในการเปลี่ยนสถานะ')
      }
    } catch (error) {
      console.error(error)
      alert('เกิดข้อผิดพลาดในการเชื่อมต่อ')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-[1440px] mx-auto flex flex-col gap-6">
      {/* Page title */}
      <h1 className="text-2xl font-bold text-gray-800">รายการคำสั่งซื้อ</h1>

      {/* Status tabs */}
      <div className="flex gap-1 border-b border-gray-200 overflow-x-auto pb-px">
        {TABS.map(({ key, label, count }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium whitespace-nowrap transition-colors border-b-2 -mb-px ${
              activeTab === key
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {label}
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
              activeTab === key ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'
            }`}>
              {count.toLocaleString()}
            </span>
          </button>
        ))}
      </div>

      {/* Filters row */}
      <div className="flex flex-col sm:flex-row gap-3 justify-between">
        <div className="relative w-full sm:w-80">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ค้นหาด้วย เลขออเดอร์ หรือ ชื่อลูกค้า..."
            className="w-full h-10 pl-9 pr-4 rounded-lg bg-white border border-gray-200 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
          />
        </div>
        <div className="flex gap-2">
          {/* ปุ่มพิมพ์ใบปะหน้า */}
          <a
            href="/orders/print-labels"
            className="relative flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors shadow-sm"
          >
            <Printer size={15} />
            พิมพ์ใบปะหน้า
            {stats.paid > 0 && (
              <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                {stats.paid}
              </span>
            )}
          </a>
          <button className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 bg-white text-gray-500 text-sm hover:bg-gray-50 transition-colors">
            <CalendarDays size={16} />
            ตัวกรองวันที่
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden relative">
        {loading && (
          <div className="absolute inset-0 bg-white/50 backdrop-blur-sm flex items-center justify-center z-10">
            <span className="w-8 h-8 rounded-full border-4 border-blue-200 border-t-blue-600 animate-spin" />
          </div>
        )}
        <div className="overflow-x-auto min-h-[300px]">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                {['เลขออเดอร์', 'ลูกค้า', 'ยอดรวม', 'สถานะ', 'วันที่', 'จัดการ'].map((h, i) => (
                  <th
                    key={h}
                    className={`px-4 py-3 text-[11px] font-semibold uppercase text-gray-400 tracking-wider ${
                      i === 2 ? 'text-right' : i === 3 ? 'text-center' : i === 5 ? 'text-right' : ''
                    }`}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 text-sm text-gray-700">
              {orders.length > 0 ? (
                orders.map((row) => (
                  <tr key={row.id} className="hover:bg-blue-50/30 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs text-blue-600 font-bold">{row.order_number}</td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-800">{row.customer_name}</p>
                      {row.live_session_title && (
                        <p className="text-[10px] text-gray-400 mt-0.5 max-w-[200px] truncate">จากไลฟ์: {row.live_session_title}</p>
                      )}
                    </td>
                    <td className="px-4 py-3 font-semibold text-right">{formatPrice(row.total)}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold ${getStatusColor(row.status)}`}>
                        {getStatusIcon(row.status)}
                        {formatStatus(row.status)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      <p>{formatDate(row.created_at)}</p>
                      <p className="text-xs text-gray-400">{formatTime(row.created_at)}</p>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <select 
                        value=""
                        onChange={(e) => {
                          if (e.target.value) handleStatusChange(row.id, e.target.value)
                        }}
                        className="bg-white border border-gray-200 rounded text-xs px-2 py-1 outline-none text-gray-600 cursor-pointer hover:border-blue-400 focus:border-blue-500 mr-2"
                      >
                        <option value="" disabled>เปลี่ยนสถานะ</option>
                        <option value="pending">รอยืนยัน</option>
                        <option value="confirmed">ยืนยันแล้ว</option>
                        <option value="paid">ชำระแล้ว</option>
                        <option value="shipping">กำลังจัดส่ง</option>
                        <option value="completed">สำเร็จ</option>
                        <option value="cancelled">ยกเลิก</option>
                      </select>
                      <a href={`/orders/${row.id}`} className="text-blue-600 text-xs font-medium hover:underline mr-2">ดูรายละเอียด</a>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center">
                    <div className="flex flex-col items-center justify-center gap-2 text-gray-400">
                      <Package size={32} className="text-gray-300" />
                      <p>ยังไม่มีออเดอร์ {search && `ที่ตรงกับ "${search}"`}</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination placeholder */}
        <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between bg-white">
          <span className="text-sm text-gray-400">แสดง {orders.length} รายการ</span>
          <div className="flex gap-1 items-center">
            <button className="p-1.5 rounded text-gray-400 hover:bg-gray-100 transition-colors">
              <ChevronLeft size={16} />
            </button>
            <button className="w-8 h-8 rounded-lg bg-blue-600 text-white text-sm font-semibold flex items-center justify-center">1</button>
            <button className="p-1.5 rounded text-gray-400 hover:bg-gray-100 transition-colors">
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
