import { useState, useEffect, lazy, Suspense } from 'react'
import {
  Search, Plus, Pencil, Trash2, Package, TrendingDown, CheckSquare,
  X, Key, RefreshCw, Truck
} from 'lucide-react'

const ProductKeysManager = lazy(() => import('./ProductKeysManager'))

interface Product {
  id: string
  name: string
  description: string | null
  stock: number
  is_active: boolean
  free_shipping: boolean
  created_at: string
}

interface ProductsPageProps {
  initialProducts: Product[]
  stats: {
    totalProducts: number
    activeProducts: number
    outOfStock: number
    totalValue: number
  }
}

// ─── Key types ────────────────────────────────────────────────────────────────
type KeyType = 'A' | 'B'
interface PendingKey { key_code: string; price: number; quantity: number }

// ─── Default form ─────────────────────────────────────────────────────────────
const defaultForm = { name: '', description: '', free_shipping: false, is_active: true }

// ─── Toggle Switch ────────────────────────────────────────────────────────────
function ToggleSwitch({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <label className="flex items-center gap-3 cursor-pointer">
      <div
        onClick={() => onChange(!checked)}
        className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${checked ? 'bg-emerald-500' : 'bg-gray-200'}`}
      >
        <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-200 ${checked ? 'translate-x-5' : 'translate-x-0'}`} />
      </div>
      <span className="text-sm font-medium text-gray-700">{label}</span>
    </label>
  )
}

