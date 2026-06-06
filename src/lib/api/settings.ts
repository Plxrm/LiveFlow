import { supabaseAdmin } from '../supabase/admin'

export interface AppSettings {
  shop_name: string
  shop_logo_url: string
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
  // การชำระเงิน
  promptpay_number: string
  promptpay_name: string
  auto_confirm_payment: boolean
  auto_ship_on_payment: boolean
}

const defaultSettings: AppSettings = {
  shop_name: 'LiveFlow',
  shop_logo_url: '',
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
  promptpay_number: '',
  promptpay_name: '',
  auto_confirm_payment: false,
  auto_ship_on_payment: false,
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
