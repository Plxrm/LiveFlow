import { useState, useRef, useEffect } from 'react'
import { ArrowLeft, ArrowRight, Camera, CheckCircle, XCircle, AlertTriangle, Loader2 } from 'lucide-react'
import type { Order, CheckoutSettings } from './CheckoutFlow'

type VerifyState = 'upload' | 'checking' | 'success' | 'error' | 'partial' | 'manual_pending'

interface Props {
  orders: Order[]
  settings: CheckoutSettings | null
  customerId: string
  onSuccess: () => void
  onBack: () => void
}

export default function VerifyStep({ orders, settings, customerId, onSuccess, onBack }: Props) {
  const [verifyState, setVerifyState] = useState<VerifyState>('upload')
  const [preview, setPreview] = useState<string | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [verifyData, setVerifyData] = useState<any>(null)
  const [paidSoFar, setPaidSoFar] = useState(0)
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const total = orders.reduce((s, o) => s + o.total, 0)
  const remaining = total - paidSoFar
  const orderIds = orders.map(o => o.id)

  useEffect(() => {
    return () => { if (pollRef.current) clearInterval(pollRef.current) }
  }, [])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setSelectedFile(file)
    setPreview(URL.createObjectURL(file))
    setError(null)
    setVerifyState('upload')
  }

  const handleSubmit = async () => {
    if (!selectedFile) return
    setUploading(true)
    setError(null)

    try {
      // 1. Upload slip to storage
      const formData = new FormData()
      formData.append('file', selectedFile)
      const uploadRes = await fetch('/api/checkout/upload-slip', {
        method: 'POST',
        body: formData,
      })
      const uploadData = await uploadRes.json()
      if (!uploadRes.ok || uploadData.error) throw new Error(uploadData.error || 'อัปโหลดไม่สำเร็จ')

      setUploading(false)
      setVerifyState('checking')

      // 2. Submit slip + verify
      const submitRes = await fetch('/api/checkout/submit-slip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slip_url: uploadData.url,
          slip_file_name: uploadData.fileName,
          amount: remaining,
          customer_id: customerId,
          order_ids: orderIds,
        }),
      })
      const submitData = await submitRes.json()

      // Manual mode
      if (submitData.method === 'manual') {
        setVerifyState('manual_pending')
        return
      }

      // Auto mode result
      handleVerifyResult(submitData)
    } catch (err: any) {
      setUploading(false)
      setError(err.message || 'เกิดข้อผิดพลาด')
      setVerifyState('upload')
    }
  }

  const handleVerifyResult = (data: any) => {
    if (data.success) {
      const vData = data.data || {}
      const transferred = vData.transfer_amount || remaining
      const newPaid = paidSoFar + transferred
      setVerifyData(vData)

      if (newPaid >= total - 1) {
        // paid in full (allow 1 baht tolerance)
        setVerifyState('success')
      } else {
        // partial payment
        setPaidSoFar(newPaid)
        setVerifyState('partial')
      }
    } else {
      setError(data.error || 'สลิปไม่ผ่านการตรวจสอบ')
      setVerifyState('error')
    }
  }

  const resetUpload = () => {
    setSelectedFile(null)
    setPreview(null)
    setVerifyState('upload')
    setError(null)
  }

  // ─── Render states ──────────────────────────────────────────────────────────

  if (verifyState === 'checking') {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-5">
        <div className="w-20 h-20 rounded-full bg-blue-50 flex items-center justify-center">
          <Loader2 size={36} className="text-blue-600 animate-spin" />
        </div>
        <div className="text-center">
          <h2 className="text-xl font-bold text-gray-800">กำลังตรวจสอบสลิป...</h2>
          <p className="text-gray-500 text-sm mt-1">รอสักครู่นะคะ</p>
        </div>
      </div>
    )
  }

  if (verifyState === 'success') {
    return (
      <div className="flex flex-col gap-4">
        <div className="bg-green-50 border border-green-200 rounded-2xl p-6 flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-green-500 flex items-center justify-center">
            <CheckCircle size={32} className="text-white" />
          </div>
          <div className="text-center">
            <h2 className="text-xl font-bold text-green-800">ตรวจสอบสลิปสำเร็จ! ✅</h2>
            <p className="text-green-600 text-sm mt-1">ยืนยันการชำระเงินแล้ว</p>
          </div>
          {verifyData && (
            <div className="w-full bg-white rounded-xl p-4 flex flex-col gap-2 text-sm">
              {verifyData.transfer_amount && (
                <div className="flex justify-between">
                  <span className="text-gray-500">💰 ยอดโอน</span>
                  <span className="font-bold text-gray-900">฿{Number(verifyData.transfer_amount).toLocaleString()}</span>
                </div>
              )}
              {verifyData.sender_name && (
                <div className="flex justify-between">
                  <span className="text-gray-500">👤 จาก</span>
                  <span className="font-semibold text-gray-800">{verifyData.sender_name}</span>
                </div>
              )}
              {verifyData.sender_bank && (
                <div className="flex justify-between">
                  <span className="text-gray-500">🏦 ธนาคาร</span>
                  <span className="font-semibold text-gray-800">{verifyData.sender_bank}</span>
                </div>
              )}
            </div>
          )}
        </div>
        <button
          onClick={onSuccess}
          className="w-full py-4 bg-green-600 text-white font-bold text-base rounded-2xl shadow-lg shadow-green-200 flex items-center justify-center gap-2 active:scale-95 transition-transform"
        >
          ถัดไป <ArrowRight size={18} />
        </button>
      </div>
    )
  }

  if (verifyState === 'manual_pending') {
    return (
      <div className="flex flex-col gap-4">
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-amber-400 flex items-center justify-center">
            <span className="text-3xl">📋</span>
          </div>
          <div className="text-center">
            <h2 className="text-xl font-bold text-amber-800">ส่งสลิปสำเร็จ!</h2>
            <p className="text-amber-700 text-sm mt-1">รอ admin ตรวจสอบและยืนยันการชำระเงิน</p>
          </div>
          {preview && (
            <img src={preview} alt="slip preview" className="w-32 h-32 object-cover rounded-xl border border-amber-200" />
          )}
          <p className="text-xs text-amber-600 text-center">
            ระบบจะแจ้งผ่าน LINE เมื่อ admin ยืนยันแล้วนะคะ 💙
          </p>
        </div>
        <button
          onClick={onSuccess}
          className="w-full py-4 bg-amber-500 text-white font-bold text-base rounded-2xl shadow-lg shadow-amber-200 flex items-center justify-center gap-2 active:scale-95 transition-transform"
        >
          ถัดไป <ArrowRight size={18} />
        </button>
      </div>
    )
  }

  if (verifyState === 'error') {
    return (
      <div className="flex flex-col gap-4">
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6 flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-red-500 flex items-center justify-center">
            <XCircle size={32} className="text-white" />
          </div>
          <div className="text-center">
            <h2 className="text-xl font-bold text-red-800">สลิปไม่ผ่านการตรวจสอบ</h2>
            <p className="text-red-600 text-sm mt-1">{error || 'กรุณาตรวจสอบสลิปอีกครั้ง'}</p>
          </div>
        </div>
        <button
          onClick={resetUpload}
          className="w-full py-4 bg-red-600 text-white font-bold text-base rounded-2xl flex items-center justify-center gap-2 active:scale-95 transition-transform"
        >
          อัปโหลดสลิปใหม่
        </button>
        <button onClick={onBack} className="flex items-center justify-center gap-2 py-3 text-gray-500 text-sm">
          <ArrowLeft size={16} /> ย้อนกลับ
        </button>
      </div>
    )
  }

  if (verifyState === 'partial') {
    return (
      <div className="flex flex-col gap-4">
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-amber-400 flex items-center justify-center">
            <AlertTriangle size={32} className="text-white" />
          </div>
          <div className="text-center">
            <h2 className="text-xl font-bold text-amber-800">⚠️ ยอดไม่ครบ</h2>
          </div>
          <div className="w-full bg-white rounded-xl p-4 flex flex-col gap-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">ยอดที่ต้องชำระ</span>
              <span className="font-bold">฿{total.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">ยอดที่โอนแล้ว</span>
              <span className="font-semibold text-green-600">฿{paidSoFar.toLocaleString()}</span>
            </div>
            <div className="h-px bg-gray-100" />
            <div className="flex justify-between font-bold text-red-600">
              <span>💰 ยอดคงเหลือ</span>
              <span>฿{(total - paidSoFar).toLocaleString()}</span>
            </div>
          </div>
          <p className="text-xs text-amber-600 text-center">
            กรุณาโอนยอดที่เหลือ <strong>฿{(total - paidSoFar).toLocaleString()}</strong> แล้วอัปโหลดสลิปอีกครั้ง
          </p>
        </div>
        <button
          onClick={resetUpload}
          className="w-full py-4 bg-blue-600 text-white font-bold text-base rounded-2xl shadow-lg shadow-blue-200 flex items-center justify-center gap-2 active:scale-95 transition-transform"
        >
          อัปโหลดสลิปเพิ่ม
        </button>
      </div>
    )
  }

  // ─── Upload state ────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col gap-4">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-50 flex items-center gap-2">
          <span className="text-lg">📸</span>
          <h3 className="text-sm font-bold text-gray-700">อัปโหลดสลิปโอนเงิน</h3>
        </div>

        <div className="p-5 flex flex-col gap-4">
          {/* Amount reminder */}
          <div className="bg-blue-50 rounded-xl px-4 py-3 flex justify-between items-center">
            <span className="text-sm text-gray-600">ยอดที่ต้องโอน</span>
            <span className="text-blue-700 font-black text-lg">฿{remaining.toLocaleString()}</span>
          </div>

          {/* File picker area */}
          <div
            onClick={() => fileRef.current?.click()}
            className={`relative rounded-2xl border-2 border-dashed overflow-hidden cursor-pointer transition-all ${
              preview ? 'border-blue-300 bg-blue-50' : 'border-gray-200 bg-gray-50 hover:border-blue-300'
            }`}
            style={{ minHeight: 200 }}
          >
            {preview ? (
              <img
                src={preview}
                alt="slip preview"
                className="w-full h-64 object-contain"
              />
            ) : (
              <div className="flex flex-col items-center justify-center h-full py-12 gap-3">
                <div className="w-14 h-14 rounded-2xl bg-blue-100 flex items-center justify-center">
                  <Camera size={26} className="text-blue-600" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-semibold text-gray-700">กดเพื่อเลือกรูป</p>
                  <p className="text-xs text-gray-400 mt-0.5">หรือถ่ายรูปสลิปโดยตรง</p>
                </div>
              </div>
            )}
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={handleFileChange}
            />
          </div>

          {preview && (
            <button
              onClick={() => fileRef.current?.click()}
              className="text-xs text-blue-600 underline text-center"
            >
              เลือกรูปใหม่
            </button>
          )}

          {error && (
            <p className="text-xs text-red-500 text-center">{error}</p>
          )}
        </div>
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
          onClick={handleSubmit}
          disabled={!selectedFile || uploading}
          className="flex-1 py-4 bg-blue-600 text-white font-bold text-base rounded-2xl shadow-lg shadow-blue-200 flex items-center justify-center gap-2 active:scale-95 transition-transform disabled:opacity-50 disabled:active:scale-100"
        >
          {uploading ? (
            <><Loader2 size={18} className="animate-spin" /> กำลังอัปโหลด...</>
          ) : (
            <>ส่งสลิป <ArrowRight size={18} /></>
          )}
        </button>
      </div>
    </div>
  )
}
