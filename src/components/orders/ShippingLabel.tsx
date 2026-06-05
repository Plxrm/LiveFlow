/**
 * ShippingLabel — Custom 3×4 inch label
 * Fallback สำหรับกรณี KEX ไม่คืน label_pdf_url
 * หรือต้องการ label แบบ custom
 */

interface ShippingLabelProps {
  trackingNumber: string
  delRoute?: string
  serviceCode?: string
  sender: {
    name: string
    phone: string
    address: string
    zipcode: string
  }
  recipient: {
    name: string
    phone: string
    address: string
    zipcode: string
  }
  orderNumber: string
  itemCount: number
  codAmount?: number
}

export default function ShippingLabel({
  trackingNumber,
  delRoute,
  serviceCode,
  sender,
  recipient,
  orderNumber,
  itemCount,
  codAmount = 0,
}: ShippingLabelProps) {
  // Simple QR placeholder — ในการใช้จริงเชื่อม qrcode library
  const qrData = `${trackingNumber} 1 1 ${delRoute || ''}`

  return (
    <div
      className="shipping-label"
      style={{
        width: '3in',
        height: '4in',
        border: '1.5px solid #000',
        fontFamily: 'Arial, sans-serif',
        fontSize: '8pt',
        padding: '4mm',
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
        gap: '3px',
        backgroundColor: '#fff',
        position: 'relative',
        pageBreakAfter: 'always',
        breakAfter: 'page',
      }}
    >
      {/* ─── Header: Logo + Service ──────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #000', paddingBottom: '3px', marginBottom: '3px' }}>
        <div style={{ fontWeight: 'bold', fontSize: '11pt', letterSpacing: '1px' }}>KEX Express</div>
        <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
          {serviceCode && (
            <span style={{ background: '#000', color: '#fff', padding: '1px 5px', fontSize: '7pt', borderRadius: '2px' }}>
              {serviceCode}
            </span>
          )}
          {codAmount > 0 && (
            <span style={{ background: '#e53e3e', color: '#fff', padding: '1px 5px', fontSize: '7pt', borderRadius: '2px', fontWeight: 'bold' }}>
              COD ฿{codAmount.toLocaleString()}
            </span>
          )}
        </div>
      </div>

      {/* ─── QR Code + Tracking Number ───────────────────────── */}
      <div style={{ display: 'flex', gap: '6px', alignItems: 'flex-start', borderBottom: '1px solid #ccc', paddingBottom: '4px', marginBottom: '3px' }}>
        {/* QR placeholder box */}
        <div
          style={{
            width: '0.75in',
            height: '0.75in',
            border: '1px solid #999',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            fontSize: '5pt',
            color: '#999',
            textAlign: 'center',
            background: '#f9f9f9',
          }}
          title={qrData}
        >
          QR<br/>{trackingNumber.slice(-4)}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 'bold', fontSize: '13pt', letterSpacing: '1px', wordBreak: 'break-all', lineHeight: 1.2 }}>
            {trackingNumber}
          </div>
          {delRoute && (
            <div style={{ fontSize: '8pt', color: '#555', marginTop: '2px' }}>
              เส้นทาง: <strong>{delRoute}</strong>
            </div>
          )}
        </div>
      </div>

      {/* ─── ผู้รับ (Recipient) ───────────────────────────────── */}
      <div style={{ flex: 1, borderBottom: '1px solid #ccc', paddingBottom: '4px', marginBottom: '3px' }}>
        <div style={{ fontSize: '6pt', color: '#666', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '2px' }}>
          ผู้รับ / RECIPIENT
        </div>
        <div style={{ fontWeight: 'bold', fontSize: '9pt' }}>{recipient.name}</div>
        <div>{recipient.phone}</div>
        <div style={{ color: '#333', marginTop: '1px', lineHeight: 1.4 }}>{recipient.address}</div>
        <div style={{ fontWeight: 'bold', fontSize: '9pt', marginTop: '2px' }}>{recipient.zipcode}</div>
      </div>

      {/* ─── ผู้ส่ง (Sender) ─────────────────────────────────── */}
      <div style={{ borderBottom: '1px solid #ccc', paddingBottom: '4px', marginBottom: '3px' }}>
        <div style={{ fontSize: '6pt', color: '#666', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '2px' }}>
          ผู้ส่ง / SENDER
        </div>
        <div style={{ fontWeight: 'bold' }}>{sender.name}</div>
        <div>{sender.phone}</div>
        <div style={{ color: '#333', lineHeight: 1.3 }}>{sender.address}</div>
        <div>{sender.zipcode}</div>
      </div>

      {/* ─── Footer: Order + Items ───────────────────────────── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '7pt', color: '#555' }}>
        <span>ออเดอร์: <strong>{orderNumber}</strong></span>
        <span>จำนวน: <strong>{itemCount} ชิ้น</strong></span>
      </div>
    </div>
  )
}
