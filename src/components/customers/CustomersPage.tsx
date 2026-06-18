import { useState, useEffect } from 'react'
import { Search, Users, ExternalLink, ShieldX, ShieldCheck, AlertTriangle } from 'lucide-react'
import { formatDate } from '../../utils/format'

interface Customer {
  id: string
  display_name: string | null
  line_user_id: string
  phone: string | null
  order_count: number
  is_banned: boolean
  ban_reason: string | null
  unpaid_count: number
  created_at: string
}

interface CustomersPageProps {
  initialCustomersData: string
}

interface BanModalProps {
  customer: Customer
  onConfirm: (reason: string) => void
  onCancel: () => void
}

function BanModal({ customer, onConfirm, onCancel }: BanModalProps) {
  const [reason, setReason] = useState('')
  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md mx-4 animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
            <ShieldX size={20} className="text-red-600" />
          </div>
          <div>
            <h3 className="text-base font-bold text-gray-800">แบนลูกค้า</h3>
            <p className="text-sm text-gray-500">{customer.display_name || 'ลูกค้า'}</p>
          </div>
        </div>
        <div className="flex flex-col gap-2 mb-5">
          <label className="text-sm font-semibold text-gray-700">เหตุผลในการแบน</label>
          <textarea
            value={reason}
            onChange={e => setReason(e.target.value)}
            placeholder="ระบุเหตุผล เช่น ไม่ชำระเงินซ้ำหลายครั้ง..."
            rows={3}
            className="w-full px-4 py-2 border border-gray-200 rounded-xl outline-none focus:border-red-400 text-sm resize-none bg-gray-50"
            autoFocus
          />
        </div>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
          >
            ยกเลิก
          </button>
          <button
            onClick={() => onConfirm(reason || 'แบนโดยแอดมิน')}
            disabled={!reason.trim()}
            className="flex-1 px-4 py-2.5 bg-red-500 text-white rounded-xl text-sm font-semibold hover:bg-red-600 transition-colors disabled:opacity-50"
          >
            ยืนยันแบน
          </button>
        </div>
      </div>
    </div>
  )
}

export default function CustomersPage({ initialCustomersData }: CustomersPageProps) {
  const [customers, setCustomers] = useState<Customer[]>(() => JSON.parse(initialCustomersData))
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(false)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [banTarget, setBanTarget] = useState<Customer | null>(null)
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null)

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

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

  const handleBan = async (customer: Customer, reason: string) => {
    setBanTarget(null)
    setActionLoading(customer.id)
    try {
      const res = await fetch(`/api/customers/${customer.id}/ban`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
      })
      if (!res.ok) throw new Error('แบนไม่สำเร็จ')
      const updated = await res.json()
      setCustomers(prev => prev.map(c => c.id === customer.id ? { ...c, ...updated } : c))
      showToast(`แบน "${customer.display_name || 'ลูกค้า'}" สำเร็จ`)
    } catch (e: any) {
      showToast(e.message || 'เกิดข้อผิดพลาด', 'error')
    } finally {
      setActionLoading(null)
    }
  }

  const handleUnban = async (customer: Customer) => {
    if (!confirm(`ยืนยันปลดแบน "${customer.display_name || 'ลูกค้า'}"?`)) return
    setActionLoading(customer.id)
    try {
      const res = await fetch(`/api/customers/${customer.id}/unban`, { method: 'PUT' })
      if (!res.ok) throw new Error('ปลดแบนไม่สำเร็จ')
      const updated = await res.json()
      setCustomers(prev => prev.map(c => c.id === customer.id ? { ...c, ...updated } : c))
      showToast(`ปลดแบน "${customer.display_name || 'ลูกค้า'}" สำเร็จ ✅`)
    } catch (e: any) {
      showToast(e.message || 'เกิดข้อผิดพลาด', 'error')
    } finally {
      setActionLoading(null)
    }
  }

  return (
    <div className="max-w-[1440px] mx-auto flex flex-col gap-6">
      {/* Toast */}
      <div className={`fixed bottom-6 right-6 z-50 transition-all duration-300 ${toast ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0 pointer-events-none'}`}>
        <div className={`flex items-center gap-3 px-5 py-3 rounded-xl shadow-2xl text-white text-sm font-medium ${toast?.type === 'error' ? 'bg-red-600' : 'bg-gray-900'}`}>
          {toast?.type === 'error' ? <AlertTriangle size={18} /> : <ShieldCheck size={18} className="text-green-400" />}
          {toast?.msg}
        </div>
      </div>

      {/* Ban modal */}
      {banTarget && (
        <BanModal
          customer={banTarget}
          onConfirm={(reason) => handleBan(banTarget, reason)}
          onCancel={() => setBanTarget(null)}
        />
      )}

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
                <th className="px-5 py-4 font-semibold text-gray-400 uppercase tracking-wider text-[11px] text-right">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {customers.length > 0 ? customers.map(c => (
                <tr key={c.id} className={`hover:bg-blue-50/30 transition-colors h-14 ${c.is_banned ? 'bg-red-50/30' : ''}`}>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-gray-800">{c.display_name || 'ไม่ระบุชื่อ'}</span>
                      {c.is_banned && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 bg-red-100 text-red-600 rounded-full">
                          <ShieldX size={9} /> แบน
                        </span>
                      )}
                      {!c.is_banned && (c.unpaid_count || 0) > 0 && (
                        <span className="text-[10px] font-semibold px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded-full">
                          ค้าง {c.unpaid_count}x
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-5 py-3 font-mono text-xs text-gray-500">{c.line_user_id}</td>
                  <td className="px-5 py-3 text-gray-600">{c.phone || '-'}</td>
                  <td className="px-5 py-3 text-center">
                    <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-blue-50 text-blue-700 font-bold">
                      {c.order_count}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-gray-500">{formatDate(c.created_at)}</td>
                  <td className="px-5 py-3 text-right">
                    <div className="flex items-center gap-2 justify-end">
                      <button className="text-blue-600 hover:underline text-xs font-medium flex items-center gap-1">
                        ดูประวัติ <ExternalLink size={12} />
                      </button>
                      {c.is_banned ? (
                        <button
                          onClick={() => handleUnban(c)}
                          disabled={actionLoading === c.id}
                          className="flex items-center gap-1 text-xs font-semibold text-green-700 bg-green-50 hover:bg-green-100 px-2.5 py-1.5 rounded-lg transition-colors disabled:opacity-50 border border-green-200"
                        >
                          {actionLoading === c.id ? (
                            <span className="w-3 h-3 border-2 border-green-600 border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <ShieldCheck size={12} />
                          )}
                          ปลดแบน
                        </button>
                      ) : (
                        <button
                          onClick={() => setBanTarget(c)}
                          disabled={actionLoading === c.id}
                          className="flex items-center gap-1 text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 px-2.5 py-1.5 rounded-lg transition-colors disabled:opacity-50 border border-red-200"
                        >
                          {actionLoading === c.id ? (
                            <span className="w-3 h-3 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <ShieldX size={12} />
                          )}
                          แบน
                        </button>
                      )}
                    </div>
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
