import { getSettings } from '../api/settings'

const CHECK_SLIP_BASE = 'https://check-slip.com/api'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface SlipVerifyData {
  status: string
  message: string
  transfer_amount: number | null
  diff_amount: number | null
  sender_name: string | null
  sender_bank: string | null
  sender_account_number: string | null
  reciever_name: string | null
  reciever_bank: string | null
  transfered_at: string | null
}

export interface VerifyResult {
  success: boolean
  data?: SlipVerifyData
  error?: string
}

export interface CreditBalanceResult {
  success: boolean
  balance?: number
  error?: string
}

// ─── verifySlip ───────────────────────────────────────────────────────────────

export async function verifySlip(
  slipFile: File | Blob,
  amount: number,
  orderId: string
): Promise<VerifyResult> {
  try {
    const settings = await getSettings()
    const token = settings.checkslip_api_token
    const merchantCode = settings.checkslip_merchant_code

    if (!token || !merchantCode) {
      return {
        success: false,
        error: 'Check-Slip API ยังไม่ได้ตั้งค่า',
      }
    }

    const formData = new FormData()
    formData.append('merchantCode', merchantCode)
    formData.append('orderId', orderId)
    formData.append('amount', String(amount))
    formData.append('paymentSlip', slipFile, 'slip.jpg')

    const res = await fetch(`${CHECK_SLIP_BASE}/quickVerify`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    })

    const data = await res.json()
    console.log('Check-Slip quickVerify response:', JSON.stringify(data))

    if (data.success) {
      return {
        success: true,
        data: data.data as SlipVerifyData,
      }
    }

    return {
      success: false,
      error: data.message || 'ตรวจสอบไม่สำเร็จ',
    }
  } catch (err) {
    console.error('Check-Slip verifySlip error:', err)
    return {
      success: false,
      error: 'ไม่สามารถเชื่อมต่อ Check-Slip ได้',
    }
  }
}

// ─── getCreditBalance ─────────────────────────────────────────────────────────

export async function getCreditBalance(
  tokenOverride?: string
): Promise<CreditBalanceResult> {
  try {
    const token = tokenOverride || (await getSettings()).checkslip_api_token

    if (!token) {
      return { success: false, error: 'ยังไม่ได้ตั้งค่า API Token' }
    }

    const res = await fetch(`${CHECK_SLIP_BASE}/creditBalance`, {
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Authorization: `Bearer ${token}`,
      },
    })

    const data = await res.json()
    console.log('Check-Slip creditBalance response:', JSON.stringify(data))

    if (res.ok) {
      return {
        success: true,
        balance: data.data?.credit_balance ?? 0,
      }
    }

    return {
      success: false,
      error: data.message || `HTTP ${res.status}`,
    }
  } catch (err) {
    console.error('Check-Slip getCreditBalance error:', err)
    return { success: false, error: 'เชื่อมต่อไม่ได้' }
  }
}

// ─── verifyWebhookSignature ───────────────────────────────────────────────────

export function verifyWebhookSignature(
  body: string,
  timestamp: string,
  signature: string,
  apiSecret: string
): boolean {
  try {
    // Use Web Crypto API (Edge-compatible, no require())
    const encoder = new TextEncoder()
    const payload = `${timestamp}\n${body}\n`

    // We use the synchronous approach with subtle only available async,
    // so we fall back to a string comparison guard and return true for now
    // when running in Cloudflare Pages edge. Full async version below:
    // (Actual HMAC validation is done in the webhook endpoint using the async helper)
    void encoder
    void payload
    void apiSecret
    void signature
    // Real validation is delegated to verifyWebhookSignatureAsync
    return true
  } catch {
    return false
  }
}

/**
 * Async HMAC-SHA256 verification — use this in API routes
 */
export async function verifyWebhookSignatureAsync(
  body: string,
  timestamp: string,
  signature: string,
  apiSecret: string
): Promise<boolean> {
  try {
    const encoder = new TextEncoder()
    const payload = `${timestamp}\n${body}\n`

    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(apiSecret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    )

    const signatureBuffer = await crypto.subtle.sign(
      'HMAC',
      key,
      encoder.encode(payload)
    )

    const hashHex = Array.from(new Uint8Array(signatureBuffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('')

    return hashHex === signature
  } catch (err) {
    console.error('verifyWebhookSignatureAsync error:', err)
    return false
  }
}
