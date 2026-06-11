const KEX_POC_URL = 'https://poc-rd.th.kex-express.com/easyship-cust-api/api'
const KEX_PROD_URL = 'https://cms-api.th.kex-express.com/easyship-customer-api/api'

// ─── Config type ──────────────────────────────────────────────────────────────

export interface KexConfig {
  appKey: string
  appId: string
  merchantId: string
  env: string
}

function getBaseUrl(env: string) {
  return env === 'production' ? KEX_PROD_URL : KEX_POC_URL
}

function getHeaders(config: KexConfig) {
  return {
    'Content-Type': 'application/json; charset=UTF8',
    'app_key': config.appKey,
    'app_id': config.appId,
    'merchant_id': config.merchantId
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

export type ShipmentResult =
  | ShipmentResponse
  | { error: true; status_code?: string; status_desc?: string }
  | null

export async function createShipment(
  params: CreateShipmentParams,
  config: KexConfig
): Promise<ShipmentResult> {
  const url = `${getBaseUrl(config.env)}/v3/shipment_info`

  console.log('=== KEX DEBUG ===')
  console.log('URL:', url)
  console.log('Headers:', JSON.stringify({
    app_key: config.appKey ? 'SET(' + config.appKey.length + ')' : 'EMPTY',
    app_id: config.appId || 'EMPTY',
    merchant_id: config.merchantId || 'EMPTY'
  }))
  console.log('Body:', JSON.stringify({ req: { shipment: params } }))

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'app_key': config.appKey,
        'app_id': config.appId,
        'merchant_id': config.merchantId
      },
      body: JSON.stringify({ req: { shipment: params } })
    })

    console.log('KEX status:', res.status)
    console.log('KEX headers:', JSON.stringify(
      Object.fromEntries(res.headers.entries())
    ))

    const text = await res.text()
    console.log('KEX raw response:', text)

    let data: any
    try {
      data = JSON.parse(text)
    } catch {
      console.error('KEX response not JSON:', text)
      return {
        error: true,
        status_code: 'PARSE_ERROR',
        status_desc: 'Response ไม่ใช่ JSON: ' + text.substring(0, 200)
      }
    }

    const shipment = data?.res?.shipment
    if (shipment?.status_code === '000') {
      return shipment
    }

    console.error('KEX error code:', shipment?.status_code, 'desc:', shipment?.status_desc)
    return {
      error: true,
      status_code: shipment?.status_code || String(res.status),
      status_desc: shipment?.status_desc || 'Unknown'
    }
  } catch (err) {
    console.error('KEX fetch error:', err)
    return {
      error: true,
      status_code: 'FETCH_ERROR',
      status_desc: 'ไม่สามารถเชื่อมต่อ KEX: ' + String(err)
    }
  }
}

// ─── 2. ติดตามสถานะ ──────────────────────────────────────────────────────────

export async function trackShipment(
  trackingNumbers: string[],
  config: KexConfig
): Promise<TrackingResult[]> {
  try {
    const res = await fetch(
      `${getBaseUrl(config.env)}/v1/shipment_tracking`,
      {
        method: 'POST',
        headers: getHeaders(config),
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
  conNo: string,
  config: KexConfig
): Promise<boolean> {
  try {
    const res = await fetch(
      `${getBaseUrl(config.env)}/v1/shipment_cancel`,
      {
        method: 'POST',
        headers: getHeaders(config),
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
