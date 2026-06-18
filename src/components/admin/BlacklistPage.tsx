import { useState, useMemo } from 'react'
import { Search, ShieldX, ShieldCheck, Eye, AlertTriangle, Clock } from 'lucide-react'
import { formatDate } from '../../utils/format'

interface BannedCustomer {
  id: string
  display_name: string | null
  line_user_id: string
  phone: string | null
  is_banned: boolean
  ban_reason: string | null
  banned_at: string | null
  ban_count: number
  unpaid_count: number
  created_at: string
}

interface BlacklistPageProps {
  customersData: string
}

interface BanModalProps {
  customerId: string
  customerName: string
  onConfirm: (reason: string) => void
  onCancel: () => void
}

function BanModal({ customerId, customerName, onConfirm, onCancel }: BanModalProps) {
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
            <p className="text-sm text-gray-500">{customerName}</p>
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

export default function BlacklistPage({ customersData }: BlacklistPageProps) {
  const [customers, setCustomers] = useState<BannedCustomer[]>(() => JSON.parse(customersData))
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState<string | null>(null) // holds id of customer being processed
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null)

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  const filtered = useMemo(() => {
    const s = search.toLowerCase()
    if (!s) return customers
    return customers.filter(c =>
      (c.display_name && c.display_name.toLowerCase().includes(s)) ||
      c.line_user_id.toLowerCase().includes(s) ||
      (c.ban_reason && c.ban_reason.toLowerCase().includes(s))
    )
  }, [customers, search])

  const handleUnban = async (id: string, name: string) => {
    if (!confirm(`ยืนยันปลดแบน "${name}"?`)) return
    setLoading(id)
    try {
      const res = await fetch(`/api/customers/${id}/unban`, { method: 'PUT' })
      if (!res.ok) throw new Error('ปลดแบนไม่สำเร็จ')
      setCustomers(prev => prev.filter(c => c.id !== id))
      showToast(`ปลดแบน "${name}" สำเร็จ ✅`)
    } catch (e: any) {
      showToast(e.message || 'เกิดข้อผิดพลาด', 'error')
    } finally {
      setLoading(null)
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

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center">
            <ShieldX size={20} className="text-red-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Blacklist</h1>
            <p className="text-sm text-gray-400">ลูกค้าที่ถูกระงับการใช้งาน</p>
          </div>
        </div>
      </div>

      {/* Summary card */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-red-100 p-5 flex items-center gap-4 shadow-sm">
          <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
            <ShieldX size={22} className="text-red-500" />
          </div>
          <div>
            <p className="text-3xl font-bold text-red-600">{customers.length}</p>
            <p className="text-sm text-gray-500">ลูกค้าที่ถูกแบน</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-amber-100 p-5 flex items-center gap-4 shadow-sm">
          <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
            <AlertTriangle size={22} className="text-amber-500" />
          </div>
          <div>
            <p className="text-3xl font-bold text-amber-600">
              {customers.reduce((sum, c) => sum + (c.unpaid_count || 0), 0)}
            </p>
            <p className="text-sm text-gray-500">ครั้งที่ไม่ชำระรวม</p>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <div className="relative w-full sm:w-96">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="ค้นหาชื่อ, LINE ID, หรือเหตุผล..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100 transition-all bg-gray-50"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {customers.length === 0 ? (
          /* Empty state */
          <div className="flex flex-col items-center justify-center py-24 gap-4 text-gray-400">
            <div className="w-20 h-20 rounded-full bg-green-50 flex items-center justify-center">
              <ShieldCheck size={36} className="text-green-400" />
            </div>
            <p className="text-xl font-semibold text-gray-500">ไม่มีลูกค้าที่ถูกแบน 🎉</p>
            <p className="text-sm text-gray-400">ลูกค้าทุกคนสามารถใช้งานได้ตามปกติ</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="px-5 py-4 font-semibold text-gray-400 uppercase tracking-wider text-[11px]">ชื่อลูกค้า</th>
                  <th className="px-5 py-4 font-semibold text-gray-400 uppercase tracking-wider text-[11px]">LINE ID</th>
                  <th className="px-5 py-4 font-semibold text-gray-400 uppercase tracking-wider text-[11px]">เหตุผล</th>
                  <th className="px-5 py-4 font-semibold text-gray-400 uppercase tracking-wider text-[11px] text-center">ไม่จ่าย</th>
                  <th className="px-5 py-4 font-semibold text-gray-400 uppercase tracking-wider text-[11px]">แบนวันที่</th>
                  <th className="px-5 py-4 font-semibold text-gray-400 uppercase tracking-wider text-[11px] text-right">จัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.length > 0 ? filtered.map(c => (
                  <tr key={c.id} className="hover:bg-red-50/30 transition-colors h-14">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                          <ShieldX size={13} className="text-red-500" />
                        </div>
                        <span className="font-semibold text-gray-800">
                          {c.display_name || 'ไม่ระบุชื่อ'}
                        </span>
                        {c.ban_count > 1 && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 bg-red-100 text-red-600 rounded-full">
                            แบน {c.ban_count}x
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-3 font-mono text-xs text-gray-500 max-w-[120px] truncate">
                      {c.line_user_id}
                    </td>
                    <td className="px-5 py-3 text-gray-600 max-w-[200px]">
                      <span className="text-xs leading-relaxed line-clamp-2">
                        {c.ban_reason || '-'}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-center">
                      <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm ${
                        (c.unpaid_count || 0) >= 3 ? 'bg-red-100 text-red-600' : 'bg-amber-50 text-amber-600'
                      }`}>
                        {c.unpaid_count || 0}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-gray-500">
                      <div className="flex items-center gap-1.5 text-xs">
                        <Clock size={12} className="text-gray-400" />
                        {c.banned_at ? formatDate(c.banned_at) : '-'}
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2 justify-end">
                        <button
                          onClick={() => window.location.href = `/customers?highlight=${c.id}`}
                          className="flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-800 px-2 py-1.5 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                          <Eye size={13} /> ดูประวัติ
                        </button>
                        <button
                          onClick={() => handleUnban(c.id, c.display_name || 'ลูกค้า')}
                          disabled={loading === c.id}
                          className="flex items-center gap-1 text-xs font-semibold text-green-700 bg-green-50 hover:bg-green-100 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50 border border-green-200"
                        >
                          {loading === c.id ? (
                            <span className="w-3 h-3 border-2 border-green-600 border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <ShieldCheck size={13} />
                          )}
                          ปลดแบน
                        </button>
                      </div>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={6} className="text-center py-16 text-gray-400">
                      ไม่พบลูกค้าที่ตรงกับ &ldquo;{search}&rdquo;
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
