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
  return defaultSettings
}

export async function updateSettings(data: Partial<AppSettings>): Promise<AppSettings> {
  return { ...defaultSettings, ...data }
}
