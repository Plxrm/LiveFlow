import { useState, useEffect, useRef, useCallback } from 'react'
import {
  Plus, ChevronDown, ChevronRight, Pencil, Trash2,
  ToggleLeft, ToggleRight, X, Image as ImageIcon,
  MessageSquare, GripVertical, Eye, Upload, Loader2
} from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────

interface MessageTemplate {
  id: string
  step: string
  sort_order: number
  msg_type: 'text' | 'image' | 'flex'
  content: string | null
  image_url: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

// ─── Sections config ──────────────────────────────────────────────────────────

const SECTIONS = [
  { step: 'welcome',           label: '👋 ข้อความต้อนรับ',          desc: 'เมื่อลูกค้าเพิ่ม LINE เป็นเพื่อน' },
  { step: 'cf_success',        label: '✅ CF สำเร็จ',               desc: 'เมื่อลูกค้าพิมพ์ CF แล้วสั่งซื้อสำเร็จ' },
  { step: 'cf_not_found',      label: '❌ ไม่พบรหัส CF',            desc: 'เมื่อรหัสสินค้าไม่ถูกต้อง' },
  { step: 'cf_no_live',        label: '⏸️ ไม่มีไลฟ์',               desc: 'เมื่อยังไม่มีไลฟ์เปิดขาย' },
  { step: 'cf_out_of_stock',   label: '😢 สินค้าหมด',               desc: 'เมื่อสินค้าหมดสต็อก' },
  { step: 'slip_received',     label: '📸 รับสลิปแล้ว',             desc: 'เมื่อลูกค้าส่งสลิปมา' },
  { step: 'slip_no_order',     label: '❓ ส่งสลิปแต่ไม่มีออเดอร์',  desc: 'เมื่อส่งสลิปแต่ไม่พบออเดอร์' },
  { step: 'payment_confirmed', label: '💳 ยืนยันชำระเงิน',          desc: 'เมื่อแอดมินยืนยันสลิปแล้ว' },
  { step: 'payment_rejected',  label: '🚫 ปฏิเสธสลิป',              desc: 'เมื่อแอดมินปฏิเสธสลิป' },
  { step: 'shipped',           label: '📦 จัดส่งแล้ว',              desc: 'เมื่อสร้างพัสดุและจัดส่ง' },
  { step: 'delivered',         label: '🎉 ส่งถึงแล้ว',              desc: 'เมื่อพัสดุถึงมือลูกค้า' },
  { step: 'order_cancelled',   label: '🚫 ยกเลิกออเดอร์',           desc: 'เมื่อออเดอร์ถูกยกเลิก' },
]

const VARIABLES = [
  'product_name', 'quantity', 'price', 'total', 'order_number',
  'tracking_number', 'amount', 'cf_code', 'shipping_text', 'customer_name',
]

// ─── LINE Preview ─────────────────────────────────────────────────────────────

function LinePreview({ content, imageUrl, msgType }: {
  content: string | null
  imageUrl: string | null
  msgType: 'text' | 'image' | 'flex'
}) {
  return (
    <div className="bg-[#87CEEB] rounded-xl p-4 min-h-[120px] flex flex-col gap-3">
      <div className="text-xs font-semibold text-gray-600 text-center mb-1">ตัวอย่าง LINE</div>
      <div className="flex gap-2 items-end">
        <div className="w-8 h-8 rounded-full bg-[#00B900] flex items-center justify-center text-white text-xs font-bold flex-shrink-0">OA</div>
        <div className="max-w-[80%]">
          {msgType === 'image' && imageUrl ? (
            <img
              src={imageUrl}
              alt="preview"
              className="rounded-lg max-w-full max-h-40 object-cover shadow"
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
            />
          ) : msgType === 'image' ? (
            <div className="bg-gray-200 rounded-lg w-32 h-24 flex items-center justify-center text-gray-400">
              <ImageIcon size={24} />
            </div>
          ) : (
            <div className="bg-white rounded-2xl rounded-bl-none px-3 py-2 text-sm text-gray-800 shadow-sm whitespace-pre-wrap break-words">
              {content || <span className="text-gray-400 italic">ยังไม่มีเนื้อหา</span>}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Modal ────────────────────────────────────────────────────────────────────

interface ModalProps {
  mode: 'create' | 'edit'
  step: string
  template?: MessageTemplate
  onClose: () => void
  onSave: (data: Partial<MessageTemplate>) => Promise<void>
}

function TemplateModal({ mode, step, template, onClose, onSave }: ModalProps) {
  const [msgType, setMsgType] = useState<'text' | 'image'>(
    template?.msg_type === 'image' ? 'image' : 'text'
  )
  const [content, setContent] = useState(template?.content || '')
  const [imageUrl, setImageUrl] = useState(template?.image_url || '')
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const insertVariable = (variable: string) => {
    const ta = textareaRef.current
    if (!ta) return
    const start = ta.selectionStart
    const end = ta.selectionEnd
    const newContent = content.slice(0, start) + `{{${variable}}}` + content.slice(end)
    setContent(newContent)
    setTimeout(() => {
      ta.focus()
      ta.setSelectionRange(start + variable.length + 4, start + variable.length + 4)
    }, 0)
  }

  const handleFileUpload = async (file: File) => {
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await fetch('/api/messages/upload', { method: 'POST', body: formData })
      const json = await res.json()
      if (json.url) setImageUrl(json.url)
      else alert('อัปโหลดไม่สำเร็จ: ' + (json.error || 'unknown error'))
    } catch {
      alert('อัปโหลดล้มเหลว')
    } finally {
      setUploading(false)
    }
  }

  const handleSubmit = async () => {
    if (msgType === 'text' && !content.trim()) { alert('กรุณากรอกเนื้อหาข้อความ'); return }
    if (msgType === 'image' && !imageUrl.trim()) { alert('กรุณาใส่ URL รูปหรืออัปโหลดรูป'); return }
    setSaving(true)
    try {
      await onSave({
        msg_type: msgType,
        content: msgType === 'text' ? content : null,
        image_url: msgType === 'image' ? imageUrl : null,
      })
      onClose()
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="font-bold text-gray-800">
            {mode === 'create' ? 'เพิ่มข้อความใหม่' : 'แก้ไขข้อความ'}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Left panel */}
          <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-4">
            {/* Type selector */}
            <div>
              <label className="text-sm font-semibold text-gray-700 block mb-2">ประเภทข้อความ</label>
              <div className="flex gap-2">
                <button
                  onClick={() => setMsgType('text')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border-2 transition-all ${
                    msgType === 'text'
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 text-gray-500 hover:border-gray-300'
                  }`}
                >
                  <MessageSquare size={16} /> ข้อความ
                </button>
                <button
                  onClick={() => setMsgType('image')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border-2 transition-all ${
                    msgType === 'image'
                      ? 'border-green-500 bg-green-50 text-green-700'
                      : 'border-gray-200 text-gray-500 hover:border-gray-300'
                  }`}
                >
                  <ImageIcon size={16} /> รูปภาพ
                </button>
              </div>
            </div>

            {/* Content */}
            {msgType === 'text' ? (
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-gray-700">เนื้อหาข้อความ</label>
                <textarea
                  ref={textareaRef}
                  rows={6}
                  value={content}
                  onChange={e => setContent(e.target.value)}
                  placeholder="พิมพ์ข้อความที่ต้องการส่งให้ลูกค้า..."
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:bg-white focus:border-blue-400 outline-none transition-colors resize-none"
                />

                {/* Variables */}
                <div>
                  <p className="text-xs text-gray-500 mb-2 font-medium">ตัวแปรที่ใช้ได้ (คลิกเพื่อแทรก):</p>
                  <div className="flex flex-wrap gap-1.5">
                    {VARIABLES.map(v => (
                      <button
                        key={v}
                        onClick={() => insertVariable(v)}
                        className="px-2 py-1 bg-amber-50 border border-amber-200 text-amber-700 rounded-md text-xs font-mono hover:bg-amber-100 transition-colors"
                      >
                        {`{{${v}}}`}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {/* Upload */}
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center cursor-pointer hover:border-blue-300 hover:bg-blue-50/50 transition-all group"
                >
                  {uploading ? (
                    <div className="flex flex-col items-center gap-2 text-gray-400">
                      <Loader2 size={24} className="animate-spin text-blue-500" />
                      <span className="text-sm">กำลังอัปโหลด...</span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2 text-gray-400 group-hover:text-blue-500 transition-colors">
                      <Upload size={24} />
                      <span className="text-sm font-medium">คลิกเพื่ออัปโหลดรูป</span>
                      <span className="text-xs">JPEG, PNG, GIF, WebP (สูงสุด 5MB)</span>
                    </div>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={e => {
                      const file = e.target.files?.[0]
                      if (file) handleFileUpload(file)
                    }}
                  />
                </div>

                {/* Or URL */}
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-semibold text-gray-700">หรือใส่ URL รูปภาพ</label>
                  <input
                    type="url"
                    value={imageUrl}
                    onChange={e => setImageUrl(e.target.value)}
                    placeholder="https://example.com/image.jpg"
                    className="w-full px-4 py-2 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:bg-white focus:border-blue-400 outline-none transition-colors"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Right: Preview */}
          <div className="w-64 border-l border-gray-100 p-4 flex flex-col gap-3 bg-gray-50">
            <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
              <Eye size={16} /> Preview
            </div>
            <LinePreview
              content={content}
              imageUrl={imageUrl}
              msgType={msgType}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
          >
            ยกเลิก
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-70"
          >
            {saving && <Loader2 size={14} className="animate-spin" />}
            {mode === 'create' ? 'เพิ่มข้อความ' : 'บันทึก'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Template Card ────────────────────────────────────────────────────────────

interface TemplateCardProps {
  template: MessageTemplate
  index: number
  onEdit: () => void
  onDelete: () => void
  onToggle: () => void
  onDragStart: (index: number) => void
  onDragOver: (index: number) => void
  onDrop: () => void
}

function TemplateCard({ template, index, onEdit, onDelete, onToggle, onDragStart, onDragOver, onDrop }: TemplateCardProps) {
  const [dragOver, setDragOver] = useState(false)

  return (
    <div
      draggable
      onDragStart={() => onDragStart(index)}
      onDragOver={(e) => { e.preventDefault(); setDragOver(true); onDragOver(index) }}
      onDragLeave={() => setDragOver(false)}
      onDrop={() => { setDragOver(false); onDrop() }}
      className={`p-3 rounded-xl border-2 transition-all cursor-default ${
        dragOver
          ? 'border-blue-400 bg-blue-50'
          : 'border-gray-100 bg-white hover:border-gray-200 hover:shadow-sm'
      } ${!template.is_active ? 'opacity-50' : ''}`}
    >
      {/* แถวบน: drag handle + badge + ปุ่ม */}
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-2 min-w-0">
          {/* Drag handle */}
          <div
            className="text-gray-300 hover:text-gray-500 cursor-grab active:cursor-grabbing transition-colors flex-shrink-0"
            title="ลากเพื่อจัดลำดับ"
          >
            <GripVertical size={18} />
          </div>
          {/* Type badge */}
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ${
            template.msg_type === 'text'
              ? 'bg-blue-100 text-blue-700'
              : template.msg_type === 'image'
              ? 'bg-green-100 text-green-700'
              : 'bg-purple-100 text-purple-700'
          }`}>
            {template.msg_type === 'text' ? 'ข้อความ' : template.msg_type === 'image' ? 'รูปภาพ' : 'Flex'}
          </span>
        </div>

        {/* ปุ่ม — always visible (not opacity-0) */}
        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            onClick={onToggle}
            className={`p-1.5 rounded-lg transition-colors ${
              template.is_active
                ? 'text-emerald-500 hover:bg-emerald-50'
                : 'text-gray-400 hover:bg-gray-100'
            }`}
            title={template.is_active ? 'ปิดใช้งาน' : 'เปิดใช้งาน'}
          >
            {template.is_active ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
          </button>
          <button
            onClick={onEdit}
            className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            title="แก้ไข"
          >
            <Pencil size={14} />
          </button>
          <button
            onClick={onDelete}
            className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
            title="ลบ"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {/* แถวล่าง: เนื้อหา ตัดไม่เกิน 3 บรรทัด */}
      {template.msg_type === 'image' && template.image_url ? (
        <div className="flex items-center gap-2">
          <img
            src={template.image_url}
            alt="thumbnail"
            className="w-10 h-10 rounded-lg object-cover border border-gray-100 flex-shrink-0"
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
          />
          <span className="text-xs text-gray-400 line-clamp-2 break-all">{template.image_url}</span>
        </div>
      ) : (
        <p className="text-sm text-gray-600 line-clamp-3 break-all leading-snug">
          {template.content || <span className="text-gray-400 italic">ไม่มีเนื้อหา</span>}
        </p>
      )}
    </div>
  )
}

// ─── Section ──────────────────────────────────────────────────────────────────

interface SectionProps {
  step: string
  label: string
  desc: string
  templates: MessageTemplate[]
  onRefresh: () => void
}

function Section({ step, label, desc, templates, onRefresh }: SectionProps) {
  const [open, setOpen] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [editTemplate, setEditTemplate] = useState<MessageTemplate | undefined>()
  const [localTemplates, setLocalTemplates] = useState(templates)
  const dragIndex = useRef<number>(-1)
  const overIndex = useRef<number>(-1)

  useEffect(() => { setLocalTemplates(templates) }, [templates])

  const handleCreate = async (data: Partial<MessageTemplate>) => {
    const res = await fetch('/api/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        step,
        sort_order: localTemplates.length,
        ...data,
      }),
    })
    if (res.ok) {
      onRefresh()
    } else {
      const err = await res.json()
      alert('เกิดข้อผิดพลาด: ' + err.error)
    }
  }

  const handleUpdate = async (id: string, data: Partial<MessageTemplate>) => {
    const res = await fetch(`/api/messages/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (res.ok) {
      onRefresh()
    } else {
      const err = await res.json()
      alert('เกิดข้อผิดพลาด: ' + err.error)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('ลบข้อความนี้?')) return
    const res = await fetch(`/api/messages/${id}`, { method: 'DELETE' })
    if (res.ok) {
      onRefresh()
    } else {
      alert('ลบไม่สำเร็จ')
    }
  }

  const handleToggle = async (t: MessageTemplate) => {
    await handleUpdate(t.id, { is_active: !t.is_active })
  }

  const handleDrop = async () => {
    const from = dragIndex.current
    const to = overIndex.current
    if (from === -1 || to === -1 || from === to) return

    const reordered = [...localTemplates]
    const [moved] = reordered.splice(from, 1)
    reordered.splice(to, 0, moved)
    setLocalTemplates(reordered)

    const updates = reordered.map((t, i) => ({ id: t.id, sort_order: i }))
    await fetch('/api/messages/reorder', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ updates }),
    })
    onRefresh()
  }

  return (
    <div className="border border-gray-100 rounded-xl overflow-hidden shadow-sm">
      {/* Header */}
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-3 px-5 py-4 bg-white hover:bg-gray-50 transition-colors text-left"
      >
        <span className="flex-1">
          <span className="font-semibold text-gray-800 text-sm">{label}</span>
          <span className="ml-3 text-xs text-gray-400">{desc}</span>
        </span>
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
          localTemplates.length > 0 ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-400'
        }`}>
          {localTemplates.length} ข้อความ
        </span>
        <span className="text-gray-400 ml-1">
          {open ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        </span>
      </button>

      {/* Content */}
      {open && (
        <div className="border-t border-gray-100 bg-gray-50/50 p-4 flex flex-col gap-2">
          {localTemplates.length === 0 && (
            <p className="text-sm text-gray-400 text-center py-3 italic">ยังไม่มีข้อความ</p>
          )}

          {localTemplates.map((t, i) => (
            <TemplateCard
              key={t.id}
              template={t}
              index={i}
              onEdit={() => { setEditTemplate(t); setShowModal(true) }}
              onDelete={() => handleDelete(t.id)}
              onToggle={() => handleToggle(t)}
              onDragStart={(idx) => { dragIndex.current = idx }}
              onDragOver={(idx) => { overIndex.current = idx }}
              onDrop={handleDrop}
            />
          ))}

          <button
            onClick={() => { setEditTemplate(undefined); setShowModal(true) }}
            className="flex items-center justify-center gap-2 w-full py-2.5 mt-1 border-2 border-dashed border-blue-200 text-blue-500 text-sm font-medium rounded-xl hover:border-blue-400 hover:bg-blue-50 transition-all"
          >
            <Plus size={16} /> เพิ่มข้อความ
          </button>
        </div>
      )}

      {/* Modals */}
      {showModal && !editTemplate && (
        <TemplateModal
          mode="create"
          step={step}
          onClose={() => setShowModal(false)}
          onSave={handleCreate}
        />
      )}
      {showModal && editTemplate && (
        <TemplateModal
          mode="edit"
          step={step}
          template={editTemplate}
          onClose={() => { setShowModal(false); setEditTemplate(undefined) }}
          onSave={(data) => handleUpdate(editTemplate.id, data)}
        />
      )}
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function MessageTemplatesManager() {
  const [grouped, setGrouped] = useState<Record<string, MessageTemplate[]>>({})
  const [loading, setLoading] = useState(true)

  const fetchTemplates = useCallback(async () => {
    try {
      const res = await fetch('/api/messages')
      if (res.ok) {
        const data = await res.json()
        setGrouped(data)
      }
    } catch (err) {
      console.error('Failed to load templates', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchTemplates() }, [fetchTemplates])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 text-gray-400">
        <Loader2 size={24} className="animate-spin mr-3" />
        <span>กำลังโหลด...</span>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="text-lg font-bold text-gray-800 border-b border-gray-100 pb-2">
          ข้อความอัตโนมัติ
        </h2>
        <p className="text-xs text-gray-400 mt-2">
          จัดการข้อความที่ระบบจะส่งให้ลูกค้าโดยอัตโนมัติในแต่ละสถานการณ์ 
          ลากด้วย <strong>⠿</strong> เพื่อจัดลำดับ
        </p>
      </div>

      <div className="flex flex-col gap-3">
        {SECTIONS.map(s => (
          <Section
            key={s.step}
            step={s.step}
            label={s.label}
            desc={s.desc}
            templates={grouped[s.step] || []}
            onRefresh={fetchTemplates}
          />
        ))}
      </div>
    </div>
  )
}