// ─── Add Keys section (shared for create modal step 2 equivalent, now inline) ─
function KeyBuilder({
  keyType,
  setKeyType,
  keysA,
  setKeysA,
  keyCodeB,
  setKeyCodeB,
  priceB,
  setPriceB,
  qtyB,
  setQtyB,
  prefix,
  setPrefix,
  startNum,
  setStartNum,
  keyCount,
  setKeyCount,
}: {
  keyType: KeyType; setKeyType: (t: KeyType) => void
  keysA: { key_code: string; price: number }[]; setKeysA: (v: { key_code: string; price: number }[]) => void
  keyCodeB: string; setKeyCodeB: (v: string) => void
  priceB: number; setPriceB: (v: number) => void
  qtyB: number; setQtyB: (v: number) => void
  prefix: string; setPrefix: (v: string) => void
  startNum: number; setStartNum: (v: number) => void
  keyCount: number; setKeyCount: (v: number) => void
}) {
  const [bulkPrice, setBulkPrice] = useState(0)
  const [rangeFrom, setRangeFrom] = useState(0)
  const [rangeTo, setRangeTo]     = useState(0)

  const applyBulk  = () => setKeysA(keysA.map(k => ({ ...k, price: bulkPrice })))
  const applyRange = () => {
    if (keysA.length < 2) return
    const step = (rangeTo - rangeFrom) / (keysA.length - 1)
    setKeysA(keysA.map((k, i) => ({ ...k, price: Math.round(rangeFrom + step * i) })))
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Type selector */}
      <div>
        <p className="text-xs font-semibold text-gray-400 uppercase mb-2">ประเภท Keys</p>
        <div className="flex gap-3">
          {(['A', 'B'] as KeyType[]).map(t => (
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
          <div className="bg-gray-50 rounded-xl p-3 flex flex-col gap-2">
            <p className="text-xs font-semibold text-gray-400 uppercase">ตัวช่วยตั้งราคา</p>
            <div className="flex gap-2 items-end">
              <div className="flex flex-col gap-1 flex-1">
                <label className="text-xs text-gray-400">ราคาเดียวกันทั้งหมด</label>
                <input type="number" min="0" value={bulkPrice} onChange={e => setBulkPrice(Number(e.target.value))}
                  className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:border-blue-500 outline-none" />
              </div>
              <button onClick={applyBulk} className="px-3 py-1.5 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700">ใช้</button>
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
              <button onClick={applyRange} className="px-3 py-1.5 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700">ใช้</button>
            </div>
          </div>

          {/* Key table preview */}
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-gray-400 uppercase">Preview — {keysA.length} keys</p>
              <button onClick={() => setKeysA([...keysA, { key_code: '', price: 0 }])}
                className="flex items-center gap-1 text-xs text-blue-600 hover:underline">
                <Plus size={11} /> เพิ่ม key
              </button>
            </div>
            <div className="border border-gray-200 rounded-xl overflow-hidden max-h-52 overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs text-gray-400 font-semibold">Key Code</th>
                    <th className="px-3 py-2 text-left text-xs text-gray-400 font-semibold">ราคา (฿)</th>
                    <th className="px-3 py-2 w-8"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {keysA.slice(0, 100).map((item, i) => (
                    <tr key={i} className="hover:bg-gray-50">
                      <td className="px-3 py-1">
                        <input type="text" value={item.key_code}
                          onChange={e => setKeysA(keysA.map((k, idx) => idx === i ? { ...k, key_code: e.target.value } : k))}
                          className="w-full text-sm border-0 bg-transparent focus:outline-none font-mono" />
                      </td>
                      <td className="px-3 py-1">
                        <input type="number" min="0" value={item.price}
                          onChange={e => setKeysA(keysA.map((k, idx) => idx === i ? { ...k, price: Number(e.target.value) } : k))}
                          className="w-full text-sm border-0 bg-transparent focus:outline-none" />
                      </td>
                      <td className="px-3 py-1 text-center">
                        <button onClick={() => setKeysA(keysA.filter((_, idx) => idx !== i))}
                          className="text-gray-300 hover:text-red-500"><Trash2 size={13} /></button>
                      </td>
                    </tr>
                  ))}
                  {keysA.length > 100 && (
                    <tr><td colSpan={3} className="px-3 py-2 text-center text-xs text-gray-400">...และอีก {keysA.length - 100} keys</td></tr>
                  )}
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
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
export default function ProductsPage({ initialProducts, stats }: ProductsPageProps) {
  const [products, setProducts] = useState<Product[]>(initialProducts)
  const [search, setSearch]     = useState('')
  const [loading, setLoading]   = useState(false)
  const [saving, setSaving]     = useState(false)

  // Modal
  const [showModal, setShowModal]   = useState(false)
  const [editingId, setEditingId]   = useState<string | null>(null)
  const [modalTab, setModalTab]     = useState<'info' | 'keys'>('info')
  const [formData, setFormData]     = useState(defaultForm)

  // Key builder state (for create modal)
  const [keyType, setKeyType]         = useState<KeyType>('A')
  const [keysA, setKeysA]             = useState<{ key_code: string; price: number }[]>([])
  const [keyCodeB, setKeyCodeB]       = useState('')
  const [priceB, setPriceB]           = useState(0)
  const [qtyB, setQtyB]               = useState(1)
  const [prefix, setPrefix]           = useState('')
  const [startNum, setStartNum]       = useState(1)
  const [keyCount, setKeyCount]       = useState(5)

  // Re-generate keysA whenever prefix/startNum/keyCount changes
  useEffect(() => {
    const rows: { key_code: string; price: number }[] = []
    for (let i = 0; i < keyCount; i++) {
      const existing = keysA[i]
      rows.push({ key_code: `${prefix}${startNum + i}`, price: existing?.price ?? 0 })
    }
    setKeysA(rows)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prefix, startNum, keyCount])

  const SUMMARY_CARDS = [
    { label: 'สินค้าทั้งหมด', value: stats.totalProducts.toLocaleString(), sub: 'รายการในระบบ',      icon: Package,     color: 'text-blue-600',  bg: 'bg-blue-50'  },
    { label: 'สต็อกหมด',      value: stats.outOfStock.toLocaleString(),    sub: 'ต้องเติมสต็อก',    icon: TrendingDown, color: 'text-red-500',   bg: 'bg-red-50',  subColor: 'text-red-500'  },
    { label: 'เปิดขาย',       value: stats.activeProducts.toLocaleString(), sub: 'พร้อมขาย',         icon: CheckSquare, color: 'text-teal-600', bg: 'bg-teal-50', subColor: 'text-teal-600' },
  ]

  const fetchProducts = async (query = '') => {
    setLoading(true)
    try {
      const res = await fetch(`/api/products${query ? `?search=${encodeURIComponent(query)}` : ''}`)
      if (res.ok) setProducts(await res.json())
    } catch (e) { console.error(e) } finally { setLoading(false) }
  }

  useEffect(() => {
    const t = setTimeout(() => fetchProducts(search), 500)
    return () => clearTimeout(t)
  }, [search])

  // ─── Modal helpers ─────────────────────────────────────────────────────────
  const resetKeyBuilder = () => {
    setKeyType('A'); setKeysA([]); setKeyCodeB(''); setPriceB(0); setQtyB(1)
    setPrefix(''); setStartNum(1); setKeyCount(5)
  }

  const openAddModal = () => {
    setEditingId(null)
    setFormData(defaultForm)
    setModalTab('info')
    resetKeyBuilder()
    setShowModal(true)
  }

  const openEditModal = (p: Product) => {
    setEditingId(p.id)
    setFormData({ name: p.name, description: p.description || '', free_shipping: p.free_shipping, is_active: p.is_active })
    setModalTab('info')
    setShowModal(true)
  }

  const closeModal = () => { setShowModal(false); setEditingId(null) }

  const handleDelete = async (id: string) => {
    if (!confirm('ยืนยันการลบสินค้านี้?')) return
    try {
      const res = await fetch(`/api/products/${id}`, { method: 'DELETE' })
      if (res.ok) fetchProducts(search)
      else alert('เกิดข้อผิดพลาดในการลบสินค้า')
    } catch { alert('เกิดข้อผิดพลาด') }
  }

  // ─── Submit (create or update) ─────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      if (editingId) {
        // UPDATE
        const res = await fetch(`/api/products/${editingId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: formData.name,
            description: formData.description || null,
            free_shipping: formData.free_shipping,
            is_active: formData.is_active,
          }),
        })
        if (res.ok) { closeModal(); fetchProducts(search) }
        else { const d = await res.json(); alert(d.error || 'เกิดข้อผิดพลาด') }
      } else {
        // CREATE product
        const res = await fetch('/api/products', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: formData.name,
            description: formData.description || null,
            free_shipping: formData.free_shipping,
            is_active: formData.is_active,
          }),
        })
        if (!res.ok) { const d = await res.json(); alert(d.error || 'เกิดข้อผิดพลาด'); return }
        const product = await res.json()

        // CREATE keys
        let keys: PendingKey[] = []
        if (keyType === 'A') {
          keys = keysA.filter(k => k.key_code.trim()).map(k => ({ ...k, quantity: 1 }))
        } else {
          if (keyCodeB.trim()) keys = [{ key_code: keyCodeB, price: priceB, quantity: qtyB }]
        }
        if (keys.length > 0) {
          await fetch(`/api/products/${product.id}/keys`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ keys }),
          })
        }
        closeModal()
        fetchProducts(search)
      }
    } catch { alert('เกิดข้อผิดพลาด') } finally { setSaving(false) }
  }

  // ─── Computed summary for create modal ─────────────────────────────────────
  const summaryKeys = keyType === 'A' ? keysA.filter(k => k.key_code.trim()) : (keyCodeB.trim() ? [{ key_code: keyCodeB, price: priceB, quantity: qtyB }] : [])
  const totalItems   = keyType === 'A' ? summaryKeys.length : (summaryKeys[0]?.quantity || 0)
  const priceMin     = keyType === 'A' ? Math.min(...summaryKeys.map(k => k.price)) : priceB
  const priceMax     = keyType === 'A' ? Math.max(...summaryKeys.map(k => k.price)) : priceB
  const priceLabel   = summaryKeys.length === 0 ? '–'
    : keyType === 'A'
      ? priceMin === priceMax ? `฿${priceMin.toLocaleString()}` : `฿${priceMin.toLocaleString()} – ฿${priceMax.toLocaleString()}`
      : `฿${priceB.toLocaleString()}/ชิ้น`

  return (
    <>
      <div className="max-w-[1440px] mx-auto flex flex-col gap-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-800">คลังสินค้า</h1>
          <button onClick={openAddModal}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors shadow-sm active:scale-95">
            <Plus size={16} /> เพิ่มสินค้า
          </button>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {SUMMARY_CARDS.map(({ label, value, sub, icon: Icon, color, bg, subColor }) => (
            <div key={label} className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 flex items-center justify-between">
              <div>
                <p className="text-[11px] font-semibold uppercase text-gray-400 tracking-wider mb-1">{label}</p>
                <h3 className="text-3xl font-bold text-gray-800">{value}</h3>
                <p className={`text-xs mt-1 ${subColor ?? 'text-gray-400'}`}>{sub}</p>
              </div>
              <div className={`w-12 h-12 rounded-lg ${bg} flex items-center justify-center`}>
                <Icon size={22} className={color} />
              </div>
            </div>
          ))}
        </div>

        {/* Search */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex gap-3 items-center">
          <div className="relative flex-1 max-w-md">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="ค้นหาชื่อสินค้า..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
            />
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden relative">
          {loading && (
            <div className="absolute inset-0 bg-white/50 backdrop-blur-sm flex items-center justify-center z-10">
              <span className="w-8 h-8 rounded-full border-4 border-blue-200 border-t-blue-600 animate-spin" />
            </div>
          )}
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  {['ชื่อสินค้า', 'ประเภท', 'Keys พร้อมขาย', 'ค่าส่ง', 'วันที่สร้าง', 'สถานะ', ''].map((h, i) => (
                    <th key={h || i} className={`px-5 py-4 text-[11px] font-semibold uppercase text-gray-400 tracking-wider ${i === 6 ? 'text-right' : ''}`}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 text-sm text-gray-700">
                {products.length > 0 ? products.map(p => (
                  <tr key={p.id} className={`hover:bg-blue-50/30 transition-colors h-14 ${!p.is_active ? 'opacity-60' : ''}`}>
                    <td className="px-5 py-2 font-semibold">{p.name}</td>
                    <td className="px-5 py-2">
                      {/* Placeholder — product type not stored yet, show key icon */}
                      <span className="inline-flex items-center gap-1 text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full font-medium">
                        <Key size={10} /> Keys
                      </span>
                    </td>
                    <td className="px-5 py-2">
                      <span className={`font-semibold ${p.stock === 0 ? 'text-red-500' : 'text-gray-700'}`}>{p.stock}</span>
                    </td>
                    <td className="px-5 py-2">
                      {p.free_shipping ? (
                        <span className="inline-flex items-center gap-1 text-xs text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full font-semibold">
                          <Truck size={10} /> ฟรี
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400">ตามค่าส่งปกติ</span>
                      )}
                    </td>
                    <td className="px-5 py-2 text-xs text-gray-400">
                      {new Date(p.created_at).toLocaleDateString('th-TH')}
                    </td>
                    <td className="px-5 py-2">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold ${p.is_active ? 'bg-teal-100 text-teal-700' : 'bg-gray-200 text-gray-500'}`}>
                        {p.is_active ? 'เปิดขาย' : 'ปิดขาย'}
                      </span>
                    </td>
                    <td className="px-5 py-2 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => openEditModal(p)} className="text-gray-400 hover:text-blue-600 p-1 rounded hover:bg-blue-50 transition-colors" title="แก้ไข">
                          <Pencil size={15} />
                        </button>
                        <button onClick={() => handleDelete(p.id)} className="text-gray-400 hover:text-red-600 p-1 rounded hover:bg-red-50 transition-colors" title="ลบ">
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={7} className="px-6 py-10 text-center text-gray-400">
                      ยังไม่มีสินค้า {search && `ที่ตรงกับ "${search}"`}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ═══ MODAL ═══════════════════════════════════════════════════════════════ */}
      {showModal && (
        <div className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 w-full max-w-2xl max-h-[92vh] overflow-hidden flex flex-col">

            {/* Modal header */}
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50 rounded-t-2xl">
              <h2 className="text-lg font-semibold text-gray-800">
                {editingId ? 'แก้ไขสินค้า' : 'เพิ่มสินค้าใหม่'}
              </h2>
              <button type="button" onClick={closeModal}
                className="text-gray-400 hover:text-red-500 transition-colors p-1 rounded-full hover:bg-red-50">
                <X size={20} />
              </button>
            </div>

            {/* Edit: tab switcher */}
            {editingId && (
              <div className="flex border-b border-gray-100 px-6">
                {(['info', 'keys'] as const).map(tab => (
                  <button key={tab} onClick={() => setModalTab(tab)}
                    className={`py-3 px-4 text-sm font-medium border-b-2 transition-colors flex items-center gap-1.5 ${modalTab === tab ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
                    {tab === 'keys' && <Key size={13} />}
                    {tab === 'info' ? 'ข้อมูล' : 'จัดการ Keys'}
                  </button>
                ))}
              </div>
            )}

            {/* ── Info form ──────────────────────────────────────────────────── */}
            {(!editingId || modalTab === 'info') && (
              <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
                <div className="p-6 overflow-y-auto flex-1 flex flex-col gap-5">

                  {/* Product info */}
                  <div className="flex flex-col gap-4">
                    {!editingId && (
                      <p className="text-xs font-bold uppercase text-gray-400 tracking-wider border-b border-gray-100 pb-2">ข้อมูลสินค้า</p>
                    )}
                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-semibold uppercase text-gray-400 tracking-wider">ชื่อสินค้า <span className="text-red-500">*</span></label>
                      <input type="text" required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })}
                        placeholder="เช่น เสื้อยืดคอกลม" className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none" />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-semibold uppercase text-gray-400 tracking-wider">รายละเอียด</label>
                      <textarea rows={2} value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })}
                        placeholder="รายละเอียดสินค้า (ไม่บังคับ)"
                        className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:border-blue-500 outline-none resize-none" />
                    </div>
                    <ToggleSwitch
                      checked={formData.free_shipping}
                      onChange={v => setFormData({ ...formData, free_shipping: v })}
                      label="ฟรีค่าส่ง (โปรโมชั่น)"
                    />
                    <div className="flex items-center gap-2">
                      <input type="checkbox" id="isActive" checked={formData.is_active}
                        onChange={e => setFormData({ ...formData, is_active: e.target.checked })}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500" />
                      <label htmlFor="isActive" className="text-sm font-medium text-gray-700">เปิดขายสินค้า (Active)</label>
                    </div>
                  </div>

                  {/* Key builder — only for create */}
                  {!editingId && (
                    <>
                      <div className="border-t border-gray-100 pt-4">
                        <p className="text-xs font-bold uppercase text-gray-400 tracking-wider mb-4">เพิ่ม Product Keys</p>
                        <KeyBuilder
                          keyType={keyType} setKeyType={setKeyType}
                          keysA={keysA} setKeysA={setKeysA}
                          keyCodeB={keyCodeB} setKeyCodeB={setKeyCodeB}
                          priceB={priceB} setPriceB={setPriceB}
                          qtyB={qtyB} setQtyB={setQtyB}
                          prefix={prefix} setPrefix={setPrefix}
                          startNum={startNum} setStartNum={setStartNum}
                          keyCount={keyCount} setKeyCount={setKeyCount}
                        />
                      </div>

                      {/* Summary */}
                      {summaryKeys.length > 0 && (
                        <div className="bg-gray-50 rounded-xl px-4 py-3 text-xs text-gray-500 flex flex-wrap gap-x-4 gap-y-1 border border-gray-100">
                          <span>Keys: <strong>{summaryKeys.length}</strong></span>
                          <span>ชิ้นรวม: <strong>{totalItems}</strong></span>
                          <span>ช่วงราคา: <strong>{priceLabel}</strong></span>
                          <span>ค่าส่ง: <strong className={formData.free_shipping ? 'text-emerald-600' : ''}>{formData.free_shipping ? 'ฟรี' : 'ปกติ'}</strong></span>
                        </div>
                      )}
                    </>
                  )}
                </div>

                <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-3 rounded-b-2xl">
                  <button type="button" onClick={closeModal}
                    className="px-6 py-2 border border-blue-200 text-blue-600 text-sm font-medium rounded-lg hover:bg-blue-50 transition-colors">
                    ยกเลิก
                  </button>
                  <button type="submit" disabled={saving}
                    className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors shadow-sm">
                    {saving && <RefreshCw size={14} className="animate-spin" />}
                    {editingId ? 'บันทึก' : 'บันทึกสินค้า'}
                  </button>
                </div>
              </form>
            )}

            {/* ── Edit: Keys tab ─────────────────────────────────────────────── */}
            {editingId && modalTab === 'keys' && (
              <div className="flex-1 overflow-y-auto p-6">
                <Suspense fallback={
                  <div className="flex items-center justify-center py-10">
                    <span className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
                  </div>
                }>
                  <ProductKeysManager productId={editingId} productName={formData.name} />
                </Suspense>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}
