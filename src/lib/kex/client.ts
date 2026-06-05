const KEX_POC_URL = 'https://poc-rd.th.kex-express.com/easyship-cust-api/api'
const KEX_PROD_URL = 'https://cms-api.th.kex-express.com/easyship-customer-api/api'

function getBaseUrl() {
  const env = import.meta.env.KEX_ENV || 'poc'
  return env === 'production' ? KEX_PROD_URL : KEX_POC_URL
}

function getHeaders() {
  return {
    'Content-Type': 'application/json; charset=UTF8',
    'app_key': import.meta.env.KEX_APP_KEY || '',
    'app_id': import.meta.env.KEX_APP_ID || '',
    'merchant_id': import.meta.env.KEX_MERCHANT_ID || ''
  }
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CreateShipmentParams {
  // ผู้ส่ง (ร้านค้า)
  s_name: string
  s_phone: string
  s_address: string
  s_subdistrict?: string
  s_district?: string
  s_province?: string
  s_zipcode: string
  // ผู้รับ (ลูกค้า)
  r_name: string
  r_phone: string
  r_address: string
  r_subdistrict: string
  r_district?: string
  r_province?: string
  r_zipcode: string
  // สินค้า
  product_description?: string
  cod_amount?: number
  ref_no?: string
  package?: Array<{
    p_name: string
    p_description?: string
    p_width?: number
    p_length?: number
    p_height?: number
    p_weight?: number
    p_quantity?: number
    p_price?: string
  }>
}

export interface ShipmentResponse {
  status_code: string
  status_desc: string
  con_no: string
  ref_no: string
  lh_route: string
  del_route: string
  geofen_dc_code: string
  service_code: string
  label_pdf: string
}

export interface TrackingResult {
  trackingNo: string
  refNo: string
  statusDatetime: string
  statusDesc: string
}

// ─── 1. สร้าง Shipment ───────────────────────────────────────────────────────

export async function createShipment(
  params: CreateShipmentParams
): Promise<ShipmentResponse | null> {
  try {
    const res = await fetch(
      `${getBaseUrl()}/v3/shipment_info`,
      {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          req: { shipment: params }
        })
      }
    )
    const data = await res.json()
    const shipment = data?.res?.shipment
    if (shipment?.status_code === '000') {
      return shipment
    }
    console.error('KEX create error:', shipment)
    return null
  } catch (err) {
    console.error('KEX create failed:', err)
    return null
  }
}

// ─── 2. ติดตามสถานะ ──────────────────────────────────────────────────────────

export async function trackShipment(
  trackingNumbers: string[]
): Promise<TrackingResult[]> {
  try {
    const res = await fetch(
      `${getBaseUrl()}/v1/shipment_tracking`,
      {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          language: 'th',
          trackingNo: trackingNumbers
        })
      }
    )
    const data = await res.json()
    if (data?.resultCode === '200') {
      return data.result.map((r: any) => r.shipmentInfo)
    }
    return []
  } catch (err) {
    console.error('KEX tracking failed:', err)
    return []
  }
}

// ─── 3. ยกเลิก Shipment ──────────────────────────────────────────────────────

export async function cancelShipment(
  conNo: string
): Promise<boolean> {
  try {
    const res = await fetch(
      `${getBaseUrl()}/v1/shipment_cancel`,
      {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ con_no: conNo })
      }
    )
    const data = await res.json()
    return data?.res?.shipment?.status_code === '000'
  } catch (err) {
    console.error('KEX cancel failed:', err)
    return false
  }
}
