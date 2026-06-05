import { useState, useEffect, useCallback } from 'react'
import { Key, Trash2, Plus, RefreshCw, CheckSquare, Square, Pencil, Check } from 'lucide-react'

interface ProductKey {
  id: string
  product_id: string
  key_code: string
  price: number
  status: 'available' | 'reserved' | 'sold'
  order_id: string | null
  sold_at: string | null
  created_at: string
}

interface ProductKeysManagerProps {
  productId: string
  productName: string
}

const STATUS_MAP = {
  available: { label: 'พร้อมขาย', color: 'bg-emerald-100 text-emerald-700' },
  reserved:  { label: 'จองแล้ว',  color: 'bg-amber-100 text-amber-700'   },
  sold:      { label: 'ขายแล้ว', color: 'bg-gray-100 text-gray-500'     },
}
type FilterStatus = 'all' | 'available' | 'reserved' | 'sold'

// ─── Key builder for "Add Keys" modal ────────────────────────────────────────
interface PendingKey { key_code: string; price: number; quantity: number }

function AddKeysModal({
  productId,
  onClose,
  onAdded,
}: { productId: string; onClose: () => void; onAdded: () => void }) {
  const [keyType, setKeyType] = useState<'A' | 'B'>('A')
  const [saving, setSaving] = useState(false)

  // Type A state
  const [prefix, setPrefix]     = useState('')
  const [startNum, setStartNum] = useState(1)
  const [keyCount, setKeyCount] = useState(5)
  const [keysA, setKeysA]       = useState<{ key_code: string; price: number }[]>([])

  // Type B state
  const [keyCodeB, setKeyCodeB] = useState('')
  const [priceB, setPriceB]     = useState(0)
  const [qtyB, setQtyB]         = useState(1)

  // Bulk price helpers for A
  const [bulkPrice, setBulkPrice]       = useState(0)
  const [rangeFrom, setRangeFrom]       = useState(0)
  const [rangeTo, setRangeTo]           = useState(0)

  // Generate Type A rows when prefix/count changes
  useEffect(() => {
    if (keyType !== 'A') return
    const rows: { key_code: string; price: number }[] = []
    for (let i = 0; i < keyCount; i++) {
      const existing = keysA[i]
      rows.push({ key_code: `${prefix}${startNum + i}`, price: existing?.price ?? 0 })
    }
    setKeysA(rows)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prefix, startNum, keyCount, keyType])

  const applyBulkPrice = () => setKeysA(prev => prev.map(k => ({ ...k, price: bulkPrice })))
  const applyRangePrice = () => {
    if (keysA.length < 2) return
    const step = (rangeTo - rangeFrom) / (keysA.length - 1)
    setKeysA(prev => prev.map((k, i) => ({ ...k, price: Math.round(rangeFrom + step * i) })))
  }

  const totalItems = keyType === 'A' ? keysA.length : qtyB
  const priceRange = keyType === 'A'
    ? keysA.length > 0
      ? `฿${Math.min(...keysA.map(k => k.price)).toLocaleString()} – ฿${Math.max(...keysA.map(k => k.price)).toLocaleString()}`
      : '–'
    : `฿${priceB}/ชิ้น — รวม ฿${(priceB * qtyB).toLocaleString()}`

  const handleSave = async () => {
    let keys: PendingKey[] = []
    if (keyType === 'A') {
      keys = keysA.filter(k => k.key_code.trim()).map(k => ({ ...k, quantity: 1 }))
    } else {
      if (!keyCodeB.trim()) return
      keys = [{ key_code: keyCodeB, price: priceB, quantity: qtyB }]
    }
    if (keys.length === 0) return
    setSaving(true)
    try {
      const res = await fetch(`/api/products/${productId}/keys`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keys }),
      })
      if (res.ok) { onAdded(); onClose() }
      else alert('เกิดข้อผิดพลาดในการบันทึก')
    } catch { alert('เกิดข้อผิดพลาด') } finally { setSaving(false) }
  }

  return (
    <div className="fixed inset-0 z-[70] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] flex flex-col">
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50 rounded-t-2xl">
          <h3 className="text-base font-semibold text-gray-800 flex items-center gap-2">
            <Key size={16} className="text-blue-600" /> เพิ่ม Keys
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">×</button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-5">
          {/* Key Type Radio */}
          <div className="flex flex-col gap-2">
            <p className="text-xs font-semibold text-gray-400 uppercase">ประเภท</p>
            <div className="flex gap-3">
              {(['A', 'B'] as const).map(t => (
                <label key={t} className={`flex items-start gap-2 flex-1 p-3 border rounded-xl cursor-pointer transition-all ${keyType === t ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}>
                  <input type="radio" value={t} checked={keyType === t} onChange={() => setKeyType(t)} className="mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-gray-700">แบบ {t}</p>
                    <p className="text-xs text-gray-400">{t === 'A' ? 'หลาย Key หลายราคา' : 'Key เดียว หลายชิ้น ราคาเดียว'}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Type A */}
          {keyType === 'A' && (
            <>
              <div className="grid grid-cols-3 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-gray-400 uppercase">Prefix</label>
                  <input type="text" placeholder="เช่น ก, A" value={prefix} onChange={e => setPrefix(e.target.value)}
                    className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-blue-500 outline-none" />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-gray-400 uppercase">เริ่มจาก</label>
                  <input type="number" min="0" value={startNum} onChange={e => setStartNum(Number(e.target.value))}
                    className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-blue-500 outline-none" />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-gray-400 uppercase">จำนวน Keys</label>
                  <input type="number" min="1" max="200" value={keyCount} onChange={e => setKeyCount(Number(e.target.value))}
                    className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-blue-500 outline-none" />
                </div>
              </div>

              {/* Bulk price helpers */}
              <div className="flex flex-col gap-2 bg-gray-50 rounded-xl p-3">
                <p className="text-xs font-semibold text-gray-400 uppercase">ตัวช่วยตั้งราคา</p>
                <div className="flex gap-2 items-end">
                  <div className="flex flex-col gap-1 flex-1">
                    <label className="text-xs text-gray-400">ราคาเดียวกันทั้งหมด</label>
                    <input type="number" min="0" value={bulkPrice} onChange={e => setBulkPrice(Number(e.target.value))}
                      className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:border-blue-500 outline-none" />
                  </div>
                  <button onClick={applyBulkPrice} className="px-3 py-1.5 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700">
                    ใช้
                  </button>
                </div>
                <div className="flex gap-2 items-end">
                  <div className="flex flex-col gap-1 flex-1">
                    <label className="text-xs text-gray-400">ตั้งราคาช่วง (เริ่ม → สิ้นสุด)</label>
                    <div className="flex gap-1.5">
                      <input type="number" min="0" placeholder="เริ่ม" value={rangeFrom} onChange={e => setRangeFrom(Number(e.target.value))}
                        className="flex-1 px-2 py-1.5 border border-gray-200 rounded-lg text-sm focus:border-blue-500 outline-none" />
                      <span className="text-gray-400 self-center">→</span>
                      <input type="number" min="0" placeholder="สิ้นสุด" value={rangeTo} onChange={e => setRangeTo(Number(e.target.value))}
                        className="flex-1 px-2 py-1.5 border border-gray-200 rounded-lg text-sm focus:border-blue-500 outline-none" />
                    </div>
                  </div>
                  <button onClick={applyRangePrice} className="px-3 py-1.5 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700">
                    ใช้
                  </button>
                </div>
              </div>

              {/* Preview table */}
              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-gray-400 uppercase">Preview — {keysA.length} keys</p>
                  <button onClick={() => setKeysA(prev => [...prev, { key_code: '', price: 0 }])}
                    className="flex items-center gap-1 text-xs text-blue-600 hover:underline">
                    <Plus size={11} /> เพิ่ม key
                  </button>
                </div>
                <div className="border border-gray-200 rounded-xl overflow-hidden max-h-48 overflow-y-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 sticky top-0">
                      <tr>
                        <th className="px-3 py-2 text-left text-xs text-gray-400 font-semibold">Key Code</th>
                        <th className="px-3 py-2 text-left text-xs text-gray-400 font-semibold">ราคา (฿)</th>
                        <th className="px-3 py-2 w-8"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {keysA.map((item, i) => (
                        <tr key={i} className="hover:bg-gray-50">
                          <td className="px-3 py-1">
                            <input type="text" value={item.key_code}
                              onChange={e => setKeysA(prev => prev.map((k, idx) => idx === i ? { ...k, key_code: e.target.value } : k))}
                              className="w-full text-sm border-0 bg-transparent focus:outline-none font-mono" />
                          </td>
                          <td className="px-3 py-1">
                            <input type="number" min="0" value={item.price}
                              onChange={e => setKeysA(prev => prev.map((k, idx) => idx === i ? { ...k, price: Number(e.target.value) } : k))}
                              className="w-full text-sm border-0 bg-transparent focus:outline-none" />
                          </td>
                          <td className="px-3 py-1 text-center">
                            <button onClick={() => setKeysA(prev => prev.filter((_, idx) => idx !== i))}
                              className="text-gray-300 hover:text-red-500"><Trash2 size={13} /></button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {/* Type B */}
          {keyType === 'B' && (
            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1 col-span-2">
                  <label className="text-xs font-semibold text-gray-400 uppercase">Key Code</label>
                  <input type="text" placeholder="เช่น ข1" value={keyCodeB} onChange={e => setKeyCodeB(e.target.value)}
                    className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-blue-500 outline-none font-mono" />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-gray-400 uppercase">ราคาต่อชิ้น (฿)</label>
                  <input type="number" min="0" value={priceB} onChange={e => setPriceB(Number(e.target.value))}
                    className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-blue-500 outline-none" />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-gray-400 uppercase">จำนวนชิ้น</label>
                  <input type="number" min="1" value={qtyB} onChange={e => setQtyB(Number(e.target.value))}
                    className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-blue-500 outline-none" />
                </div>
              </div>
              {keyCodeB && (
                <div className="bg-blue-50 rounded-xl px-4 py-3 text-sm text-blue-800 font-medium">
                  {keyCodeB} — ราคา ฿{priceB.toLocaleString()}/ชิ้น — {qtyB} ชิ้น — รวม ฿{(priceB * qtyB).toLocaleString()}
                </div>
              )}
            </div>
          )}

          {/* Summary */}
          <div className="bg-gray-50 rounded-xl px-4 py-3 text-xs text-gray-500 flex flex-wrap gap-x-4 gap-y-1">
            <span>Keys: <strong>{keyType === 'A' ? keysA.length : 1}</strong></span>
            <span>ชิ้น: <strong>{totalItems}</strong></span>
            <span>ราคา: <strong>{priceRange}</strong></span>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-3 rounded-b-2xl">
          <button onClick={onClose} className="px-5 py-2 border border-gray-200 text-gray-600 text-sm rounded-lg hover:bg-gray-100">
            ยกเลิก
          </button>
          <button onClick={handleSave} disabled={saving}
            className="flex items-center gap-2 px-5 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50">
            {saving ? <RefreshCw size={14} className="animate-spin" /> : <Key size={14} />}
            บันทึก
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function ProductKeysManager({ productId }: ProductKeysManagerProps) {
  const [keys, setKeys]               = useState<ProductKey[]>([])
  const [loading, setLoading]         = useState(false)
  const [filter, setFilter]           = useState<FilterStatus>('all')
  const [selected, setSelected]       = useState<Set<string>>(new Set())
  const [showAddModal, setShowAddModal] = useState(false)
  const [bulkDeleting, setBulkDeleting] = useState(false)
  // Inline price edit
  const [editingKeyId, setEditingKeyId] = useState<string | null>(null)
  const [editPrice, setEditPrice]       = useState(0)

  const fetchKeys = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/products/${productId}/keys`)
      if (res.ok) setKeys(await res.json())
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }, [productId])

  useEffect(() => { fetchKeys() }, [fetchKeys])

  const filtered = filter === 'all' ? keys : keys.filter(k => k.status === filter)

  const toggleSelect = (id: string) => {
    setSelected(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n })
  }
  const toggleAll = () => {
    setSelected(selected.size === filtered.length ? new Set() : new Set(filtered.map(k => k.id)))
  }

  const handleBulkDelete = async () => {
    if (!selected.size || !confirm(`ยืนยันลบ ${selected.size} keys?`)) return
    setBulkDeleting(true)
    try {
      const res = await fetch(`/api/products/${productId}/keys/bulk-delete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: Array.from(selected) }),
      })
      if (res.ok) { setSelected(new Set()); await fetchKeys() }
      else alert('เกิดข้อผิดพลาดในการลบ')
    } catch { alert('เกิดข้อผิดพลาด') } finally { setBulkDeleting(false) }
  }

  const handleDeleteSingle = async (keyId: string) => {
    if (!confirm('ยืนยันลบ key นี้?')) return
    try {
      const res = await fetch(`/api/products/keys/${keyId}`, { method: 'DELETE' })
      if (res.ok) await fetchKeys()
    } catch { alert('เกิดข้อผิดพลาด') }
  }

  const startEditPrice = (key: ProductKey) => { setEditingKeyId(key.id); setEditPrice(key.price) }
  const saveEditPrice = async (keyId: string) => {
    try {
      await fetch(`/api/products/keys/${keyId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ price: editPrice }),
      })
      setEditingKeyId(null)
      await fetchKeys()
    } catch { alert('เกิดข้อผิดพลาด') }
  }

  const counts = {
    available: keys.filter(k => k.status === 'available').length,
    reserved:  keys.filter(k => k.status === 'reserved').length,
    sold:      keys.filter(k => k.status === 'sold').length,
  }

  // Group type-B keys (same key_code, multiple rows) for display summary
  const availableByCode: Record<string, number> = {}
  keys.filter(k => k.status === 'available').forEach(k => {
    availableByCode[k.key_code] = (availableByCode[k.key_code] || 0) + 1
  })

  return (
    <div className="flex flex-col gap-4">
      {/* Summary bar */}
      <div className="flex flex-wrap gap-2 items-center justify-between">
        <div className="flex gap-3 text-sm flex-wrap">
          <span className="text-emerald-600 font-semibold">พร้อมขาย: {counts.available}</span>
          <span className="text-gray-300">|</span>
          <span className="text-amber-600 font-semibold">จอง: {counts.reserved}</span>
          <span className="text-gray-300">|</span>
          <span className="text-gray-500 font-semibold">ขายแล้ว: {counts.sold}</span>
          <span className="text-gray-300">|</span>
          <span className="text-gray-700 font-semibold">รวม: {keys.length}</span>
        </div>
        <div className="flex gap-2">
          {selected.size > 0 && (
            <button onClick={handleBulkDelete} disabled={bulkDeleting}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-600 text-sm font-medium rounded-lg hover:bg-red-100 disabled:opacity-50">
              <Trash2 size={14} /> ลบที่เลือก ({selected.size})
            </button>
          )}
          <button onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700">
            <Plus size={14} /> เพิ่ม Keys
          </button>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 border-b border-gray-100">
        {([['all', 'ทั้งหมด', keys.length], ['available', 'พร้อมขาย', counts.available], ['reserved', 'จองแล้ว', counts.reserved], ['sold', 'ขายแล้ว', counts.sold]] as [FilterStatus, string, number][]).map(([val, label, cnt]) => (
          <button key={val} onClick={() => setFilter(val)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${filter === val ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
            {label}
            <span className="ml-1.5 text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full">{cnt}</span>
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="border border-gray-100 rounded-xl overflow-hidden relative">
        {loading && (
          <div className="absolute inset-0 bg-white/70 flex items-center justify-center z-10">
            <span className="w-6 h-6 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
          </div>
        )}
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              <th className="px-4 py-3 w-10">
                <button onClick={toggleAll} className="text-gray-400 hover:text-blue-600">
                  {selected.size > 0 && selected.size === filtered.length
                    ? <CheckSquare size={16} className="text-blue-600" />
                    : <Square size={16} />}
                </button>
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase">Key Code</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase">ราคา (฿)</th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-400 uppercase">สถานะ</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase">Order</th>
              <th className="px-4 py-3 w-16"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50 text-gray-700">
            {filtered.length > 0 ? filtered.map(key => (
              <tr key={key.id} className={`hover:bg-blue-50/20 transition-colors ${selected.has(key.id) ? 'bg-blue-50/30' : ''}`}>
                <td className="px-4 py-2.5 text-center">
                  <button onClick={() => toggleSelect(key.id)} className="text-gray-300 hover:text-blue-500">
                    {selected.has(key.id) ? <CheckSquare size={16} className="text-blue-500" /> : <Square size={16} />}
                  </button>
                </td>
                <td className="px-4 py-2.5 font-mono font-semibold text-gray-800">
                  {key.key_code}
                  {availableByCode[key.key_code] > 1 && key.status === 'available' && (
                    <span className="ml-2 text-[11px] text-gray-400 font-normal">({availableByCode[key.key_code]} ชิ้นพร้อมขาย)</span>
                  )}
                </td>
                <td className="px-4 py-2.5">
                  {editingKeyId === key.id ? (
                    <div className="flex items-center gap-1">
                      <input type="number" min="0" value={editPrice} onChange={e => setEditPrice(Number(e.target.value))}
                        className="w-24 px-2 py-1 border border-blue-300 rounded text-sm focus:outline-none" autoFocus />
                      <button onClick={() => saveEditPrice(key.id)} className="text-emerald-500 hover:text-emerald-600"><Check size={14} /></button>
                      <button onClick={() => setEditingKeyId(null)} className="text-gray-400 hover:text-gray-600 text-sm">×</button>
                    </div>
                  ) : (
                    <button onClick={() => startEditPrice(key)}
                      className="flex items-center gap-1.5 text-gray-700 hover:text-blue-600 group">
                      <span>฿{key.price.toLocaleString()}</span>
                      <Pencil size={11} className="text-gray-300 group-hover:text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </button>
                  )}
                </td>
                <td className="px-4 py-2.5 text-center">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${STATUS_MAP[key.status].color}`}>
                    {STATUS_MAP[key.status].label}
                  </span>
                </td>
                <td className="px-4 py-2.5 text-xs text-gray-400 font-mono">
                  {key.order_id ? key.order_id.slice(0, 8) + '…' : '–'}
                </td>
                <td className="px-4 py-2.5 text-center">
                  {key.status === 'available' && (
                    <button onClick={() => handleDeleteSingle(key.id)} className="text-gray-300 hover:text-red-500 transition-colors">
                      <Trash2 size={14} />
                    </button>
                  )}
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-gray-400 text-sm">
                  {loading ? '' : 'ยังไม่มี keys ในหมวดนี้'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showAddModal && (
        <AddKeysModal productId={productId} onClose={() => setShowAddModal(false)} onAdded={fetchKeys} />
      )}
    </div>
  )
}
