import { getSupabaseAdmin } from '../supabase/admin'
const supabaseAdmin = getSupabaseAdmin()
import { createShipment, trackShipment, cancelShipment } from '../kex/client'
import { pushMessage } from '../line/client'
import { getSettings } from './settings'
import { getTemplatesByStep, buildMessages } from './messages'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ShopShippingInfo {
  shop_name: string
  shop_phone: string
  shop_address: string
  shop_subdistrict: string
  shop_district: string
  shop_province: string
  shop_zipcode: string
}

// ─── ดึงข้อมูลร้านค้า (ผู้ส่ง) ───────────────────────────────────────────────

async function getShopShippingInfo(): Promise<ShopShippingInfo> {
  const settings = await getSettings()
  return {
    shop_name: settings.shop_sender_name || settings.shop_name || 'LiveFlow',
    shop_phone: settings.shop_phone || '0000000000',
    shop_address: settings.shop_address || '',
    shop_subdistrict: settings.shop_subdistrict || '',
    shop_district: settings.shop_district || '',
    shop_province: settings.shop_province || '',
    shop_zipcode: settings.shop_zipcode || '00000'
  }
}

// ─── เช็คว่าลูกค้ามีที่อยู่ครบ ────────────────────────────────────────────────

export function hasCompleteAddress(customer: {
  address?: string | null
  address_detail?: string | null
  zipcode?: string | null
}): boolean {
  return !!((customer.address || customer.address_detail) && customer.zipcode)
}

// ─── 1. สร้าง Shipment อัตโนมัติ ─────────────────────────────────────────────

export async function createOrderShipment(orderId: string) {
  if (!supabaseAdmin) return null

  // ดึง order + customer + order_items
  const { data: orderRaw } = await supabaseAdmin
    .from('orders')
    .select(`
      *,
      customers(*),
      order_items(*, products:product_id(*))
    `)
    .eq('id', orderId)
    .single()

  const order = orderRaw as any
  if (!order) return null
  const customer = order.customers as any
  if (!customer) return null

  // เช็คว่าลูกค้ามีที่อยู่ครบ
  if (!customer.address && !customer.address_detail) {
    return { error: 'ลูกค้ายังไม่ได้กรอกที่อยู่' }
  }

  // ดึงข้อมูลร้านค้า (ผู้ส่ง)
  const shopInfo = await getShopShippingInfo()

  // เช็ค KEX env
  const appKey = import.meta.env.KEX_APP_KEY
  if (!appKey) {
    return { error: 'KEX API ยังไม่ได้ตั้งค่า' }
  }

  // เช็คเบอร์โทรลูกค้า format 10 หลัก
  let phone = customer.phone || ''
  phone = phone.replace(/[^0-9]/g, '')
  if (phone.length !== 10 && phone.length !== 9) {
    return { error: `เบอร์โทรลูกค้าไม่ถูกต้อง: ${phone}` }
  }

  // เช็ค zipcode 5 หลัก
  const zipcode = customer.zipcode || ''
  if (zipcode.length !== 5) {
    return { error: `รหัสไปรษณีย์ไม่ถูกต้อง: ${zipcode}` }
  }

  // สร้าง package info จาก order_items
  const items = order.order_items as any[]
  const packages = items.map((item) => ({
    p_name: item.product_name as string,
    p_quantity: item.quantity as number,
    p_price: String(item.price)
  }))

  // เรียก KEX API สร้าง shipment
  const result = await createShipment({
    s_name: shopInfo.shop_name,
    s_phone: shopInfo.shop_phone,
    s_address: shopInfo.shop_address,
    s_subdistrict: shopInfo.shop_subdistrict,
    s_district: shopInfo.shop_district,
    s_province: shopInfo.shop_province,
    s_zipcode: shopInfo.shop_zipcode,
    r_name: (customer.display_name as string) || 'ลูกค้า',
    r_phone: (customer.phone as string) || '',
    r_address: (customer.address_detail as string) || (customer.address as string) || '',
    r_subdistrict: (customer.subdistrict as string) || '',
    r_district: (customer.district as string) || '',
    r_province: (customer.province as string) || '',
    r_zipcode: (customer.zipcode as string) || '',
    product_description: items.map((i) => i.product_name as string).join(', '),
    cod_amount: 0,
    ref_no: order.order_number,
    package: packages
  })

  if (!result) {
    return { error: 'ไม่สามารถสร้างพัสดุได้' }
  }

  // บันทึกลง shipments table
  const { data: shipment } = await supabaseAdmin
    .from('shipments')
    .insert({
      order_id: orderId,
      carrier: 'kex',
      tracking_number: result.con_no,
      label_pdf_url: result.label_pdf,
      status: 'created' as const,
      kex_con_no: result.con_no,
      kex_ref_no: result.ref_no,
      kex_lh_route: result.lh_route,
      kex_del_route: result.del_route,
      kex_service_code: result.service_code,
      shipped_at: new Date().toISOString()
    } as any)
    .select()
    .single()

  // อัปเดต order status → shipping
  await supabaseAdmin
    .from('orders')
    .update({ status: 'shipping' } as any)
    .eq('id', orderId)

  // ส่ง tracking number ให้ลูกค้าทาง LINE
  if (customer.line_user_id) {
    const shippedTpls = await getTemplatesByStep('shipped')
    const shippedMsgs = shippedTpls.length > 0
      ? buildMessages(shippedTpls, {
          tracking_number: result.con_no || '',
          order_number: order.order_number || '',
          customer_name: (customer.display_name as string) || 'ลูกค้า',
        })
      : [
          {
            type: 'text',
            text:
              `📦 พัสดุของคุณถูกจัดส่งแล้ว!\n\n` +
              `🚚 ขนส่ง: KEX Express\n` +
              `📋 เลขพัสดุ: ${result.con_no}\n` +
              `📄 ออเดอร์: ${order.order_number}\n\n` +
              `ติดตามพัสดุ: https://th.kerryexpress.com/th/track/?track=${result.con_no}`
          }
        ]
    await pushMessage(customer.line_user_id as string, shippedMsgs)
  }

  return shipment
}

