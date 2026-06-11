import { useState, useEffect } from 'react'
import { Plus, Radio, Play, Square, Package, ArrowLeft, Trash2, X, Key } from 'lucide-react'
import { formatDate, formatTime, formatPrice } from '../../utils/format'

interface LiveSession {
  id: string
  title: string
  status: 'draft' | 'live' | 'ended'
  started_at: string | null
  ended_at: string | null
  note?: string | null
  product_count: number
  created_at: string
}

interface AvailableKey {
  id: string
  key_code: string
  price: number
  product_id: string
}

interface LiveProduct {
  id: string
  cf_code: string
  products: {
    id: string
    name: string
    price: number
    stock: number
    image_url: string | null
    free_shipping: boolean
  }
  available_keys: AvailableKey[]
}

interface LivePageProps {
  initialSessions: LiveSession[]
}

export default function LivePage({ initialSessions }: LivePageProps) {
  const [sessions, setSessions] = useState<LiveSession[]>(initialSessions)
  const [loading, setLoading] = useState(false)

  // Modals & Views
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [createForm, setCreateForm] = useState({ title: '', note: '' })

  const [activeSessionId, setActiveSessionId] = useState<string | null>(null)
  const [sessionDetails, setSessionDetails] = useState<{ session: LiveSession, products: LiveProduct[] } | null>(null)

  const [showAddProductModal, setShowAddProductModal] = useState(false)
  const [availableProducts, setAvailableProducts] = useState<any[]>([])
  const [selectedProductId, setSelectedProductId] = useState('')

  const fetchSessions = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/live')
      if (res.ok) setSessions(await res.json())
    } finally {
      setLoading(false)
    }
  }

  const fetchSessionDetails = async (id: string) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/live/${id}`)
      if (res.ok) {
        const data = await res.json()
        setSessionDetails({
          session: data,
          products: data.live_products || []
        })
      }
    } finally {
      setLoading(false)
    }
  }

  const handleCreateSession = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const res = await fetch('/api/live', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(createForm)
      })
      if (res.ok) {
        setShowCreateModal(false)
        setCreateForm({ title: '', note: '' })
        fetchSessions()
      } else {
        const err = await res.json()
        alert(err.error || 'Failed to create session')
      }
    } catch (e) {
      alert('Network error')
    }
  }

  const handleChangeStatus = async (status: 'draft' | 'live' | 'ended') => {
    if (!activeSessionId) return
    if (!confirm(`ยืนยันการเปลี่ยนสถานะเป็น ${status}?`)) return
    
    try {
      const res = await fetch(`/api/live/${activeSessionId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      })
      if (res.ok) {
        fetchSessionDetails(activeSessionId)
        fetchSessions()
      }
    } catch (e) {
      alert('Network error')
    }
  }

  const openAddProductModal = async () => {
    if (!activeSessionId) return
    try {
      const res = await fetch(`/api/live/${activeSessionId}/products`)
      if (res.ok) {
        setAvailableProducts(await res.json())
        setSelectedProductId('')
        setShowAddProductModal(true)
      }
    } catch (e) {
      alert('Failed to fetch available products')
    }
  }

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!activeSessionId || !selectedProductId) return
    try {
      const res = await fetch(`/api/live/${activeSessionId}/products`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ product_id: selectedProductId })
      })
      if (res.ok) {
        setShowAddProductModal(false)
        fetchSessionDetails(activeSessionId)
        fetchSessions()
      } else {
        const err = await res.json()
        alert(err.error || 'Failed to add product')
      }
    } catch (e) {
      alert('Network error')
    }
  }

  const handleRemoveProduct = async (id: string) => {
    if (!activeSessionId) return
    if (!confirm('ยืนยันการลบสินค้าออกจากไลฟ์?')) return
    try {
      const res = await fetch(`/api/live/${activeSessionId}/products/${id}`, {
        method: 'DELETE'
      })
      if (res.ok) {
        fetchSessionDetails(activeSessionId)
        fetchSessions()
      }
    } catch (e) {
      alert('Network error')
    }
  }

  // Helper: get selected product info
  const selectedProduct = availableProducts.find(p => p.id === selectedProductId)

  // View: Session Details
  if (activeSessionId && sessionDetails) {
    const { session, products } = sessionDetails
    return (
      <div className="max-w-[1000px] mx-auto flex flex-col gap-6">
        <button onClick={() => setActiveSessionId(null)} className="flex items-center gap-2 text-gray-500 hover:text-gray-800 transition-colors w-fit">
          <ArrowLeft size={16} /> กลับไปหน้ารายการไลฟ์
        </button>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl font-bold text-gray-800">{session.title}</h1>
              {session.status === 'live' && <span className="flex items-center gap-1.5 bg-red-100 text-red-700 px-2.5 py-1 rounded-full text-xs font-bold animate-pulse"><Radio size={12}/> LIVE</span>}
              {session.status === 'draft' && <span className="bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full text-xs font-bold">DRAFT</span>}
              {session.status === 'ended' && <span className="bg-green-100 text-green-700 px-2.5 py-1 rounded-full text-xs font-bold">ENDED</span>}
            </div>
            <p className="text-sm text-gray-500">
              สร้างเมื่อ: {formatDate(session.created_at)} {formatTime(session.created_at)}
              {session.started_at && ` • เริ่มไลฟ์: ${formatTime(session.started_at)}`}
              {session.ended_at && ` • จบไลฟ์: ${formatTime(session.ended_at)}`}
            </p>
          </div>
          <div className="flex gap-2">
            {session.status === 'draft' && (
              <button onClick={() => handleChangeStatus('live')} className="flex items-center gap-2 bg-red-500 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-red-600 shadow-sm transition-colors">
                <Play size={16} /> เริ่มไลฟ์
              </button>
            )}
            {session.status === 'live' && (
              <button onClick={() => handleChangeStatus('ended')} className="flex items-center gap-2 bg-gray-800 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-gray-900 shadow-sm transition-colors">
                <Square size={16} /> จบไลฟ์
              </button>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50">
            <h2 className="font-semibold text-gray-800 flex items-center gap-2"><Package size={18} /> สินค้าในไลฟ์ ({products.length})</h2>
            {session.status !== 'ended' && (
              <button onClick={openAddProductModal} className="flex items-center gap-1.5 bg-white border border-gray-200 text-blue-600 px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-blue-50 transition-colors shadow-sm">
                <Plus size={14} /> เพิ่มสินค้า
              </button>
            )}
          </div>

          {/* Product Cards */}
          <div className="p-4 flex flex-col gap-3">
            {products.length > 0 ? products.map(lp => {
              const keys = lp.available_keys || []
              const keyCount = keys.length
              const prices = keys.map(k => k.price)
              const minPrice = prices.length > 0 ? Math.min(...prices) : null
              const maxPrice = prices.length > 0 ? Math.max(...prices) : null
              const previewKeys = keys.slice(0, 8)
              const hasMore = keys.length > 8

              return (
                <div key={lp.id} className="border border-gray-100 rounded-xl p-4 flex flex-col gap-3 hover:border-blue-100 transition-colors bg-white">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      {lp.products.image_url ? (
                        <img src={lp.products.image_url} alt="" className="w-10 h-10 rounded-lg object-cover shrink-0" />
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
                          <Package size={16} className="text-gray-400"/>
                        </div>
                      )}
                      <div>
                        <p className="font-semibold text-gray-800">{lp.products.name}</p>
                        {lp.products.free_shipping
                          ? <span className="text-[11px] text-green-600 font-medium">🚚 ฟรีค่าส่ง</span>
                          : <span className="text-[11px] text-gray-400">ค่าส่ง: {formatPrice(lp.products.price)}</span>
                        }
                      </div>
                    </div>
                    {session.status !== 'ended' && (
                      <button onClick={() => handleRemoveProduct(lp.id)} className="text-gray-300 hover:text-red-500 p-1.5 rounded-lg hover:bg-red-50 transition-colors shrink-0">
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>

                  {/* Keys info */}
                  {keyCount > 0 ? (
                    <div className="bg-blue-50 rounded-lg p-3 flex flex-col gap-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-blue-700 flex items-center gap-1.5">
                          <Key size={12} />
                          Keys พร้อมขาย: {keyCount} ชิ้น
                        </span>
                        {minPrice !== null && (
                          <span className="text-xs font-semibold text-green-700">
                            {minPrice === maxPrice
                              ? formatPrice(minPrice)
                              : `${formatPrice(minPrice)} – ${formatPrice(maxPrice!)}`
                            }
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {previewKeys.map(k => (
                          <span key={k.id} className="bg-white border border-blue-200 text-blue-700 font-mono text-[11px] font-bold px-2 py-0.5 rounded">
                            {k.key_code}
                          </span>
                        ))}
                        {hasMore && (
                          <span className="text-[11px] text-blue-400 px-1 py-0.5">+{keys.length - 8} เพิ่มเติม</span>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
                      <p className="text-xs text-amber-700 font-medium">⚠️ ยังไม่มี keys พร้อมขาย — เพิ่ม keys ในหน้าสินค้า</p>
                    </div>
                  )}
                </div>
              )
            }) : (
              <div className="py-12 text-center flex flex-col items-center gap-2">
                <Package size={36} className="text-gray-200" />
                <p className="text-gray-400 font-medium">ยังไม่มีสินค้าในไลฟ์นี้</p>
                <p className="text-sm text-gray-400">กดปุ่ม "เพิ่มสินค้า" เพื่อเพิ่มสินค้าเข้าไลฟ์</p>
              </div>
            )}
          </div>
        </div>

        {/* Add Product Modal */}
        {showAddProductModal && (
          <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
            <form onSubmit={handleAddProduct} className="bg-white rounded-xl shadow-xl border border-gray-100 w-full max-w-lg overflow-hidden flex flex-col">
              <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                <h2 className="font-semibold text-gray-800 flex items-center gap-2"><Package size={18} className="text-blue-500"/> เพิ่มสินค้าเข้าระบบไลฟ์</h2>
                <button type="button" onClick={() => setShowAddProductModal(false)} className="text-gray-400 hover:text-red-500"><X size={20} /></button>
              </div>
              <div className="p-6 flex flex-col gap-4">
                <div>
                  <label className="text-xs font-semibold uppercase text-gray-500 mb-1 block">เลือกสินค้า <span className="text-red-500">*</span></label>
                  <select 
                    required 
                    value={selectedProductId}
                    onChange={e => setSelectedProductId(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-blue-500"
                  >
                    <option value="" disabled>-- เลือกสินค้า --</option>
                    {availableProducts.map(p => {
                      const keyCount = (p.available_keys || []).length
                      return (
                        <option key={p.id} value={p.id}>
                          {p.name} — {keyCount} keys พร้อมขาย
                        </option>
                      )
                    })}
                  </select>
                </div>

                {/* Preview keys of selected product */}
                {selectedProduct && (
                  <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex flex-col gap-2">
                    {(selectedProduct.available_keys || []).length > 0 ? (
                      <>
                        <p className="text-xs font-semibold text-blue-700 flex items-center gap-1.5">
                          <Key size={12} />
                          สินค้านี้มี {selectedProduct.available_keys.length} keys พร้อมขาย:
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {(selectedProduct.available_keys as AvailableKey[]).slice(0, 10).map(k => (
                            <span key={k.id} className="bg-white border border-blue-200 text-blue-700 font-mono text-[11px] font-bold px-2 py-0.5 rounded">
                              {k.key_code} <span className="text-green-600">฿{k.price}</span>
                            </span>
                          ))}
                          {selectedProduct.available_keys.length > 10 && (
                            <span className="text-[11px] text-blue-400 px-1">+{selectedProduct.available_keys.length - 10} เพิ่มเติม</span>
                          )}
                        </div>
                      </>
                    ) : (
                      <p className="text-xs text-amber-700 font-medium flex items-center gap-1.5">
                        ⚠️ สินค้านี้ยังไม่มี keys พร้อมขาย — กรุณาเพิ่ม keys ในหน้าสินค้าก่อน
                      </p>
                    )}
                  </div>
                )}
              </div>
              <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-2">
                <button type="button" onClick={() => setShowAddProductModal(false)} className="px-4 py-2 border border-gray-200 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-100">ยกเลิก</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:opacity-50" disabled={!selectedProductId}>เพิ่มเข้าไลฟ์</button>
              </div>
            </form>
          </div>
        )}
      </div>
    )
  }

  // View: Sessions List
  return (
    <div className="max-w-[1440px] mx-auto flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">ระบบจัดการไลฟ์สด</h1>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 bg-red-500 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-red-600 transition-colors shadow-sm active:scale-95"
        >
          <Radio size={16} />
          สร้างไลฟ์ใหม่
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {sessions.length > 0 ? sessions.map(s => (
          <div 
            key={s.id} 
            onClick={() => {
              setActiveSessionId(s.id)
              fetchSessionDetails(s.id)
            }}
            className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 flex flex-col gap-4 cursor-pointer hover:shadow-md hover:border-blue-100 transition-all group"
          >
            <div className="flex justify-between items-start gap-2">
              <h3 className="font-bold text-gray-800 text-lg group-hover:text-blue-600 transition-colors line-clamp-2">{s.title}</h3>
              {s.status === 'live' && <span className="flex items-center gap-1 bg-red-100 text-red-700 px-2 py-0.5 rounded text-[10px] font-bold animate-pulse shrink-0"><Radio size={10}/> LIVE</span>}
              {s.status === 'draft' && <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded text-[10px] font-bold shrink-0">DRAFT</span>}
              {s.status === 'ended' && <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded text-[10px] font-bold shrink-0">ENDED</span>}
            </div>
            
            <div className="flex items-center gap-2 text-sm font-medium text-gray-600 bg-gray-50 py-2 px-3 rounded-lg w-fit">
              <Package size={16} className="text-gray-400" />
              {s.product_count} สินค้า
            </div>

            <div className="mt-auto pt-4 border-t border-gray-50 flex flex-col gap-1 text-[11px] text-gray-500">
              <p>สร้าง: {formatDate(s.created_at)}</p>
              {s.started_at && <p className="text-blue-600">เริ่ม: {formatTime(s.started_at)}</p>}
            </div>
          </div>
        )) : (
          <div className="col-span-full py-16 text-center flex flex-col items-center justify-center gap-3">
            <Radio size={48} className="text-gray-200" />
            <p className="text-gray-400 font-medium text-lg">ยังไม่มีเซสชั่นไลฟ์</p>
            <p className="text-sm text-gray-400">สร้างไลฟ์ใหม่เพื่อเริ่มขายสินค้า</p>
          </div>
        )}
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <form onSubmit={handleCreateSession} className="bg-white rounded-xl shadow-xl border border-gray-100 w-full max-w-md overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
              <h2 className="font-semibold text-gray-800 flex items-center gap-2"><Radio size={18} className="text-red-500" /> สร้างไลฟ์ใหม่</h2>
              <button type="button" onClick={() => setShowCreateModal(false)} className="text-gray-400 hover:text-red-500"><X size={20} /></button>
            </div>
            <div className="p-6 flex flex-col gap-4">
              <div>
                <label className="text-xs font-semibold uppercase text-gray-500 mb-1 block">หัวข้อไลฟ์ <span className="text-red-500">*</span></label>
                <input 
                  type="text" required placeholder="เช่น Live แจกโปรเดือดประจำเดือน!"
                  value={createForm.title}
                  onChange={e => setCreateForm({...createForm, title: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="text-xs font-semibold uppercase text-gray-500 mb-1 block">หมายเหตุ</label>
                <textarea 
                  rows={3} placeholder="โน้ตกันลืม (ไม่แสดงให้ลูกค้าเห็น)"
                  value={createForm.note}
                  onChange={e => setCreateForm({...createForm, note: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-blue-500 resize-none"
                />
              </div>
            </div>
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-2">
              <button type="button" onClick={() => setShowCreateModal(false)} className="px-4 py-2 border border-gray-200 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-100">ยกเลิก</button>
              <button type="submit" className="px-4 py-2 bg-red-500 text-white rounded-lg text-sm font-semibold hover:bg-red-600">สร้างไลฟ์</button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
