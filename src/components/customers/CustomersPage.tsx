import { useState, useEffect } from 'react'
import { Search, Users, ExternalLink } from 'lucide-react'
import { formatDate } from '../../utils/format'

interface Customer {
  id: string
  display_name: string | null
  line_user_id: string
  phone: string | null
  order_count: number
  created_at: string
}

interface CustomersPageProps {
  initialCustomers: Customer[]
}

export default function CustomersPage({ initialCustomers }: CustomersPageProps) {
  const [customers, setCustomers] = useState<Customer[]>(initialCustomers)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(false)

  const fetchCustomers = async (query: string) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/customers${query ? `?search=${encodeURIComponent(query)}` : ''}`)
      if (res.ok) setCustomers(await res.json())
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchCustomers(search)
    }, 500)
    return () => clearTimeout(delayDebounceFn)
  }, [search])

  return (
    <div className="max-w-[1440px] mx-auto flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">รายชื่อลูกค้า</h1>
      </div>

      {/* Filter Row */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <div className="relative w-full sm:w-96">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="ค้นหาชื่อลูกค้า หรือเบอร์โทร..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all bg-gray-50"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden relative">
        {loading && (
          <div className="absolute inset-0 bg-white/50 backdrop-blur-sm flex items-center justify-center z-10">
            <span className="w-8 h-8 rounded-full border-4 border-blue-200 border-t-blue-600 animate-spin" />
          </div>
        )}
        <div className="overflow-x-auto min-h-[300px]">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="px-5 py-4 font-semibold text-gray-400 uppercase tracking-wider text-[11px]">ชื่อลูกค้า</th>
                <th className="px-5 py-4 font-semibold text-gray-400 uppercase tracking-wider text-[11px]">LINE ID</th>
                <th className="px-5 py-4 font-semibold text-gray-400 uppercase tracking-wider text-[11px]">เบอร์โทร</th>
                <th className="px-5 py-4 font-semibold text-gray-400 uppercase tracking-wider text-[11px] text-center">ออเดอร์สะสม</th>
                <th className="px-5 py-4 font-semibold text-gray-400 uppercase tracking-wider text-[11px]">ลูกค้าตั้งแต่</th>
                <th className="px-5 py-4 font-semibold text-gray-400 uppercase tracking-wider text-[11px] text-right"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {customers.length > 0 ? customers.map(c => (
                <tr key={c.id} className="hover:bg-blue-50/30 transition-colors h-14">
                  <td className="px-5 py-3 font-semibold text-gray-800">{c.display_name || 'ไม่ระบุชื่อ'}</td>
                  <td className="px-5 py-3 font-mono text-xs text-gray-500">{c.line_user_id}</td>
                  <td className="px-5 py-3 text-gray-600">{c.phone || '-'}</td>
                  <td className="px-5 py-3 text-center">
                    <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-blue-50 text-blue-700 font-bold">
                      {c.order_count}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-gray-500">{formatDate(c.created_at)}</td>
                  <td className="px-5 py-3 text-right">
                    <button className="text-blue-600 hover:underline text-xs font-medium flex items-center gap-1 ml-auto">
                      ดูประวัติ <ExternalLink size={12} />
                    </button>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={6} className="text-center py-16">
                    <div className="flex flex-col items-center justify-center gap-2 text-gray-400">
                      <Users size={32} className="text-gray-300" />
                      <p>ยังไม่มีลูกค้า {search && `ที่ตรงกับ "${search}"`}</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
