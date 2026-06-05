import { useState } from 'react'
import { Store, CreditCard, MessageCircle, Save, CheckCircle, Truck } from 'lucide-react'
import type { AppSettings } from '../../lib/api/settings'

interface SettingsPageProps {
  initialSettings: AppSettings
}

type TabKey = 'shop' | 'shipping' | 'payment' | 'line'

export default function SettingsPage({ initialSettings }: SettingsPageProps) {
  const [settings, setSettings] = useState<AppSettings>(initialSettings)
  const [activeTab, setActiveTab] = useState<TabKey>('shop')
  const [saving, setSaving] = useState(false)
  const [showToast, setShowToast] = useState(false)

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

  const tabs: { key: TabKey; label: string; icon: React.ReactNode }[] = [
    { key: 'shop',     label: 'ข้อมูลร้านค้า',        icon: <Store size={18} /> },
    { key: 'shipping', label: 'ข้อมูลผู้ส่ง (KEX)',   icon: <Truck size={18} /> },
    { key: 'payment',  label: 'การชำระเงิน & จัดส่ง', icon: <CreditCard size={18} /> },
    { key: 'line',     label: 'LINE OA',               icon: <MessageCircle size={18} /> },
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
                    placeholder="ร้าน Pluem Live"
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

              <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 text-xs text-blue-700">
                <strong>💡 หมายเหตุ:</strong> ตั้งค่า KEX credentials ใน <code className="bg-blue-100 px-1 rounded">.env.local</code><br/>
                <code>KEX_APP_KEY</code>, <code>KEX_APP_ID</code>, <code>KEX_MERCHANT_ID</code>, <code>KEX_ENV</code> (poc / production)
              </div>
            </div>
          )}

          {/* ─── Tab: การชำระเงิน & จัดส่ง ────────────────────────────── */}
          {activeTab === 'payment' && (
            <div className="flex flex-col gap-6 max-w-xl animate-in fade-in slide-in-from-bottom-2 duration-300">
              <h2 className="text-lg font-bold text-gray-800 border-b border-gray-100 pb-2">การชำระเงิน และการจัดส่ง</h2>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-semibold text-gray-700">เบอร์พร้อมเพย์ (PromptPay)</label>
                  <input
                    type="text"
                    value={settings.promptpay_number}
                    onChange={e => handleChange('promptpay_number', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none focus:border-blue-500 text-sm bg-gray-50 focus:bg-white transition-colors"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-semibold text-gray-700">ชื่อบัญชีรับเงิน</label>
                  <input
                    type="text"
                    value={settings.promptpay_name}
                    onChange={e => handleChange('promptpay_name', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none focus:border-blue-500 text-sm bg-gray-50 focus:bg-white transition-colors"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-semibold text-gray-700">ค่าจัดส่งเริ่มต้น (บาท)</label>
                  <input
                    type="number"
                    value={settings.shipping_fee}
                    onChange={e => handleChange('shipping_fee', Number(e.target.value))}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none focus:border-blue-500 text-sm bg-gray-50 focus:bg-white transition-colors"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-semibold text-gray-700">ขั้นต่ำส่งฟรี (บาท)</label>
                  <input
                    type="number"
                    value={settings.free_shipping_min}
                    onChange={e => handleChange('free_shipping_min', Number(e.target.value))}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none focus:border-blue-500 text-sm bg-gray-50 focus:bg-white transition-colors"
                  />
                </div>
              </div>

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
          )}

          {/* ─── Tab: LINE OA ───────────────────────────────────────────── */}
          {activeTab === 'line' && (
            <div className="flex flex-col gap-6 max-w-xl animate-in fade-in slide-in-from-bottom-2 duration-300">
              <h2 className="text-lg font-bold text-gray-800 border-b border-gray-100 pb-2">LINE Official Account</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-semibold text-gray-700">LINE Channel ID</label>
                  <input
                    type="text"
                    value={settings.line_channel_id}
                    onChange={e => handleChange('line_channel_id', e.target.value)}
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
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-gray-700">ข้อความต้อนรับ (Welcome Message)</label>
                <textarea
                  rows={3}
                  value={settings.welcome_message}
                  onChange={e => handleChange('welcome_message', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none focus:border-blue-500 text-sm bg-gray-50 focus:bg-white transition-colors resize-none"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-gray-700">ข้อความตอบกลับ: CF สำเร็จ</label>
                <textarea
                  rows={2}
                  value={settings.cf_success_message}
                  onChange={e => handleChange('cf_success_message', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none focus:border-blue-500 text-sm bg-emerald-50/50 focus:bg-white transition-colors resize-none border-emerald-100"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-gray-700">ข้อความตอบกลับ: CF ผิดพลาด / สินค้าหมด</label>
                <textarea
                  rows={2}
                  value={settings.cf_error_message}
                  onChange={e => handleChange('cf_error_message', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none focus:border-blue-500 text-sm bg-red-50/50 focus:bg-white transition-colors resize-none border-red-100"
                />
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}
