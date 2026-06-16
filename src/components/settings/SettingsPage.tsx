import { useState } from 'react'
import { Store, CreditCard, MessageCircle, Save, CheckCircle, Truck, Bot, Loader2, CheckCircle2, XCircle } from 'lucide-react'
import type { AppSettings } from '../../lib/api/settings'
import MessageTemplatesManager from './MessageTemplatesManager'

interface SettingsPageProps {
  initialSettingsData: string
}

type TabKey = 'shop' | 'shipping' | 'payment' | 'line' | 'messages'

interface LineBotInfo {
  displayName: string
  pictureUrl: string
  basicId: string
}

// ─── Payment Tab Component ────────────────────────────────────────────────────

const BANKS = [
  'ธนาคารกสิกรไทย',
  'ธนาคารกรุงเทพ',
  'ธนาคารไทยพาณิชย์',
  'ธนาคารกรุงไทย',
  'ธนาคารออมสิน',
  'ธนาคารทหารไทยธนชาต',
  'อื่นๆ',
]

interface PaymentTabProps {
  settings: AppSettings
  handleChange: (field: keyof AppSettings, value: any) => void
}

function PaymentTab({ settings, handleChange }: PaymentTabProps) {
  const [uploading, setUploading] = useState(false)
  const method = settings.payment_method || 'text'

  const handleQRUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await fetch('/api/settings/upload-qr', {
        method: 'POST',
        body: formData,
      })
      const data = await res.json()
      if (res.ok && data.url) {
        handleChange('payment_qr_image', data.url)
      } else {
        alert('อัปโหลดล้มเหลว: ' + (data.error || 'Unknown error'))
      }
    } catch (err: any) {
      alert('เกิดข้อผิดพลาด: ' + err.message)
    } finally {
      setUploading(false)
    }
  }

  const methodOptions: { value: AppSettings['payment_method']; label: string; sub: string }[] = [
    { value: 'text',          label: 'ข้อความบัญชีธนาคาร',       sub: 'ส่งข้อความเลขบัญชี ชื่อ ธนาคาร' },
    { value: 'image',         label: 'รูป QR Code ของร้าน',       sub: 'อัปโหลด QR ร้านคุณเอง' },
    { value: 'promptpay',     label: 'PromptPay อัตโนมัติ',       sub: 'QR มียอดเงินฝังอัตโนมัติ (แนะนำ)' },
    { value: 'promptpay_text', label: 'PromptPay + ข้อความสำรอง', sub: 'QR อัตโนมัติ + ข้อความบัญชีสำรอง' },
  ]

  return (
    <div className="flex flex-col gap-6 max-w-xl animate-in fade-in slide-in-from-bottom-2 duration-300">
      <h2 className="text-lg font-bold text-gray-800 border-b border-gray-100 pb-2">การชำระเงิน</h2>

      <div className="bg-amber-50 border border-amber-100 rounded-lg px-4 py-3 text-xs text-amber-700 flex items-center gap-2">
        <span>📦</span>
        <span>ค่าส่งตั้งค่าแยกตามสินค้าแต่ละชิ้นในหน้าคลังสินค้า</span>
      </div>

      {/* ── เลือกวิธีชำระเงิน ─────────────────────── */}
      <div className="flex flex-col gap-3">
        <label className="text-sm font-semibold text-gray-700">เลือกวิธีส่งช่องทางชำระเงินให้ลูกค้า:</label>
        <div className="flex flex-col gap-2">
          {methodOptions.map(opt => (
            <label
              key={opt.value}
              className={`flex items-start gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${
                method === opt.value
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300 bg-white'
              }`}
            >
              <input
                type="radio"
                name="payment_method"
                value={opt.value}
                checked={method === opt.value}
                onChange={() => handleChange('payment_method', opt.value)}
                className="mt-0.5 accent-blue-600"
              />
              <div className="flex flex-col gap-0.5">
                <span className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                  {opt.label}
                  {opt.value === 'promptpay' && (
                    <span className="text-xs font-bold px-2 py-0.5 bg-green-100 text-green-700 rounded-full">แนะนำ</span>
                  )}
                </span>
                <span className="text-xs text-gray-500">{opt.sub}</span>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* ── แบบ 1: ข้อความบัญชีธนาคาร ─────────────── */}
      {(method === 'text' || method === 'promptpay_text') && (
        <div className="flex flex-col gap-4 p-4 bg-gray-50 rounded-xl border border-gray-200">
          <p className="text-xs font-bold text-gray-600 uppercase tracking-wide">
            {method === 'promptpay_text' ? '🏦 ข้อมูลบัญชีสำรอง' : '🏦 ข้อมูลบัญชีธนาคาร'}
          </p>
          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-gray-700">ธนาคาร</label>
            <select
              value={settings.bank_name}
              onChange={e => handleChange('bank_name', e.target.value)}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none focus:border-blue-500 text-sm bg-white transition-colors"
            >
              <option value="">-- เลือกธนาคาร --</option>
              {BANKS.map(b => <option key={b} value={b}>{b}</option>)}
            </select>
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-gray-700">เลขบัญชี</label>
            <input
              type="text"
              value={settings.bank_account_number}
              onChange={e => handleChange('bank_account_number', e.target.value)}
              placeholder="เช่น 123-4-56789-0"
              className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none focus:border-blue-500 text-sm bg-white transition-colors"
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-gray-700">ชื่อบัญชี</label>
            <input
              type="text"
              value={settings.bank_account_name}
              onChange={e => handleChange('bank_account_name', e.target.value)}
              placeholder="ชื่อ-นามสกุล"
              className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none focus:border-blue-500 text-sm bg-white transition-colors"
            />
          </div>
          {method === 'text' && (
            <div className="bg-white border border-dashed border-gray-300 rounded-xl p-4 text-sm text-gray-700 leading-relaxed">
              <p className="text-xs font-bold text-gray-400 mb-2">👁 Preview ข้อความที่จะส่ง:</p>
              <pre className="whitespace-pre-wrap font-sans text-sm text-gray-700">
{`💳 ช่องทางชำระเงิน
🏦 ${settings.bank_name || 'ธนาคาร...'}
📋 เลขบัญชี: ${settings.bank_account_number || 'xxx-x-xxxxx-x'}
👤 ชื่อ: ${settings.bank_account_name || 'ชื่อบัญชี...'}
💰 ยอดชำระ: ฿XXX
📄 ออเดอร์: LFXXXXXXXX

โอนแล้วส่งสลิปมาได้เลยค่ะ`}
              </pre>
            </div>
          )}
        </div>
      )}

      {/* ── แบบ 2: รูป QR Code ─────────────────────── */}
      {method === 'image' && (
        <div className="flex flex-col gap-4 p-4 bg-gray-50 rounded-xl border border-gray-200">
          <p className="text-xs font-bold text-gray-600 uppercase tracking-wide">📷 QR Code ของร้าน</p>
          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-gray-700">อัปโหลดรูป QR Code</label>
            <label className={`flex items-center justify-center gap-2 border-2 border-dashed rounded-xl p-6 cursor-pointer transition-all ${
              uploading ? 'border-blue-300 bg-blue-50' : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50'
            }`}>
              <input type="file" accept="image/*" className="hidden" onChange={handleQRUpload} disabled={uploading} />
              {uploading ? (
                <span className="text-sm text-blue-600">⏳ กำลังอัปโหลด...</span>
              ) : (
                <span className="text-sm text-gray-500">📁 คลิกเพื่อเลือกรูป QR (PNG, JPG)</span>
              )}
            </label>
            {settings.payment_qr_image && (
              <div className="flex flex-col items-center gap-2 p-3 bg-white rounded-xl border border-gray-200">
                <img
                  src={settings.payment_qr_image}
                  alt="QR Code Preview"
                  className="w-40 h-40 object-contain rounded-lg border border-gray-100"
                />
                <p className="text-xs text-gray-400">QR ที่จะส่งให้ลูกค้า</p>
              </div>
            )}
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-gray-700">ข้อความเพิ่มเติม (optional)</label>
            <textarea
              value={settings.payment_qr_text}
              onChange={e => handleChange('payment_qr_text', e.target.value)}
              placeholder="เช่น สแกนจ่ายตามยอด แจ้งสลิปหลังโอน"
              rows={2}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none focus:border-blue-500 text-sm bg-white transition-colors resize-none"
            />
          </div>
        </div>
      )}

      {/* ── แบบ 3+4: PromptPay ─────────────────────── */}
      {(method === 'promptpay' || method === 'promptpay_text') && (
        <div className="flex flex-col gap-4 p-4 bg-gray-50 rounded-xl border border-gray-200">
          <p className="text-xs font-bold text-gray-600 uppercase tracking-wide">⚡ PromptPay</p>
          {method === 'promptpay' && (
            <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-3 text-xs text-green-700">
              ✅ <strong>ข้อดี:</strong> QR จะมียอดเงินฝังอัตโนมัติ ลูกค้าสแกนจ่ายได้เลยไม่ต้องกรอกยอด
            </div>
          )}
          {method === 'promptpay_text' && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 text-xs text-blue-700">
              ✅ <strong>ข้อดี:</strong> ส่ง QR อัตโนมัติ + ข้อความบัญชีสำรอง กรณีลูกค้าสแกนไม่ได้
            </div>
          )}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-gray-700">เบอร์ PromptPay</label>
            <input
              type="text"
              value={settings.promptpay_number}
              onChange={e => handleChange('promptpay_number', e.target.value)}
              placeholder="เบอร์โทร 10 หลัก หรือ เลขบัตร 13 หลัก"
              className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none focus:border-blue-500 text-sm bg-white transition-colors"
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-gray-700">ชื่อบัญชี PromptPay</label>
            <input
              type="text"
              value={settings.promptpay_name}
              onChange={e => handleChange('promptpay_name', e.target.value)}
              placeholder="ชื่อ-นามสกุล"
              className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none focus:border-blue-500 text-sm bg-white transition-colors"
            />
          </div>
          {settings.promptpay_number && (
            <div className="flex flex-col items-center gap-2 p-4 bg-white rounded-xl border border-gray-200">
              <p className="text-xs font-bold text-gray-400 mb-1">👁 Preview QR (ตัวอย่างยอด ฿100)</p>
              <img
                src={`https://promptpay.io/${settings.promptpay_number}/100.png`}
                alt="PromptPay QR Preview"
                className="w-36 h-36 object-contain"
              />
              {settings.promptpay_name && (
                <p className="text-xs text-gray-500">{settings.promptpay_name}</p>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── Auto-confirm / Auto-ship ─────────────────── */}
      <div className="flex flex-col gap-4 pt-2 border-t border-gray-100">
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={settings.auto_confirm_payment}
            onChange={e => handleChange('auto_confirm_payment', e.target.checked)}
            className="w-5 h-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
          />
          <div>
            <p className="text-sm font-semibold text-gray-800">ยืนยันยอดชำระเงินอัตโนมัติ</p>
            <p className="text-xs text-gray-500 mt-0.5">ระบบจะพยายามตรวจสอบสลิปโอนเงินโดยอัตโนมัติเมื่อลูกค้าอัปโหลด</p>
          </div>
        </label>

        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={settings.auto_ship_on_payment}
            onChange={e => handleChange('auto_ship_on_payment', e.target.checked)}
            className="w-5 h-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
          />
          <div>
            <p className="text-sm font-semibold text-gray-800">สร้างพัสดุ KEX อัตโนมัติหลังยืนยันชำระ</p>
            <p className="text-xs text-gray-500 mt-0.5">หากลูกค้ากรอกที่อยู่ครบ ระบบจะสร้างพัสดุ KEX Express และส่ง tracking ทาง LINE ทันที</p>
          </div>
        </label>
      </div>
    </div>
  )
}

// ─── Main SettingsPage ────────────────────────────────────────────────────────

export default function SettingsPage({ initialSettingsData }: SettingsPageProps) {
  const [settings, setSettings] = useState<AppSettings>(() => JSON.parse(initialSettingsData))
  const [activeTab, setActiveTab] = useState<TabKey>('shop')
  const [saving, setSaving] = useState(false)
  const [showToast, setShowToast] = useState(false)

  // LINE OA connection test
  const [testingLine, setTestingLine] = useState(false)
  const [lineBotInfo, setLineBotInfo] = useState<LineBotInfo | null>(null)
  const [lineTestError, setLineTestError] = useState<string | null>(null)

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      })
      if (res.ok) {
        setShowToast(true)
        setTimeout(() => setShowToast(false), 3000)
      } else {
        alert('เกิดข้อผิดพลาดในการบันทึก')
      }
    } catch (error) {
      alert('การเชื่อมต่อมีปัญหา')
    } finally {
      setSaving(false)
    }
  }

  const handleChange = (field: keyof AppSettings, value: any) => {
    setSettings(prev => ({ ...prev, [field]: value }))
  }

  const handleTestLineConnection = async () => {
    if (!settings.line_channel_access_token) {
      setLineTestError('กรุณากรอก LINE Channel Access Token ก่อน')
      setLineBotInfo(null)
      return
    }
    setTestingLine(true)
    setLineBotInfo(null)
    setLineTestError(null)
    try {
      const res = await fetch('/api/line/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: settings.line_channel_access_token }),
      })
      const data = await res.json()
      if (res.ok) {
        setLineBotInfo({
          displayName: data.displayName,
          pictureUrl: data.pictureUrl,
          basicId: data.basicId,
        })
      } else {
        setLineTestError(data.error || `ผิดพลาด (HTTP ${res.status})`)
      }
    } catch (e: any) {
      setLineTestError('ไม่สามารถเชื่อมต่อได้: ' + (e?.message || 'Unknown error'))
    } finally {
      setTestingLine(false)
    }
  }

  const tabs: { key: TabKey; label: string; icon: React.ReactNode }[] = [
    { key: 'shop',     label: 'ข้อมูลร้านค้า',      icon: <Store size={18} /> },
    { key: 'shipping', label: 'ข้อมูลผู้ส่ง (KEX)', icon: <Truck size={18} /> },
    { key: 'payment',  label: 'การชำระเงิน',         icon: <CreditCard size={18} /> },
    { key: 'line',     label: 'LINE OA',             icon: <MessageCircle size={18} /> },
    { key: 'messages', label: 'ข้อความอัตโนมัติ',  icon: <Bot size={18} /> },
  ]

  return (
    <div className="max-w-4xl mx-auto flex flex-col gap-6 relative">
      {/* Toast Notification */}
      <div className={`fixed bottom-6 right-6 bg-gray-900 text-white px-5 py-3 rounded-xl shadow-2xl flex items-center gap-3 transition-all duration-300 z-50 ${showToast ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0 pointer-events-none'}`}>
        <CheckCircle size={20} className="text-emerald-400" />
        <span className="font-medium text-sm">บันทึกสำเร็จ</span>
      </div>

      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">ตั้งค่าระบบ</h1>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-70"
        >
          {saving ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"/> : <Save size={18} />}
          บันทึกการตั้งค่า
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col md:flex-row min-h-[600px]">
        {/* Sidebar Tabs */}
        <div className="w-full md:w-64 bg-gray-50 border-r border-gray-100 flex flex-col">
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-3 px-5 py-4 text-sm font-medium border-l-4 transition-colors ${
                activeTab === tab.key
                  ? 'border-blue-600 bg-white text-blue-600'
                  : 'border-transparent text-gray-600 hover:bg-gray-100'
              }`}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="flex-1 p-6 md:p-8">

          {/* ─── Tab: ข้อมูลร้านค้า ─────────────────────────────────────── */}
          {activeTab === 'shop' && (
            <div className="flex flex-col gap-6 max-w-xl animate-in fade-in slide-in-from-bottom-2 duration-300">
              <h2 className="text-lg font-bold text-gray-800 border-b border-gray-100 pb-2">ข้อมูลร้านค้า</h2>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-gray-700">ชื่อร้าน</label>
                <input
                  type="text"
                  value={settings.shop_name}
                  onChange={e => handleChange('shop_name', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none focus:border-blue-500 text-sm bg-gray-50 focus:bg-white transition-colors"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-gray-700">URL โลโก้ร้าน</label>
                <input
                  type="url"
                  value={settings.shop_logo_url}
                  onChange={e => handleChange('shop_logo_url', e.target.value)}
                  placeholder="https://example.com/logo.png"
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none focus:border-blue-500 text-sm bg-gray-50 focus:bg-white transition-colors"
                />
              </div>
            </div>
          )}

          {/* ─── Tab: ข้อมูลผู้ส่ง (KEX) ───────────────────────────────── */}
          {activeTab === 'shipping' && (
            <div className="flex flex-col gap-6 max-w-xl animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div>
                <h2 className="text-lg font-bold text-gray-800 border-b border-gray-100 pb-2">ข้อมูลผู้ส่ง (KEX Express)</h2>
                <p className="text-xs text-gray-400 mt-2">ข้อมูลนี้จะถูกใช้เป็นผู้ส่งเมื่อสร้างพัสดุผ่าน KEX Express API</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-semibold text-gray-700">ชื่อผู้ส่ง (ชื่อร้าน)</label>
                  <input
                    type="text"
                    value={settings.shop_sender_name}
                    onChange={e => handleChange('shop_sender_name', e.target.value)}
                    placeholder="ร้าน LiveFlow"
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none focus:border-blue-500 text-sm bg-gray-50 focus:bg-white transition-colors"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-semibold text-gray-700">เบอร์โทรร้าน</label>
                  <input
                    type="tel"
                    value={settings.shop_phone}
                    onChange={e => handleChange('shop_phone', e.target.value)}
                    placeholder="0812345678"
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none focus:border-blue-500 text-sm bg-gray-50 focus:bg-white transition-colors"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-gray-700">ที่อยู่ร้าน (บ้านเลขที่ ถนน)</label>
                <input
                  type="text"
                  value={settings.shop_address}
                  onChange={e => handleChange('shop_address', e.target.value)}
                  placeholder="123/4 ถ.สุขุมวิท"
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none focus:border-blue-500 text-sm bg-gray-50 focus:bg-white transition-colors"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-semibold text-gray-700">แขวง / ตำบล</label>
                  <input
                    type="text"
                    value={settings.shop_subdistrict}
                    onChange={e => handleChange('shop_subdistrict', e.target.value)}
                    placeholder="คลองตัน"
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none focus:border-blue-500 text-sm bg-gray-50 focus:bg-white transition-colors"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-semibold text-gray-700">เขต / อำเภอ</label>
                  <input
                    type="text"
                    value={settings.shop_district}
                    onChange={e => handleChange('shop_district', e.target.value)}
                    placeholder="คลองเตย"
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none focus:border-blue-500 text-sm bg-gray-50 focus:bg-white transition-colors"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-semibold text-gray-700">จังหวัด</label>
                  <input
                    type="text"
                    value={settings.shop_province}
                    onChange={e => handleChange('shop_province', e.target.value)}
                    placeholder="กรุงเทพมหานคร"
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none focus:border-blue-500 text-sm bg-gray-50 focus:bg-white transition-colors"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-semibold text-gray-700">รหัสไปรษณีย์</label>
                  <input
                    type="text"
                    value={settings.shop_zipcode}
                    onChange={e => handleChange('shop_zipcode', e.target.value)}
                    placeholder="10110"
                    maxLength={5}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none focus:border-blue-500 text-sm bg-gray-50 focus:bg-white transition-colors"
                  />
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 text-xs text-blue-700 mt-4">
                <strong>💡 หมายเหตุ:</strong> ตั้งค่า KEX credentials ใน <code className="bg-blue-100 px-1 rounded">.env.local</code><br/>
                <code>KEX_APP_KEY</code>, <code>KEX_APP_ID</code>, <code>KEX_MERCHANT_ID</code>, <code>KEX_ENV</code> (poc / production)
              </div>
            </div>
          )}

          {/* ─── Tab: การชำระเงิน ──────────────────────────────────────── */}
          {activeTab === 'payment' && (
            <PaymentTab settings={settings} handleChange={handleChange} />
          )}

          {/* ─── Tab: LINE OA ───────────────────────────────────────────── */}
          {activeTab === 'line' && (
            <div className="flex flex-col gap-6 max-w-xl animate-in fade-in slide-in-from-bottom-2 duration-300">
              <h2 className="text-lg font-bold text-gray-800 border-b border-gray-100 pb-2">LINE Official Account</h2>

              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-gray-700">LINE Channel ID</label>
                <input
                  type="text"
                  value={settings.line_channel_id}
                  onChange={e => handleChange('line_channel_id', e.target.value)}
                  placeholder="1234567890"
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none focus:border-blue-500 text-sm bg-gray-50 focus:bg-white transition-colors"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-gray-700">LINE Channel Secret</label>
                <input
                  type="password"
                  value={settings.line_channel_secret}
                  onChange={e => handleChange('line_channel_secret', e.target.value)}
                  placeholder="••••••••••••••••••••••••"
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none focus:border-blue-500 text-sm bg-gray-50 focus:bg-white transition-colors"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-gray-700">LINE Channel Access Token</label>
                <input
                  type="password"
                  value={settings.line_channel_access_token}
                  onChange={e => handleChange('line_channel_access_token', e.target.value)}
                  placeholder="••••••••••••••••••••••••"
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none focus:border-blue-500 text-sm bg-gray-50 focus:bg-white transition-colors"
                />
              </div>

              {/* Test connection button */}
              <button
                type="button"
                onClick={handleTestLineConnection}
                disabled={testingLine}
                className="flex items-center justify-center gap-2 w-full py-2.5 border-2 border-green-500 text-green-600 font-semibold text-sm rounded-lg hover:bg-green-50 disabled:opacity-60 transition-colors"
              >
                {testingLine ? (
                  <><Loader2 size={16} className="animate-spin" /> กำลังทดสอบการเชื่อมต่อ...</>
                ) : (
                  <><MessageCircle size={16} /> ทดสอบการเชื่อมต่อ</>
                )}
              </button>

              {/* Bot info result */}
              {lineBotInfo && (
                <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-4 animate-in fade-in duration-200">
                  {lineBotInfo.pictureUrl && (
                    <img
                      src={lineBotInfo.pictureUrl}
                      alt={lineBotInfo.displayName}
                      className="w-14 h-14 rounded-full border-2 border-green-300 object-cover flex-shrink-0"
                    />
                  )}
                  <div className="flex flex-col gap-0.5">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 size={16} className="text-green-600" />
                      <span className="text-sm font-bold text-green-700">เชื่อมต่อสำเร็จ!</span>
                    </div>
                    <p className="text-sm font-semibold text-gray-800">{lineBotInfo.displayName}</p>
                    <p className="text-xs text-gray-500">Basic ID: @{lineBotInfo.basicId}</p>
                  </div>
                </div>
              )}

              {/* Error result */}
              {lineTestError && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3 animate-in fade-in duration-200">
                  <XCircle size={16} className="text-red-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-red-700">เชื่อมต่อไม่สำเร็จ</p>
                    <p className="text-xs text-red-500 mt-0.5">{lineTestError}</p>
                  </div>
                </div>
              )}

              {/* Link to messages tab */}
              <div className="bg-blue-50 border border-blue-100 rounded-lg px-4 py-3 text-xs text-blue-700 flex items-center gap-2">
                <MessageCircle size={14} />
                <span>
                  ตั้งค่าข้อความตอบกลับได้ที่{' '}
                  <button
                    type="button"
                    onClick={() => setActiveTab('messages')}
                    className="font-semibold underline hover:text-blue-900 transition-colors"
                  >
                    tab ข้อความอัตโนมัติ
                  </button>
                </span>
              </div>
            </div>
          )}

          {/* ─── Tab: ข้อความอัตโนมัติ ──────────────────────────────── */}
          {activeTab === 'messages' && (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 w-full">
              <MessageTemplatesManager />
            </div>
          )}

        </div>
      </div>
    </div>
  )
}
