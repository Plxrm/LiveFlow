import { useState, useCallback } from 'react'
import {
  Printer, Package, CheckCircle2, XCircle, Loader2,
  SquareCheck, Square, ArrowLeft, Truck
} from 'lucide-react'
import { formatPrice, formatDate } from '../../utils/format'

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

interface PrintLabelsPageProps {
  ordersData: string
}

type LabelStatus = 'idle' | 'creating' | 'done' | 'error'

interface OrderState {
  selected: boolean
  labelStatus: LabelStatus
  trackingNumber?: string
  labelPdfUrl?: string
  errorMsg?: string
}

export default function PrintLabelsPage({ ordersData }: PrintLabelsPageProps) {
  const orders: Order[] = JSON.parse(ordersData)
  const [orderState, setOrderState] = useState<Record<string, OrderState>>(
    () => Object.fromEntries(orders.map(o => [o.id, { selected: false, labelStatus: 'idle' }]))
  )
  const [isProcessing, setIsProcessing] = useState(false)
  const [progress, setProgress] = useState({ current: 0, total: 0 })

  // ─── Selection helpers ────────────────────────────────────────────────────

  const selectedIds = Object.entries(orderState)
    .filter(([, s]) => s.selected)
    .map(([id]) => id)

  const toggleSelect = (id: string) =>
    setOrderState(prev => ({
      ...prev,
      [id]: { ...prev[id], selected: !prev[id].selected }
    }))

  const selectAll = () =>
    setOrderState(prev =>
      Object.fromEntries(Object.entries(prev).map(([id, s]) => [id, { ...s, selected: true }]))
    )

  const selectNone = () =>
    setOrderState(prev =>
      Object.fromEntries(Object.entries(prev).map(([id, s]) => [id, { ...s, selected: false }]))
    )

  const setStatus = (id: string, patch: Partial<OrderState>) =>
    setOrderState(prev => ({ ...prev, [id]: { ...prev[id], ...patch } }))

  // ─── Create & print ───────────────────────────────────────────────────────

  const handleCreateAndPrint = useCallback(async () => {
    if (selectedIds.length === 0) return
    if (!confirm(`สร้างพัสดุ KEX Express สำหรับ ${selectedIds.length} ออเดอร์ที่เลือก?`)) return

    setIsProcessing(true)
    setProgress({ current: 0, total: selectedIds.length })

    const labelUrls: string[] = []
    const shipmentIds: string[] = []

    for (let i = 0; i < selectedIds.length; i++) {
      const id = selectedIds[i]
      setStatus(id, { labelStatus: 'creating' })
      setProgress({ current: i + 1, total: selectedIds.length })

      try {
        const res = await fetch(`/api/orders/${id}/ship`, { method: 'POST' })
        const data = await res.json()

        if (!res.ok || data.error) {
          setStatus(id, { labelStatus: 'error', errorMsg: data.error || 'ไม่ทราบสาเหตุ' })
          continue
        }

        const tracking = data.tracking_number || data.kex_con_no || ''
        const pdfUrl = data.label_pdf_url || ''
        setStatus(id, { labelStatus: 'done', trackingNumber: tracking, labelPdfUrl: pdfUrl })

        if (pdfUrl) labelUrls.push(pdfUrl)
        if (data.id) shipmentIds.push(data.id)
      } catch (err: any) {
        setStatus(id, { labelStatus: 'error', errorMsg: err.message })
      }
    }

    setIsProcessing(false)

    // เปิดหน้าพิมพ์ถ้ามี shipments
    if (shipmentIds.length > 0) {
      window.open(`/print/labels?ids=${shipmentIds.join(',')}`, '_blank')
    } else if (labelUrls.length > 0) {
      // Fallback: เปิด PDF แรก
      window.open(labelUrls[0], '_blank')
    }
  }, [selectedIds])

  // ─── UI helpers ───────────────────────────────────────────────────────────

  const getLabelBadge = (s: OrderState) => {
    switch (s.labelStatus) {
      case 'creating': return (
        <span className="inline-flex items-center gap-1 text-blue-600 text-xs">
          <Loader2 size={12} className="animate-spin" /> กำลังสร้าง...
        </span>
      )
      case 'done': return (
        <span className="inline-flex items-center gap-1 text-emerald-600 text-xs font-semibold">
          <CheckCircle2 size={12} /> {s.trackingNumber || 'สำเร็จ'}
        </span>
      )
      case 'error': return (
        <span className="inline-flex items-center gap-1 text-red-500 text-xs" title={s.errorMsg}>
          <XCircle size={12} /> ผิดพลาด
        </span>
      )
      default: return (
        <span className="text-gray-400 text-xs">ยังไม่สร้าง</span>
      )
    }
  }

  const doneCount  = Object.values(orderState).filter(s => s.labelStatus === 'done').length
  const errorCount = Object.values(orderState).filter(s => s.labelStatus === 'error').length

  return (
    <div className="max-w-[1200px] mx-auto flex flex-col gap-6">

      {/* Header */}
      <div className="flex items-center gap-4">
        <a href="/orders" className="text-gray-400 hover:text-gray-800 transition-colors p-2 rounded-full hover:bg-gray-100">
          <ArrowLeft size={20} />
        </a>
        <div>
          <h1 className="text-2xl font-bold text-gray-800">พิมพ์ใบปะหน้าพัสดุ</h1>
          <p className="text-sm text-gray-400 mt-0.5">ออเดอร์ที่ชำระแล้ว พร้อมจัดส่ง ({orders.length} รายการ)</p>
        </div>
      </div>

      {/* KEX credentials not configured — error will appear when trying to create shipments */}

      {/* Progress bar */}
      {isProcessing && (
        <div className="bg-blue-50 border border-blue-100 rounded-xl px-5 py-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-blue-700 flex items-center gap-2">
              <Loader2 size={15} className="animate-spin" />
              กำลังสร้างพัสดุ {progress.current}/{progress.total}...
            </span>
            <span className="text-xs text-blue-500">{Math.round((progress.current / progress.total) * 100)}%</span>
          </div>
          <div className="w-full bg-blue-100 rounded-full h-2">
            <div
              className="bg-blue-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(progress.current / progress.total) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Summary after processing */}
      {!isProcessing && (doneCount > 0 || errorCount > 0) && (
        <div className="flex gap-3">
          {doneCount > 0 && (
            <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-100 rounded-lg px-4 py-2 text-sm text-emerald-700">
              <CheckCircle2 size={16} /> สร้างพัสดุสำเร็จ {doneCount} รายการ
            </div>
          )}
          {errorCount > 0 && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-100 rounded-lg px-4 py-2 text-sm text-red-600">
              <XCircle size={16} /> ผิดพลาด {errorCount} รายการ (ดูรายละเอียดในตาราง)
            </div>
          )}
        </div>
      )}

      {/* Action bar */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm px-5 py-4 flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={selectAll}
            className="text-sm text-blue-600 hover:underline font-medium"
          >
            เลือกทั้งหมด
          </button>
          <span className="text-gray-300">|</span>
          <button
            onClick={selectNone}
            className="text-sm text-gray-500 hover:underline font-medium"
          >
            ยกเลิกทั้งหมด
          </button>
          {selectedIds.length > 0 && (
            <span className="text-sm text-gray-600 font-medium bg-gray-100 px-2.5 py-0.5 rounded-full">
              เลือก {selectedIds.length} รายการ
            </span>
          )}
        </div>

        <button
          onClick={handleCreateAndPrint}
          disabled={selectedIds.length === 0 || isProcessing}
          className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isProcessing
            ? <Loader2 size={16} className="animate-spin" />
            : <Printer size={16} />
          }
          สร้างพัสดุ + พิมพ์ใบปะหน้า
          {selectedIds.length > 0 && (
            <span className="bg-blue-500 rounded-full px-2 py-0.5 text-xs">{selectedIds.length}</span>
          )}
        </button>
      </div>

      {/* Orders table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        {orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400 gap-3">
            <Package size={40} className="text-gray-200" />
            <p className="font-medium">ไม่มีออเดอร์ที่พร้อมจัดส่ง</p>
            <p className="text-sm">ออเดอร์ที่ status = paid จะแสดงที่นี่</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="px-4 py-3 w-10">
                    <button
                      onClick={() => selectedIds.length === orders.length ? selectNone() : selectAll()}
                      className="text-gray-400 hover:text-blue-600 transition-colors"
                    >
                      {selectedIds.length === orders.length
                        ? <SquareCheck size={18} className="text-blue-600" />
                        : <Square size={18} />
                      }
                    </button>
                  </th>
                  {['เลขออเดอร์', 'ชื่อลูกค้า', 'ที่อยู่', 'จำนวน', 'ยอดรวม', 'สถานะ Label'].map(h => (
                    <th key={h} className="px-4 py-3 text-[11px] font-semibold uppercase text-gray-400 tracking-wider whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {orders.map(order => {
                  const s = orderState[order.id]
                  const isCreating = s?.labelStatus === 'creating'
                  return (
                    <tr
                      key={order.id}
                      onClick={() => !isProcessing && toggleSelect(order.id)}
                      className={`transition-colors cursor-pointer ${
                        s?.selected ? 'bg-blue-50/60' : 'hover:bg-gray-50'
                      } ${isCreating ? 'opacity-75' : ''}`}
                    >
                      <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                        <button
                          onClick={() => !isProcessing && toggleSelect(order.id)}
                          className="text-gray-400 hover:text-blue-600 transition-colors"
                        >
                          {s?.selected
                            ? <SquareCheck size={18} className="text-blue-600" />
                            : <Square size={18} />
                          }
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <a
                          href={`/orders/${order.id}`}
                          className="font-mono text-xs text-blue-600 font-bold hover:underline"
                          onClick={e => e.stopPropagation()}
                        >
                          {order.order_number}
                        </a>
                        <p className="text-[10px] text-gray-400 mt-0.5">{formatDate(order.created_at)}</p>
                      </td>
                      <td className="px-4 py-3 font-medium text-gray-800">{order.customer_name}</td>
                      <td className="px-4 py-3 text-gray-500 text-xs max-w-[200px]">
                        <span className="text-gray-400 italic">—</span>
                      </td>
                      <td className="px-4 py-3 text-center text-gray-500 text-xs">—</td>
                      <td className="px-4 py-3 font-semibold text-gray-800">{formatPrice(order.total)}</td>
                      <td className="px-4 py-3">{getLabelBadge(s)}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Print single labels for done items */}
      {doneCount > 0 && (
        <div className="flex justify-end">
          <button
            onClick={() => {
              const doneShipmentIds = Object.entries(orderState)
                .filter(([, s]) => s.labelStatus === 'done')
                .map(([id]) => id)
              if (doneShipmentIds.length > 0) {
                window.open(`/print/labels?ids=${doneShipmentIds.join(',')}`, '_blank')
              }
            }}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-semibold hover:bg-emerald-700 transition-colors"
          >
            <Printer size={15} />
            พิมพ์ {doneCount} ใบปะหน้า
          </button>
        </div>
      )}
    </div>
  )
}
