import { getSupabaseAdmin } from '../supabase/admin'
const supabaseAdmin = getSupabaseAdmin()

export interface AppSettings {
  shop_name: string
  shop_logo_url: string
  site_url: string   // URL เว็บไซต์ ใช้สร้างลิงก์ส่งลูกค้า
  // ข้อมูลผู้ส่ง KEX Express
  shop_sender_name: string
  shop_phone: string
  shop_address: string
  shop_subdistrict: string
  shop_district: string
  shop_province: string
  shop_zipcode: string

  // LINE OA
  line_channel_id: string
  line_channel_secret: string
  line_channel_access_token: string

  // วิธีชำระเงิน
  payment_method: 'text' | 'image' | 'promptpay' | 'promptpay_text'

  // แบบ 1: ข้อความบัญชีธนาคาร
  bank_name: string
  bank_account_number: string
  bank_account_name: string

  // แบบ 2: รูป QR
  payment_qr_image: string
  payment_qr_text: string

  // แบบ 3+4: PromptPay
  promptpay_number: string
  promptpay_name: string

  auto_confirm_payment: boolean
  auto_ship_on_payment: boolean

  // หมดเวลาชำระ
  payment_timeout_minutes: number
  warning_before_timeout_minutes: number
  auto_ban_on_timeout: boolean
  ban_after_unpaid_count: number

  // วิธีตรวจสลิป
  slip_verify_method: 'manual' | 'auto'
  checkslip_api_token: string
  checkslip_merchant_code: string
  checkslip_webhook_secret: string
}

const defaultSettings: AppSettings = {
  shop_name: 'LiveFlow',
  shop_logo_url: '',
  site_url: '',
  shop_sender_name: '',
  shop_phone: '',
  shop_address: '',
  shop_subdistrict: '',
  shop_district: '',
  shop_province: '',
  shop_zipcode: '',

  line_channel_id: '',
  line_channel_secret: '',
  line_channel_access_token: '',

  payment_method: 'text',
  bank_name: '',
  bank_account_number: '',
  bank_account_name: '',
  payment_qr_image: '',
  payment_qr_text: '',
  promptpay_number: '',
  promptpay_name: '',

  auto_confirm_payment: false,
  auto_ship_on_payment: false,

  payment_timeout_minutes: 30,
  warning_before_timeout_minutes: 5,
  auto_ban_on_timeout: false,
  ban_after_unpaid_count: 2,

  slip_verify_method: 'manual',
  checkslip_api_token: '',
  checkslip_merchant_code: '',
  checkslip_webhook_secret: '',
}

export async function getSettings(): Promise<AppSettings> {
  if (!supabaseAdmin) return defaultSettings

  try {
    const { data, error } = await supabaseAdmin
      .from('settings')
      .select('key, value')

    if (error || !data || data.length === 0) {
      return defaultSettings
    }

    // แปลง key-value rows → object
    const settings = { ...defaultSettings }
    for (const row of data) {
      const key = row.key as keyof AppSettings
      if (key in settings) {
        try {
          settings[key] = JSON.parse(row.value) as any
        } catch {
          settings[key] = row.value as any
        }
      }
    }
    return settings
  } catch (err) {
    console.error('getSettings error:', err)
    return defaultSettings
  }
}

export async function updateSettings(
  data: Partial<AppSettings>
): Promise<AppSettings> {
  if (!supabaseAdmin) return { ...defaultSettings, ...data }

  try {
    // upsert แต่ละ key
    for (const [key, value] of Object.entries(data)) {
      await supabaseAdmin
        .from('settings')
        .upsert(
          {
            key: key,
            value: JSON.stringify(value),
            updated_at: new Date().toISOString()
          },
          { onConflict: 'key' }
        )
    }

    // return settings ล่าสุด
    return await getSettings()
  } catch (err) {
    console.error('updateSettings error:', err)
    return { ...defaultSettings, ...data }
  }
}
