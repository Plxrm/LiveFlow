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
  // อื่นๆ
  line_channel_id: string
  line_channel_secret: string
  promptpay_number: string
  promptpay_name: string
  shipping_fee: number
  free_shipping_min: number
  auto_confirm_payment: boolean
  auto_ship_on_payment: boolean
  welcome_message: string
  cf_success_message: string
  cf_error_message: string
}

const defaultSettings: AppSettings = {
  shop_name: 'Pluem Live',
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
  promptpay_number: '',
  promptpay_name: '',
  shipping_fee: 50,
  free_shipping_min: 500,
  auto_confirm_payment: false,
  auto_ship_on_payment: false,
  welcome_message: 'ยินดีต้อนรับ! พิมพ์ CF ตามด้วยรหัสสินค้าเพื่อสั่งซื้อ',
  cf_success_message: 'สั่งซื้อสำเร็จ! กรุณาชำระเงินภายใน 24 ชม.',
  cf_error_message: 'ขออภัย ไม่พบรหัสสินค้านี้ กรุณาลองใหม่'
}

export async function getSettings(): Promise<AppSettings> {
  return defaultSettings
}

export async function updateSettings(data: Partial<AppSettings>): Promise<AppSettings> {
  return { ...defaultSettings, ...data }
}
