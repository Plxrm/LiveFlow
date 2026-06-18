import type { APIRoute } from 'astro'
import { getSupabaseAdmin } from '../../../lib/supabase/admin'
import { getSettings } from '../../../lib/api/settings'
import { createShipment } from '../../../lib/kex/client'
import type { KexConfig } from '../../../lib/kex/client'

/**
 * POST /api/checkout/complete
 * Body: { customer_id, address: { display_name, phone, address_detail,
 *   subdistrict, district, province, zipcode } }
 * Saves address → creates KEX shipments (1 per box) → returns shipment info
 */
export const POST: APIRoute = async ({ request }) => {
  const supabaseAdmin = getSupabaseAdmin()
  if (!supabaseAdmin) {
    return new Response(JSON.stringify({ error: 'Service unavailable' }), { status: 503 })
  }

  try {
    const body = await request.json()
    const { customer_id, address, order_ids } = body as {
      customer_id: string
      address: {
        display_name: string
        phone: string
        address_detail: string
        subdistrict: string
        district: string
        province: string
        zipcode: string
      }
      order_ids: string[]
    }

    if (!customer_id || !address) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), { status: 400 })
    }

    // 1. Save customer address
    await supabaseAdmin
      .from('customers')
      .update({
        display_name: address.display_name,
        phone: address.phone,
        address_detail: address.address_detail,
        subdistrict: address.subdistrict,
        district: address.district,
        province: address.province,
        zipcode: address.zipcode,
      } as any)
      .eq('id', customer_id)

    // 2. Get KEX config from settings
    const settings = await getSettings()
    const kexConfig: KexConfig = {
      appKey: (settings as any).kex_app_key || '',
      appSecret: (settings as any).kex_app_secret || '',
      saleChannel: (settings as any).kex_sale_channel || '',
    }

    const shipments: any[] = []

    // 3. For each order, check if we have boxes; if so create per-box shipments
    for (const orderId of (order_ids || [])) {
      // Get order + items
      const { data: orderRaw } = await supabaseAdmin
        .from('orders')
        .select('*, order_items(id, product_name, price, quantity)')
        .eq('id', orderId)
        .single()

      const order = orderRaw as any
      if (!order) continue

      // Get boxes for this order
      const { data: boxesRaw } = await supabaseAdmin
        .from('order_boxes')
        .select('*, order_box_items(*, order_items(product_name, price, quantity))')
        .eq('order_id', orderId)
        .order('box_number', { ascending: true })

      const boxes = (boxesRaw as any[]) || []

      // If no boxes defined, treat as single box with all items
      const shipmentGroups = boxes.length > 0
        ? boxes.map((box: any) => ({
            boxNumber: box.box_number,
            items: (box.order_box_items as any[] || []).map((bi: any) => bi.order_items).filter(Boolean),
          }))
        : [{
            boxNumber: 1,
            items: (order.order_items as any[]) || [],
          }]

      for (const group of shipmentGroups) {
        const refNo = boxes.length > 1
          ? `${order.order_number}-B${group.boxNumber}`
          : order.order_number

        const packages = group.items.length > 0
          ? group.items.map((item: any) => ({
              p_name: item.product_name,
              p_quantity: item.quantity,
              p_price: String(item.price),
            }))
          : [{ p_name: 'สินค้า', p_quantity: 1, p_price: '0' }]

        // Only create KEX shipment if config is available
        let kexResult: any = null
        if (kexConfig.appKey) {
          try {
            kexResult = await createShipment(
              {
                s_name: settings.shop_sender_name || settings.shop_name || 'LiveFlow',
                s_phone: settings.shop_phone || '0000000000',
                s_address: settings.shop_address || '',
                s_subdistrict: settings.shop_subdistrict || '',
                s_district: settings.shop_district || '',
                s_province: settings.shop_province || '',
                s_zipcode: settings.shop_zipcode || '00000',
                r_name: address.display_name || 'ลูกค้า',
                r_phone: address.phone || '',
                r_address: address.address_detail,
                r_subdistrict: address.subdistrict,
                r_district: address.district,
                r_province: address.province,
                r_zipcode: address.zipcode,
                product_description: packages.map((p: any) => p.p_name).join(', '),
                cod_amount: 0,
                ref_no: refNo,
                package: packages,
              },
              kexConfig
            )
          } catch (kexErr) {
            console.error('KEX create shipment error:', kexErr)
          }
        }

        // Save shipment record
        const { data: shipment } = await supabaseAdmin
          .from('shipments')
          .insert({
            order_id: orderId,
            carrier: 'kex',
            tracking_number: kexResult?.con_no || null,
            label_pdf_url: kexResult?.label_pdf || null,
            status: 'created' as const,
            kex_con_no: kexResult?.con_no || null,
            kex_ref_no: kexResult?.ref_no || refNo,
            kex_lh_route: kexResult?.lh_route || null,
            kex_del_route: kexResult?.del_route || null,
            kex_service_code: kexResult?.service_code || null,
            shipped_at: new Date().toISOString(),
          } as any)
          .select()
          .single()

        shipments.push({ ...shipment, box_number: group.boxNumber })
      }

      // Update order status to shipping
      await supabaseAdmin
        .from('orders')
        .update({ status: 'shipping' } as any)
        .eq('id', orderId)
    }

    // 4. Send LINE notification for tracking
    try {
      const { data: customerData } = await supabaseAdmin
        .from('customers')
        .select('line_user_id, display_name')
        .eq('id', customer_id)
        .single()

      if (customerData?.line_user_id && shipments.length > 0) {
        const { pushMessage } = await import('../../../lib/line/client')
        const { getTemplatesByStep, buildMessages } = await import('../../../lib/api/messages')

        for (const shipment of shipments) {
          const trackNo = shipment.tracking_number || shipment.kex_con_no
          if (trackNo) {
            const templates = await getTemplatesByStep('shipped')
            if (templates.length > 0) {
              const msgs = buildMessages(templates, {
                tracking_number: trackNo,
                order_number: shipment.kex_ref_no || '',
                customer_name: customerData.display_name || 'ลูกค้า',
              })
              await pushMessage(customerData.line_user_id, msgs)
            } else {
              await pushMessage(customerData.line_user_id, [{
                type: 'text',
                text: `📦 พัสดุของคุณกำลังเตรียมจัดส่ง!\n📋 เลขพัสดุ KEX: ${trackNo}\nติดตามพัสดุ: https://th.kerryexpress.com/th/track/?track=${trackNo}`
              }])
            }
          }
        }
      }
    } catch (e) {
      console.error('Ship notify error:', e)
    }

    return new Response(
      JSON.stringify({ success: true, shipments }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    )
  } catch (err: any) {
    console.error('checkout/complete error:', err)
    return new Response(JSON.stringify({ error: err.message }), { status: 500 })
  }
}
