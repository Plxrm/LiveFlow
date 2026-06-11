import { useState, useEffect } from 'react'
import { Search, Plus, Pencil, Trash2, Package, CheckSquare, X, RefreshCw } from 'lucide-react'

interface KeyItem {
  id: string
  key_code: string
  price: number
  status: 'available' | 'reserved' | 'sold'
  products: {
    name: string
    description: string | null
    free_shipping: boolean
    shipping_fee: number // in db it's actually products.price
  }
}

export default function ProductsPage({ initialKeysData }: { initialKeysData: string }) {
  const [keys, setKeys] = useState<KeyItem[]>(() => JSON.parse(initialKeysData))
  const [loading, setLoading] = useState(false)

  // Filters
  const [search, setSearch] = useState('')
  const [filterTab, setFilterTab] = useState<'all' | 'available' | 'reserved' | 'sold'>('all')

  // Bulk Create Modal
  const [showBulkModal, setShowBulkModal] = useState(false)
  const [bulkForm, setBulkForm] = useState({
    name: '',
    description: '',
    prefix: '',
    quantity: 1,
    free_shipping: false,
    shipping_fee: 0,
    price: 0
  })
  const [savingBulk, setSavingBulk] = useState(false)

  // Edit Modal
  const [showEditModal, setShowEditModal] = useState(false)
  const [editForm, setEditForm] = useState<{
    id: string; key_code: string; name: string; price: number; free_shipping: boolean; shipping_fee: number; status: string
  } | null>(null)
  const [savingEdit, setSavingEdit] = useState(false)

  const fetchKeys = async () => {
    setLoading(true)
    try {
      const q = new URLSearchParams()
      if (filterTab !== 'all') q.append('status', filterTab)
      if (search) q.append('search', search)
      
      const res = await fetch(`/api/keys?${q.toString()}`)
      if (res.ok) {
        setKeys(await res.json())
      }
    } finally {
      setLoading(false)
    }
  }

  // Effect to re-fetch when tab or search changes
  useEffect(() => {
    // debounce search a bit
    const t = setTimeout(() => {
      fetchKeys()
    }, 300)
    return () => clearTimeout(t)
  }, [search, filterTab])

  const handleBulkSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSavingBulk(true)
    try {
      const res = await fetch('/api/keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bulkForm)
      })
      if (res.ok) {
        setShowBulkModal(false)
        fetchKeys()
      } else {
        const err = await res.json()
        alert(err.error || 'Failed to create keys')
      }
    } catch (err) {
      alert('Network error')
    } finally {
      setSavingBulk(false)
    }
  }

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editForm) return
    setSavingEdit(true)
    try {
      const res = await fetch(`/api/keys/${editForm.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          key_code: editForm.key_code,
          price: editForm.price,
          name: editForm.name,
          free_shipping: editForm.free_shipping,
          shipping_fee: editForm.shipping_fee
        })
      })
      if (res.ok) {
        setShowEditModal(false)
        fetchKeys()
      } else {
        const err = await res.json()
        alert(err.error || 'Failed to edit key')
      }
    } catch (err) {
      alert('Network error')
    } finally {
      setSavingEdit(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('ยืนยันการลบ Key นี้?')) return
    try {
      const res = await fetch(`/api/keys/${id}`, { method: 'DELETE' })
      if (res.ok) {
        fetchKeys()
      }
    } catch (err) {
      alert('Failed to delete')
    }
  }

  const getStatusBadge = (status: string) => {
    if (status === 'available') return <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">🟢 พร้อมขาย</span>
    if (status === 'reserved')  return <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">🟡 จองแล้ว</span>
    return <span className="inline-flex items-center gap-1 text-xs font-semibold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">⚫ ขายแล้ว</span>
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Package className="text-blue-600" />
            คลังสินค้า (Product Keys)
          </h1>
          <p className="text-sm text-gray-500 mt-1">จัดการรหัสสินค้า (CF Code), ราคา, และสถานะการขาย</p>
        </div>
        <button
          onClick={() => {
            setBulkForm({ name: '', description: '', prefix: '', quantity: 1, free_shipping: false, shipping_fee: 0, price: 0 })
            setShowBulkModal(true)
          }}
          className="bg-blue-600 text-white px-5 py-2.5 rounded-xl font-semibold hover:bg-blue-700 transition-colors shadow-sm flex items-center gap-2"
        >
          <Plus size={18} />
          สร้างรหัสสินค้าใหม่
        </button>
      </div>

      {/* Filters & Search */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex bg-gray-100 p-1 rounded-lg">
          {(['all', 'available', 'reserved', 'sold'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setFilterTab(tab)}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                filterTab === tab ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab === 'all' ? 'ทั้งหมด' : tab === 'available' ? 'พร้อมขาย' : tab === 'reserved' ? 'จองแล้ว' : 'ขายแล้ว'}
            </button>
          ))}
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="ค้นหา Key Code หรือชื่อสินค้า..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full md:w-64 pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                {['Key Code', 'ชื่อสินค้า', 'ราคา', 'ค่าส่ง', 'สถานะ', 'จัดการ'].map((h) => (
                  <th key={h} className="py-3 px-5 text-[11px] font-semibold uppercase text-gray-400 tracking-wider">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="text-sm text-gray-700">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-gray-400">
                    <RefreshCw className="animate-spin mx-auto mb-2" size={24} />
                    กำลังโหลดข้อมูล...
                  </td>
                </tr>
              ) : keys.length > 0 ? (
                keys.map(k => (
                  <tr key={k.id} className="border-b border-gray-50 hover:bg-blue-50/30 transition-colors">
                    <td className="py-3 px-5 font-mono font-bold text-blue-700">{k.key_code}</td>
                    <td className="py-3 px-5 font-medium">{k.products?.name}</td>
                    <td className="py-3 px-5 font-semibold">฿{k.price.toLocaleString()}</td>
                    <td className="py-3 px-5 text-gray-500">
                      {k.products?.free_shipping ? (
                        <span className="text-emerald-600 font-medium">ฟรี</span>
                      ) : (
                        `฿${(k.products?.shipping_fee || 0).toLocaleString()}`
                      )}
                    </td>
                    <td className="py-3 px-5">{getStatusBadge(k.status)}</td>
                    <td className="py-3 px-5">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setEditForm({
                              id: k.id,
                              key_code: k.key_code,
                              price: k.price,
                              name: k.products?.name || '',
                              free_shipping: k.products?.free_shipping || false,
                              shipping_fee: k.products?.shipping_fee || 0,
                              status: k.status
                            })
                            setShowEditModal(true)
                          }}
                          className="p-1.5 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-md transition-colors"
                          title="แก้ไข"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={() => handleDelete(k.id)}
                          className="p-1.5 text-red-500 bg-red-50 hover:bg-red-100 rounded-md transition-colors"
                          title="ลบ"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-gray-400">
                    ไม่พบข้อมูลสินค้ารหัสนี้
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bulk Create Modal */}
      {showBulkModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm" onClick={() => !savingBulk && setShowBulkModal(false)} />
          <div className="bg-white rounded-2xl w-full max-w-2xl relative shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h3 className="text-lg font-bold text-gray-800">สร้างสินค้ารหัสใหม่ (หลายชิ้น)</h3>
              <button onClick={() => !savingBulk && setShowBulkModal(false)} className="text-gray-400 hover:bg-gray-100 p-1.5 rounded-lg transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto custom-scrollbar flex flex-col gap-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5 sm:col-span-2">
                  <label className="text-xs font-semibold uppercase text-gray-400">ชื่อสินค้า</label>
                  <input type="text" value={bulkForm.name} onChange={e => setBulkForm(p => ({...p, name: e.target.value}))} required className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-100 outline-none" placeholder="เช่น เสื้อยืดสีขาว" />
                </div>
                
                <div className="flex flex-col gap-1.5 sm:col-span-2">
                  <label className="text-xs font-semibold uppercase text-gray-400">รายละเอียด (Optional)</label>
                  <textarea value={bulkForm.description} onChange={e => setBulkForm(p => ({...p, description: e.target.value}))} rows={2} className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-100 outline-none resize-none" placeholder="คำอธิบายสินค้าเพิ่มเติม" />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold uppercase text-gray-400">Prefix (ตัวอักษรนำหน้า)</label>
                  <input type="text" value={bulkForm.prefix} onChange={e => setBulkForm(p => ({...p, prefix: e.target.value.toUpperCase()}))} required className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-100 outline-none font-mono" placeholder="เช่น A" />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold uppercase text-gray-400">จำนวน Keys ที่จะสร้าง</label>
                  <input type="number" min={1} value={bulkForm.quantity} onChange={e => setBulkForm(p => ({...p, quantity: Number(e.target.value)}))} required className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-100 outline-none" />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold uppercase text-gray-400">ราคาต่อชิ้น</label>
                  <input type="number" min={0} value={bulkForm.price} onChange={e => setBulkForm(p => ({...p, price: Number(e.target.value)}))} required className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-100 outline-none" />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold uppercase text-gray-400">ค่าจัดส่ง</label>
                  <div className="flex items-center gap-3 mt-1">
                    <label className="flex items-center gap-2 cursor-pointer text-sm">
                      <input type="checkbox" checked={bulkForm.free_shipping} onChange={e => setBulkForm(p => ({...p, free_shipping: e.target.checked}))} className="rounded text-blue-600 focus:ring-blue-500" />
                      ฟรีค่าส่ง
                    </label>
                    {!bulkForm.free_shipping && (
                      <input type="number" min={0} value={bulkForm.shipping_fee} onChange={e => setBulkForm(p => ({...p, shipping_fee: Number(e.target.value)}))} className="w-24 bg-white border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-blue-100 outline-none" placeholder="฿" />
                    )}
                  </div>
                </div>
              </div>

              {/* Preview */}
              {bulkForm.prefix && bulkForm.quantity > 0 && (
                <div className="mt-2 bg-blue-50/50 rounded-xl p-4 border border-blue-100">
                  <p className="text-xs font-semibold text-blue-800 uppercase tracking-wider mb-3">ตัวอย่าง Key ที่จะถูกสร้าง</p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {Array.from({ length: Math.min(bulkForm.quantity, 12) }).map((_, i) => (
                      <div key={i} className="bg-white border border-blue-100 rounded-lg px-3 py-2 flex justify-between items-center text-sm">
                        <span className="font-mono font-bold text-blue-700">{bulkForm.prefix}{i+1}</span>
                        <span className="text-gray-500">฿{bulkForm.price}</span>
                      </div>
                    ))}
                    {bulkForm.quantity > 12 && (
                      <div className="bg-white border border-dashed border-gray-300 rounded-lg px-3 py-2 flex justify-center items-center text-sm text-gray-400">
                        + อีก {bulkForm.quantity - 12} ชิ้น
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-3 shrink-0">
              <button onClick={() => setShowBulkModal(false)} disabled={savingBulk} className="px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg text-sm font-semibold hover:bg-gray-50 transition-colors disabled:opacity-50">
                ยกเลิก
              </button>
              <button onClick={handleBulkSubmit} disabled={savingBulk || !bulkForm.name || !bulkForm.prefix} className="px-6 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 shadow-sm transition-colors disabled:opacity-50 flex items-center gap-2">
                {savingBulk && <RefreshCw size={14} className="animate-spin" />}
                {savingBulk ? 'กำลังบันทึก...' : 'บันทึกข้อมูล'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Single Key Modal */}
      {showEditModal && editForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm" onClick={() => !savingEdit && setShowEditModal(false)} />
          <div className="bg-white rounded-2xl w-full max-w-md relative shadow-xl overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h3 className="text-lg font-bold text-gray-800">แก้ไขรหัส {editForm.key_code}</h3>
              <button onClick={() => !savingEdit && setShowEditModal(false)} className="text-gray-400 hover:bg-gray-100 p-1.5 rounded-lg transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleEditSubmit} className="p-6 flex flex-col gap-4">
              <div className="flex justify-between items-center bg-gray-50 px-4 py-2 rounded-lg border border-gray-100">
                <span className="text-sm text-gray-500">สถานะปัจจุบัน</span>
                {getStatusBadge(editForm.status)}
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold uppercase text-gray-400">Key Code</label>
                <input type="text" value={editForm.key_code} onChange={e => setEditForm(p => p ? {...p, key_code: e.target.value.toUpperCase()} : null)} required className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-100 outline-none font-mono font-bold text-blue-700" />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold uppercase text-gray-400">ชื่อสินค้า (กระทบสินค้าอื่นในกลุ่มเดียวกัน)</label>
                <input type="text" value={editForm.name} onChange={e => setEditForm(p => p ? {...p, name: e.target.value} : null)} required className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-100 outline-none" />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold uppercase text-gray-400">ราคา</label>
                <input type="number" min={0} value={editForm.price} onChange={e => setEditForm(p => p ? {...p, price: Number(e.target.value)} : null)} required className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-100 outline-none" />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold uppercase text-gray-400">ค่าจัดส่ง (กระทบสินค้าอื่นในกลุ่มเดียวกัน)</label>
                <div className="flex items-center gap-3 mt-1">
                  <label className="flex items-center gap-2 cursor-pointer text-sm">
                    <input type="checkbox" checked={editForm.free_shipping} onChange={e => setEditForm(p => p ? {...p, free_shipping: e.target.checked} : null)} className="rounded text-blue-600 focus:ring-blue-500" />
                    ฟรีค่าส่ง
                  </label>
                  {!editForm.free_shipping && (
                    <input type="number" min={0} value={editForm.shipping_fee} onChange={e => setEditForm(p => p ? {...p, shipping_fee: Number(e.target.value)} : null)} className="w-full bg-white border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-blue-100 outline-none" placeholder="฿" />
                  )}
                </div>
              </div>

              <button type="submit" disabled={savingEdit} className="mt-2 w-full py-2.5 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 shadow-sm transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                {savingEdit && <RefreshCw size={14} className="animate-spin" />}
                {savingEdit ? 'กำลังบันทึก...' : 'บันทึกการแก้ไข'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