// ─── 2. ติดตามสถานะพัสดุ ─────────────────────────────────────────────────────

export async function updateShipmentStatus(shipmentId: string) {
  if (!supabaseAdmin) return null

  const { data: shipmentRaw } = await supabaseAdmin
    .from('shipments')
    .select('*')
    .eq('id', shipmentId)
    .single()

  const shipment = shipmentRaw as any
  if (!shipment?.tracking_number) return null

  const results = await trackShipment([shipment.tracking_number])
  if (results.length === 0) return null

  const latest = results[0]

  // map KEX status → system status
  const statusMap: Record<string, string> = {
    'Pending pickup': 'created',
    'Your parcel has been picked up': 'picked_up',
    'Your parcel is in transit': 'in_transit',
    'Arrived at Origin station': 'in_transit',
    'Departed from Origin station': 'in_transit',
    'Arrived at Hub / Transit station': 'in_transit',
    'Arrived at Distribution center': 'in_transit',
    'Departed from Distribution center': 'in_transit',
    'Arrived at the destination station': 'in_transit',
    'Out for delivery': 'out_for_delivery',
    'Our courier is delivering your parcel': 'out_for_delivery',
    'Successfully Delivered': 'delivered',
    'Delivery Unsuccessful': 'failed',
    'Your parcel has been returned': 'returned'
  }

  type ShipmentStatus = 'created' | 'picked_up' | 'in_transit' | 'out_for_delivery' | 'delivered' | 'failed' | 'returned' | 'cancelled'
  const newStatus = (statusMap[latest.statusDesc] || shipment.status) as ShipmentStatus

  const updateData = {
    kex_status_desc: latest.statusDesc,
    status: newStatus,
    ...(newStatus === 'delivered' ? { delivered_at: latest.statusDatetime } : {})
  }

  await supabaseAdmin
    .from('shipments')
    .update(updateData as any)
    .eq('id', shipmentId)

  // ถ้าส่งสำเร็จ → อัปเดต order status = completed
  if (newStatus === 'delivered') {
    const { data: sRaw } = await supabaseAdmin
      .from('shipments')
      .select('order_id')
      .eq('id', shipmentId)
      .single()
    const s = sRaw as any
    if (s) {
      await supabaseAdmin
        .from('orders')
        .update({ status: 'completed' } as any)
        .eq('id', s.order_id)
    }
  }

  return { status: newStatus, desc: latest.statusDesc }
}

// ─── 3. ยกเลิกพัสดุ ──────────────────────────────────────────────────────────

export async function cancelOrderShipment(shipmentId: string): Promise<boolean> {
  if (!supabaseAdmin) return false

  const { data: shipmentRaw2 } = await supabaseAdmin
    .from('shipments')
    .select('kex_con_no')
    .eq('id', shipmentId)
    .single()

  const shipment2 = shipmentRaw2 as any
  if (!shipment2?.kex_con_no) return false

  const success = await cancelShipment(shipment2.kex_con_no)

  if (success) {
    await supabaseAdmin
      .from('shipments')
      .update({ status: 'cancelled' } as any)
      .eq('id', shipmentId)
  }

  return success
}

// ─── 4. ดึง Shipments ของ Order ──────────────────────────────────────────────

export async function getOrderShipments(orderId: string) {
  if (!supabaseAdmin) return []
  const { data } = await supabaseAdmin
    .from('shipments')
    .select('*')
    .eq('order_id', orderId)
    .order('created_at', { ascending: false })
  return data || []
}
