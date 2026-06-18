import { ArrowRight, ArrowLeft, Copy, CheckCircle } from 'lucide-react'
import { useState } from 'react'
import type { Order, CheckoutSettings } from './CheckoutFlow'

interface Props {
  orders: Order[]
  settings: CheckoutSettings | null
  onNext: () => void
  onBack: () => void
}

export default function PaymentStep({ orders, settings, onNext, onBack }: Props) {
  const [copied, setCopied] = useState(false)
  const total = orders.reduce((sum, o) => sum + o.total, 0)
  const method = settings?.payment_method || 'text'

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Amount reminder */}
      <div className="bg-gradient-to-br from-indigo-600 to-blue-500 rounded-2xl p-5 text-white shadow-lg">
        <p className="text-indigo-100 text-sm font-medium">💰 ยอดที่ต้องชำระ</p>
        <p className="text-4xl font-black tracking-tight mt-1">
          ฿{total.toLocaleString()}
        </p>
      </div>

      {/* Payment channel */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-50 flex items-center gap-2">
          <span className="text-lg">💳</span>
          <h3 className="text-sm font-bold text-gray-700">ช่องทางชำระเงิน</h3>
        </div>

        <div className="p-5 flex flex-col gap-4">
          {/* TEXT / bank transfer */}
          {method === 'text' && (
            <div className="flex flex-col gap-3">
              <div className="bg-gray-50 rounded-xl p-4 flex flex-col gap-2">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">ธนาคาร</p>
                <p className="text-base font-bold text-gray-900">{settings?.bank_name || '-'}</p>
              </div>
              <div className="bg-blue-50 rounded-xl p-4 flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">เลขบัญชี</p>
                  <p className="text-xl font-black text-blue-700 tracking-wider font-mono">
                    {settings?.bank_account_number || '-'}
                  </p>
                </div>
                <button
                  onClick={() => copyToClipboard(settings?.bank_account_number || '')}
                  className="flex-shrink-0 flex items-center gap-1.5 bg-blue-600 text-white text-xs font-bold px-3 py-2 rounded-xl"
                >
                  {copied ? <CheckCircle size={14} /> : <Copy size={14} />}
                  {copied ? 'คัดลอก!' : 'คัดลอก'}
                </button>
              </div>
              {settings?.bank_account_name && (
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">ชื่อบัญชี</p>
                  <p className="text-base font-semibold text-gray-800 mt-1">{settings.bank_account_name}</p>
                </div>
              )}
            </div>
          )}

          {/* PROMPTPAY */}
          {method === 'promptpay' && (
            <div className="flex flex-col items-center gap-4">
              <div className="bg-gray-50 rounded-xl w-full p-4 text-center">
                <p className="text-xs text-gray-500 mb-1">สแกน QR เพื่อโอนเงิน</p>
                {/* PromptPay QR — generated from number */}
                <div className="w-48 h-48 mx-auto bg-white rounded-xl flex items-center justify-center shadow-inner border border-gray-200">
                  <div className="text-center">
                    <p className="text-3xl mb-2">📱</p>
                    <p className="text-xs font-mono text-gray-600">{settings?.promptpay_number}</p>
                  </div>
                </div>
                <p className="text-sm font-bold text-gray-800 mt-3">{settings?.promptpay_name}</p>
                <p className="text-blue-600 font-black text-xl mt-1">฿{total.toLocaleString()}</p>
              </div>
            </div>
          )}

          {/* IMAGE QR */}
          {method === 'image' && (
            <div className="flex flex-col items-center gap-4">
              {settings?.payment_qr_image && (
                <img
                  src={settings.payment_qr_image}
                  alt="QR ชำระเงิน"
                  className="w-56 h-56 object-contain rounded-xl border border-gray-200 shadow-sm"
                />
              )}
              {settings?.payment_qr_text && (
                <p className="text-sm text-gray-600 text-center bg-gray-50 rounded-xl px-4 py-3 w-full">
                  {settings.payment_qr_text}
                </p>
              )}
              <p className="text-blue-600 font-black text-2xl">฿{total.toLocaleString()}</p>
            </div>
          )}

          {/* PROMPTPAY TEXT */}
          {method === 'promptpay_text' && (
            <div className="flex flex-col gap-3">
              <div className="bg-blue-50 rounded-xl p-4 flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">เบอร์ PromptPay</p>
                  <p className="text-xl font-black text-blue-700 tracking-wider font-mono">
                    {settings?.promptpay_number || '-'}
                  </p>
                </div>
                <button
                  onClick={() => copyToClipboard(settings?.promptpay_number || '')}
                  className="flex-shrink-0 flex items-center gap-1.5 bg-blue-600 text-white text-xs font-bold px-3 py-2 rounded-xl"
                >
                  {copied ? <CheckCircle size={14} /> : <Copy size={14} />}
                  {copied ? 'คัดลอก!' : 'คัดลอก'}
                </button>
              </div>
              <p className="text-blue-600 font-black text-2xl text-center">฿{total.toLocaleString()}</p>
            </div>
          )}
        </div>
      </div>

      {/* Tips */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-xs text-amber-700 flex items-start gap-2">
        <span className="text-base flex-shrink-0">💡</span>
        <span>โอนเงินตามยอด <strong>฿{total.toLocaleString()}</strong> แล้วนำสลิปมาอัปโหลดในขั้นตอนถัดไป</span>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-5 py-4 border-2 border-gray-200 text-gray-600 font-bold rounded-2xl active:scale-95 transition-transform"
        >
          <ArrowLeft size={18} />
        </button>
        <button
          onClick={onNext}
          className="flex-1 py-4 bg-blue-600 text-white font-bold text-base rounded-2xl shadow-lg shadow-blue-200 flex items-center justify-center gap-2 active:scale-95 transition-transform"
        >
          อัปโหลดสลิป <ArrowRight size={18} />
        </button>
      </div>
    </div>
  )
}
