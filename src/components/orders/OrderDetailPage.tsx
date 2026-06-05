import { useState } from 'react'
import {
  ArrowLeft, User, Package, CreditCard, MapPin,
  Truck, CheckSquare, XSquare, RefreshCw,
  ExternalLink, FileText, XCircle, AlertCircle,
  Printer, Download, ChevronDown, ChevronUp
} from 'lucide-react'
import { formatPrice, formatDate, formatTime, formatStatus } from '../../utils/format'

export default function OrderDetailPage({ order: initialOrder }: { order: any }) {
  const [order, setOrder] = useState(initialOrder)
  const [loading, setLoading] = useState(false)
  const [shipLoading, setShipLoading] = useState(false)
  const [labelPreview, setLabelPreview] = useState<Record<string, boolean>>({})
  const [trackLoading, setTrackLoading] = useState<string | null>(null)
  const [cancelLoading, setCancelLoading] = useState<string | null>(null)

  // ─── Order Status Helpers ───────────────────────────────────────────────────

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':    return 'bg-yellow-100 text-yellow-700'
      case 'confirmed':  return 'bg-blue-100 text-blue-700'
      case 'paid':       return 'bg-green-100 text-green-700'
      case 'shipping':   return 'bg-purple-100 text-purple-700'
      case 'completed':  return 'bg-emerald-100 text-emerald-700'
      case 'cancelled':  return 'bg-red-100 text-red-700'
      default:           return 'bg-gray-100 text-gray-700'
    }
  }

  // ─── Shipment Status Helpers ────────────────────────────────────────────────

  const getShipmentStatusBadge = (status: string) => {
    switch (status) {
      case 'created':          return { color: 'bg-blue-100 text-blue-700', label: 'สร้างพัสดุแล้ว' }
      case 'picked_up':        return { color: 'bg-cyan-100 text-cyan-700', label: 'รับพัสดุแล้ว' }
      case 'in_transit':       return { color: 'bg-purple-100 text-purple-700', label: 'กำลังขนส่ง' }
      case 'out_for_delivery': return { color: 'bg-orange-100 text-orange-700', label: 'กำลังนำส่ง' }
      case 'delivered':        return { color: 'bg-green-100 text-green-700', label: 'ส่งสำเร็จ' }
      case 'returned':         return { color: 'bg-red-100 text-red-700', label: 'ส่งคืน' }
      case 'cancelled':        return { color: 'bg-red-100 text-red-700', label: 'ยกเลิกแล้ว' }
      case 'failed':           return { color: 'bg-red-100 text-red-700', label: 'ส่งไม่สำเร็จ' }
      default:                 return { color: 'bg-gray-100 text-gray-700', label: status }
    }
  }

  // ─── Reload Order ───────────────────────────────────────────────────────────

  const reloadOrder = async () => {
    const res = await fetch(`/api/orders/${order.id}`)
    if (res.ok) setOrder(await res.json())
  }

  // ─── Handlers ───────────────────────────────────────────────────────────────

  const handleStatusChange = async (newStatus: string) => {
    try {
      setLoading(true)
      const res = await fetch(`/api/orders/${order.id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      })
      if (res.ok) {
        setOrder({ ...order, status: newStatus })
      }
    } finally {
      setLoading(false)
    }
  }

  const handleConfirmPayment = async (paymentId: string) => {
    if (!confirm('ยืนยันสลิป และปรับสถานะออเดอร์เป็นชำระแล้ว?')) return
    try {
      setLoading(true)
      const res = await fetch(`/api/payments/${paymentId}/confirm`, { method: 'PUT' })
      if (res.ok) await reloadOrder()
    } finally {
      setLoading(false)
    }
  }

  const handleRejectPayment = async (paymentId: string) => {
    if (!confirm('ปฏิเสธสลิปนี้?')) return
    try {
      setLoading(true)
      const res = await fetch(`/api/payments/${paymentId}/reject`, { method: 'PUT' })
      if (res.ok) await reloadOrder()
    } finally {
      setLoading(false)
    }
  }

  const handleShip = async () => {
    if (!confirm('ยืนยันสร้างพัสดุ KEX Express สำหรับออเดอร์นี้?')) return
    try {
      setShipLoading(true)
      const res = await fetch(`/api/orders/${order.id}/ship`, { method: 'POST' })
      const data = await res.json()
      if (!res.ok) {
        alert(data.error || 'เกิดข้อผิดพลาด')
        return
      }
      await reloadOrder()
    } finally {
      setShipLoading(false)
    }
  }

  const handleTrack = async (shipmentId: string) => {
    try {
      setTrackLoading(shipmentId)
      const res = await fetch(`/api/shipments/${shipmentId}/track`)
      const data = await res.json()
      if (!res.ok) {
        alert(data.error || 'ไม่สามารถดึงสถานะได้')
        return
      }
      await reloadOrder()
    } finally {
      setTrackLoading(null)
    }
  }

  const handleCancelShipment = async (shipmentId: string) => {
    if (!confirm('ยืนยันยกเลิกพัสดุนี้?')) return
    try {
      setCancelLoading(shipmentId)
      const res = await fetch(`/api/shipments/${shipmentId}/cancel`, { method: 'POST' })
      const data = await res.json()
      if (!res.ok) {
        alert(data.error || 'ยกเลิกไม่สำเร็จ')
        return
      }
      await reloadOrder()
    } finally {
      setCancelLoading(null)
    }
  }

  const { customers, order_items, payments, shipments } = order

  return (
    <div className="max-w-[1000px] mx-auto flex flex-col gap-6 relative">
      {loading && (
        <div className="fixed inset-0 z-50 bg-white/50 backdrop-blur-sm flex items-center justify-center">
          <span className="w-8 h-8 rounded-full border-4 border-blue-200 border-t-blue-600 animate-spin" />
        </div>
      )}

      {/* Header */}
      <div className="flex items-center gap-4">
        <a href="/orders" className="text-gray-400 hover:text-gray-800 transition-colors p-2 rounded-full hover:bg-gray-100">
          <ArrowLeft size={20} />
        </a>
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
          ออเดอร์ {order.order_number}
          <span className={`px-3 py-1 rounded-full text-xs font-bold ${getStatusColor(order.status)}`}>
            {formatStatus(order.status)}
          </span>
        </h1>
        <div className="ml-auto flex items-center gap-2">
          <span className="text-sm font-semibold text-gray-500">เปลี่ยนสถานะ:</span>
          <select
            value={order.status}
            onChange={(e) => handleStatusChange(e.target.value)}
            className="bg-white border border-gray-200 rounded-lg text-sm font-medium px-3 py-2 outline-none focus:border-blue-500 hover:border-blue-400 shadow-sm transition-colors cursor-pointer"
          >
            <option value="pending">รอยืนยัน</option>
            <option value="confirmed">ยืนยันแล้ว</option>
            <option value="paid">ชำระแล้ว</option>
            <option value="shipping">กำลังจัดส่ง</option>
            <option value="completed">สำเร็จ</option>
            <option value="cancelled">ยกเลิก</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="md:col-span-2 flex flex-col gap-6">

          {/* Items Section */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex items-center gap-2">
              <Package size={18} className="text-gray-500" />
              <h2 className="font-semibold text-gray-800">รายการสินค้า</h2>
            </div>
            <div className="p-6">
              <table className="w-full text-sm text-left">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="pb-3 text-gray-400 font-semibold uppercase text-[11px] tracking-wider">สินค้า</th>
                    <th className="pb-3 text-gray-400 font-semibold uppercase text-[11px] tracking-wider text-right">ราคา</th>
                    <th className="pb-3 text-gray-400 font-semibold uppercase text-[11px] tracking-wider text-center">จำนวน</th>
                    <th className="pb-3 text-gray-400 font-semibold uppercase text-[11px] tracking-wider text-right">รวม</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {order_items?.map((item: any) => (
                    <tr key={item.id}>
                      <td className="py-4 font-medium text-gray-800 flex items-center gap-3">
                        {item.products?.image_url ? (
                          <img src={item.products.image_url} alt="" className="w-10 h-10 rounded border border-gray-100 object-cover" />
                        ) : (
                          <div className="w-10 h-10 rounded bg-gray-100 flex items-center justify-center"><Package size={16} className="text-gray-400"/></div>
                        )}
                        {item.product_name}
                      </td>
                      <td className="py-4 text-right text-gray-600">{formatPrice(item.price)}</td>
                      <td className="py-4 text-center text-gray-800 font-semibold">x{item.quantity}</td>
                      <td className="py-4 text-right font-bold text-gray-800">{formatPrice(item.price * item.quantity)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="border-t border-gray-100 text-sm">
                  <tr>
                    <td colSpan={3} className="pt-4 text-right text-gray-500 font-medium">ค่าจัดส่ง</td>
                    <td className="pt-4 text-right text-gray-800 font-semibold">{formatPrice(order.shipping_fee)}</td>
                  </tr>
                  <tr>
                    <td colSpan={3} className="pt-2 text-right font-bold text-gray-800 text-base">ยอดรวมทั้งสิ้น</td>
                    <td className="pt-2 text-right font-bold text-blue-600 text-xl">{formatPrice(order.total)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Payment Section */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex items-center gap-2">
              <CreditCard size={18} className="text-gray-500" />
              <h2 className="font-semibold text-gray-800">การชำระเงิน</h2>
            </div>
            <div className="p-6">
              {!payments || payments.length === 0 ? (
                <div className="text-center py-8 text-gray-400">ยังไม่ได้ชำระเงิน</div>
              ) : (
                <div className="flex flex-col gap-4">
                  {payments.map((p: any) => (
                    <div key={p.id} className="border border-gray-100 rounded-xl p-4 flex flex-col sm:flex-row gap-4 items-start bg-gray-50/50">
                      {p.slip_url && (
                        <a href={p.slip_url} target="_blank" rel="noreferrer" className="block shrink-0">
                          <img src={p.slip_url} alt="Slip" className="w-24 h-auto rounded-lg border border-gray-200 shadow-sm hover:opacity-90 transition-opacity" />
                        </a>
                      )}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-gray-800">{p.method.toUpperCase()}</span>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            p.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                            p.status === 'rejected'  ? 'bg-red-100 text-red-700' :
                            'bg-yellow-100 text-yellow-700'
                          }`}>
                            {p.status === 'confirmed' ? 'ยืนยันแล้ว' : p.status === 'rejected' ? 'ปฏิเสธ' : 'รอตรวจสอบ'}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mb-1">ยอดโอน: <span className="font-bold text-gray-800">{formatPrice(p.amount)}</span></p>
                        <p className="text-xs text-gray-500">อัปโหลดเมื่อ: {formatDate(p.created_at)} {formatTime(p.created_at)}</p>

                        {p.status === 'pending' && (
                          <div className="flex items-center gap-2 mt-4 pt-4 border-t border-gray-100">
                            <button onClick={() => handleConfirmPayment(p.id)} className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500 text-white rounded-lg text-xs font-semibold hover:bg-emerald-600 transition-colors shadow-sm">
                              <CheckSquare size={14} /> ยืนยันสลิป
                            </button>
                            <button onClick={() => handleRejectPayment(p.id)} className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-red-200 text-red-600 rounded-lg text-xs font-semibold hover:bg-red-50 transition-colors shadow-sm">
                              <XSquare size={14} /> ปฏิเสธ
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* ─── Section 5: การจัดส่ง ─────────────────────────────────────── */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex items-center gap-2">
              <Truck size={18} className="text-gray-500" />
              <h2 className="font-semibold text-gray-800">การจัดส่ง (KEX Express)</h2>
            </div>
            <div className="p-6">
              {/* ยังไม่มี shipment → แสดงปุ่ม (เฉพาะเมื่อ status = paid) */}
              {(!shipments || shipments.length === 0) && (
                <>
                  {order.status === 'paid' ? (
                    <div className="flex flex-col items-center gap-4 py-6">
                      <div className="w-14 h-14 rounded-full bg-blue-50 flex items-center justify-center">
                        <Truck size={28} className="text-blue-500" />
                      </div>
                      <div className="text-center">
                        <p className="font-semibold text-gray-800 mb-1">พร้อมจัดส่ง</p>
                        <p className="text-sm text-gray-500">กดปุ่มด้านล่างเพื่อสร้างพัสดุ KEX Express อัตโนมัติ</p>
                      </div>
                      {/* เช็คที่อยู่ */}
                      {!customers?.address && !customers?.address_detail && (
                        <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-lg px-4 py-2.5 text-sm text-amber-700">
                          <AlertCircle size={16} className="shrink-0" />
                          ลูกค้ายังไม่ได้กรอกที่อยู่จัดส่ง ไม่สามารถสร้างพัสดุได้
                        </div>
                      )}
                      <button
                        onClick={handleShip}
                        disabled={shipLoading || (!customers?.address && !customers?.address_detail)}
                        className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {shipLoading
                          ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          : <Truck size={16} />
                        }
                        จัดส่ง KEX Express
                      </button>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-400 text-sm">
                      ยังไม่มีข้อมูลการจัดส่ง (ต้องชำระเงินก่อน)
                    </div>
                  )}
                </>
              )}

              {/* มี shipments แล้ว */}
              {shipments && shipments.length > 0 && (
                <div className="flex flex-col gap-4">
                  {shipments.map((s: any) => {
                    const badge = getShipmentStatusBadge(s.status)
                    return (
                      <div key={s.id} className="border border-gray-100 rounded-xl p-5 bg-gray-50/40">
                        {/* Header row */}
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center">
                              <Truck size={16} className="text-blue-600" />
                            </div>
                            <div>
                              <p className="text-[11px] text-gray-400 font-semibold uppercase tracking-wider">KEX Express</p>
                              <p className="font-bold text-gray-800 font-mono text-sm">{s.tracking_number}</p>
                            </div>
                          </div>
                          <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${badge.color}`}>
                            {badge.label}
                          </span>
                        </div>

                        {/* Status desc */}
                        {s.kex_status_desc && (
                          <p className="text-xs text-gray-500 mb-3 italic">"{s.kex_status_desc}"</p>
                        )}

                        {/* Info grid */}
                        <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs mb-4">
                          {s.kex_ref_no && (
                            <>
                              <span className="text-gray-400">Ref No.</span>
                              <span className="font-medium text-gray-700 font-mono">{s.kex_ref_no}</span>
                            </>
                          )}
                          {s.kex_lh_route && (
                            <>
                              <span className="text-gray-400">LH Route</span>
                              <span className="font-medium text-gray-700">{s.kex_lh_route}</span>
                            </>
                          )}
                          {s.kex_del_route && (
                            <>
                              <span className="text-gray-400">Del Route</span>
                              <span className="font-medium text-gray-700">{s.kex_del_route}</span>
                            </>
                          )}
                          {s.shipped_at && (
                            <>
                              <span className="text-gray-400">วันที่จัดส่ง</span>
                              <span className="font-medium text-gray-700">{formatDate(s.shipped_at)}</span>
                            </>
                          )}
                          {s.delivered_at && (
                            <>
                              <span className="text-gray-400">วันที่ส่งถึง</span>
                              <span className="font-medium text-emerald-600">{formatDate(s.delivered_at)}</span>
                            </>
                          )}
                        </div>

                        {/* Action buttons */}
                        <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-gray-100">
                          {/* ติดตามพัสดุ Kerry */}
                          <a
                            href={`https://th.kerryexpress.com/th/track/?track=${s.tracking_number}`}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 text-gray-700 rounded-lg text-xs font-semibold hover:border-blue-400 hover:text-blue-600 transition-colors shadow-sm"
                          >
                            <ExternalLink size={13} /> ติดตามพัสดุ
                          </a>

                          {/* พิมพ์ + ดาวน์โหลดใบปะหน้า */}
                          {s.label_pdf_url && (
                            <>
                              {/* พิมพ์ */}
                              <button
                                onClick={() => window.open(`/print/labels?ids=${s.id}`, '_blank')}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 text-gray-700 rounded-lg text-xs font-semibold hover:border-purple-400 hover:text-purple-600 transition-colors shadow-sm"
                              >
                                <Printer size={13} /> พิมพ์ใบปะหน้า
                              </button>
                              {/* ดาวน์โหลด PDF */}
                              <a
                                href={s.label_pdf_url}
                                download={`label-${s.tracking_number || s.id}.pdf`}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 text-gray-700 rounded-lg text-xs font-semibold hover:border-blue-400 hover:text-blue-600 transition-colors shadow-sm"
                              >
                                <Download size={13} /> ดาวน์โหลด PDF
                              </a>
                              {/* Toggle preview */}
                              <button
                                onClick={() => setLabelPreview(prev => ({ ...prev, [s.id]: !prev[s.id] }))}
                                className="flex items-center gap-1 px-2.5 py-1.5 bg-white border border-gray-200 text-gray-400 rounded-lg text-xs hover:border-gray-400 hover:text-gray-600 transition-colors shadow-sm"
                              >
                                {labelPreview[s.id] ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                                {labelPreview[s.id] ? 'ซ่อน preview' : 'ดู preview'}
                              </button>
                            </>
                          )}
                          {!s.label_pdf_url && (
                            <button
                              onClick={() => window.open(`/print/labels?ids=${s.id}`, '_blank')}
                              className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 text-gray-500 rounded-lg text-xs font-semibold hover:border-purple-400 hover:text-purple-600 transition-colors shadow-sm"
                            >
                              <FileText size={13} /> Custom Label
                            </button>
                          )}

                          {/* อัปเดตสถานะ */}
                          <button
                            onClick={() => handleTrack(s.id)}
                            disabled={trackLoading === s.id}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 text-gray-700 rounded-lg text-xs font-semibold hover:border-emerald-400 hover:text-emerald-600 transition-colors shadow-sm disabled:opacity-50"
                          >
                            {trackLoading === s.id
                              ? <span className="w-3 h-3 border border-gray-400 border-t-transparent rounded-full animate-spin" />
                              : <RefreshCw size={13} />
                            }
                            อัปเดตสถานะ
                          </button>

                          {/* ยกเลิกพัสดุ (เฉพาะ created) */}
                          {s.status === 'created' && (
                            <button
                              onClick={() => handleCancelShipment(s.id)}
                              disabled={cancelLoading === s.id}
                              className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-red-200 text-red-500 rounded-lg text-xs font-semibold hover:bg-red-50 transition-colors shadow-sm disabled:opacity-50"
                            >
                              {cancelLoading === s.id
                                ? <span className="w-3 h-3 border border-red-400 border-t-transparent rounded-full animate-spin" />
                                : <XCircle size={13} />
                              }
                              ยกเลิกพัสดุ
                            </button>
                          )}
                        </div>

                        {/* ─── PDF Preview iframe ─────────────────── */}
                        {s.label_pdf_url && labelPreview[s.id] && (
                          <div className="mt-3 border border-gray-200 rounded-lg overflow-hidden bg-gray-50">
                            <div className="px-3 py-2 border-b border-gray-100 bg-gray-100 flex items-center justify-between">
                              <span className="text-xs font-medium text-gray-600">ตัวอย่างใบปะหน้า</span>
                              <button
                                onClick={() => setLabelPreview(prev => ({ ...prev, [s.id]: false }))}
                                className="text-gray-400 hover:text-gray-600"
                              >
                                <XCircle size={14} />
                              </button>
                            </div>
                            <div className="flex justify-center p-4">
                              <iframe
                                src={s.label_pdf_url}
                                title="Label Preview"
                                style={{ width: '3in', height: '4in', border: 'none' }}
                                className="shadow-md rounded"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })}

                  {/* ถ้า order ยังอยู่ใน paid และยังไม่ได้ส่ง → ยังสร้างพัสดุเพิ่มได้ */}
                  {order.status === 'paid' && (
                    <button
                      onClick={handleShip}
                      disabled={shipLoading}
                      className="flex items-center gap-2 self-start px-4 py-2 bg-blue-50 border border-blue-200 text-blue-700 rounded-lg text-xs font-semibold hover:bg-blue-100 transition-colors"
                    >
                      {shipLoading
                        ? <span className="w-3 h-3 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                        : <Truck size={13} />
                      }
                      สร้างพัสดุเพิ่ม
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

        </div>

        {/* Right Column */}
        <div className="flex flex-col gap-6">
          {/* Customer Info */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex items-center gap-2">
              <User size={18} className="text-gray-500" />
              <h2 className="font-semibold text-gray-800">ข้อมูลลูกค้า</h2>
            </div>
            <div className="p-6 flex flex-col gap-4">
              <div className="flex items-center gap-3">
                {customers?.picture_url ? (
                  <img src={customers.picture_url} className="w-12 h-12 rounded-full border border-gray-100" />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-lg">
                    {customers?.display_name?.charAt(0) || '?'}
                  </div>
                )}
                <div>
                  <h3 className="font-bold text-gray-800">{customers?.display_name}</h3>
                  <p className="text-xs text-gray-500 font-mono">LINE: {customers?.line_user_id}</p>
                </div>
              </div>
              <div className="h-px bg-gray-100 my-1" />
              <div>
                <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1">เบอร์โทรศัพท์</p>
                <p className="text-sm font-medium text-gray-800">{customers?.phone || 'ยังไม่ได้ระบุ'}</p>
              </div>
              <div>
                <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                  <MapPin size={12}/> ที่อยู่จัดส่ง
                </p>
                {customers?.address || customers?.address_detail ? (
                  <div className="text-sm text-gray-700 space-y-0.5">
                    <p>{customers.address_detail || customers.address}</p>
                    {customers.subdistrict && <p className="text-gray-500">แขวง/ตำบล {customers.subdistrict}</p>}
                    {customers.district   && <p className="text-gray-500">เขต/อำเภอ {customers.district}</p>}
                    {customers.province   && <p className="text-gray-500">จังหวัด {customers.province}</p>}
                    {customers.zipcode    && <p className="text-gray-500 font-mono">{customers.zipcode}</p>}
                  </div>
                ) : (
                  <span className="text-gray-400 italic text-sm">ยังไม่ได้ระบุที่อยู่</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
