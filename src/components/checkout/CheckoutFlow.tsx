import { useState, useEffect } from 'react'
import StepIndicator from './StepIndicator'
import SummaryStep from './SummaryStep'
import PaymentStep from './PaymentStep'
import VerifyStep from './VerifyStep'
import PackingStep from './PackingStep'
import AddressStep from './AddressStep'
import DoneStep from './DoneStep'

export type StepKey = 'summary' | 'payment' | 'verify' | 'packing' | 'address' | 'done'

export interface OrderItem {
  id: string
  product_name: string
  price: number
  quantity: number
  product_id: string
}

export interface Order {
  id: string
  order_number: string
  total: number
  shipping_fee: number
  status: string
  created_at: string
  order_items: OrderItem[]
}

export interface Customer {
  id: string
  display_name: string | null
  phone: string | null
  address_detail: string | null
  subdistrict: string | null
  district: string | null
  province: string | null
  zipcode: string | null
  line_user_id: string | null
}

export interface CheckoutSettings {
  payment_method: string
  bank_name: string
  bank_account_number: string
  bank_account_name: string
  payment_qr_image: string
  payment_qr_text: string
  promptpay_number: string
  promptpay_name: string
  slip_verify_method: 'manual' | 'auto'
}

interface Props {
  customerId: string
  orderId: string
}

export default function CheckoutFlow({ customerId, orderId }: Props) {
  const [step, setStep] = useState<StepKey>('summary')
  const [orders, setOrders] = useState<Order[]>([])
  const [settings, setSettings] = useState<CheckoutSettings | null>(null)
  const [customer, setCustomer] = useState<Customer | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [shipments, setShipments] = useState<any[]>([])

  useEffect(() => {
    loadData()
  }, [customerId, orderId])

  async function loadData() {
    if (!customerId) {
      setError('ไม่พบ Customer ID')
      setLoading(false)
      return
    }
    try {
      const params = new URLSearchParams({ customer: customerId })
      if (orderId) params.set('order', orderId)
      const res = await fetch(`/api/checkout/orders?${params}`)
      if (!res.ok) throw new Error('โหลดข้อมูลไม่สำเร็จ')
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setOrders(data.orders || [])
      setCustomer(data.customer)
      setSettings(data.settings)
    } catch (err: any) {
      setError(err.message || 'เกิดข้อผิดพลาด')
    } finally {
      setLoading(false)
    }
  }

  const totalItems = orders.reduce(
    (sum, o) => sum + (o.order_items?.reduce((s, i) => s + i.quantity, 0) || 0),
    0
  )
  const hasMultipleItems = totalItems > 1

  if (loading) {
    return (
      <div className="max-w-lg mx-auto px-4 py-20 flex flex-col items-center gap-4">
        <div className="w-12 h-12 rounded-full border-4 border-blue-100 border-t-blue-600 animate-spin" />
        <p className="text-gray-500 text-sm font-medium">กำลังโหลด...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-lg mx-auto px-4 py-20 text-center">
        <div className="text-4xl mb-3">😕</div>
        <h2 className="text-lg font-bold text-gray-800 mb-1">เกิดข้อผิดพลาด</h2>
        <p className="text-gray-500 text-sm">{error}</p>
      </div>
    )
  }

  if (!orders.length) {
    return (
      <div className="max-w-lg mx-auto px-4 py-20 text-center">
        <div className="text-4xl mb-3">📭</div>
        <h2 className="text-lg font-bold text-gray-800 mb-1">ไม่พบออเดอร์ที่รอชำระ</h2>
        <p className="text-gray-500 text-sm">ออเดอร์อาจชำระแล้วหรือถูกยกเลิก</p>
      </div>
    )
  }

  return (
    <div className="max-w-lg mx-auto px-4 pb-20">
      <StepIndicator
        current={step}
        hasMultipleItems={hasMultipleItems}
      />

      {step === 'summary' && (
        <SummaryStep
          orders={orders}
          settings={settings}
          onNext={() => setStep('payment')}
        />
      )}

      {step === 'payment' && (
        <PaymentStep
          orders={orders}
          settings={settings}
          onNext={() => setStep('verify')}
          onBack={() => setStep('summary')}
        />
      )}

      {step === 'verify' && (
        <VerifyStep
          orders={orders}
          settings={settings}
          customerId={customerId}
          onSuccess={() => {
            if (hasMultipleItems) setStep('packing')
            else setStep('address')
          }}
          onBack={() => setStep('payment')}
        />
      )}

      {step === 'packing' && (
        <PackingStep
          orders={orders}
          customerId={customerId}
          onNext={() => setStep('address')}
          onBack={() => setStep('verify')}
        />
      )}

      {step === 'address' && (
        <AddressStep
          customer={customer}
          customerId={customerId}
          orders={orders}
          onNext={(s) => {
            setShipments(s)
            setStep('done')
          }}
          onBack={() =>
            hasMultipleItems ? setStep('packing') : setStep('verify')
          }
        />
      )}

      {step === 'done' && (
        <DoneStep orders={orders} shipments={shipments} />
      )}
    </div>
  )
}
