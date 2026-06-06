import { getSupabaseAdmin } from '../supabase/admin'
const supabaseAdmin = getSupabaseAdmin()
import { parseCFMessage } from './cf-parser'
import { replyMessage, pushMessage, getProfile, getMessageContent } from './client'
import { generateOrderNumber } from '../api/orders'
import { getSettings } from '../api/settings'
import { createOrderShipment, hasCompleteAddress } from '../api/shipping'
import { getTemplatesByStep, buildMessages } from '../api/messages'


export async function handleLineWebhook(body: any) {
  if (!supabaseAdmin) return

  const events = body.events || []
  const settings = await getSettings()

  for (const event of events) {
    if (event.type !== 'message') continue

    const userId = event.source.userId
    const replyToken = event.replyToken

    // -- Handle Image Upload (Slip) --
    if (event.message.type === 'image') {
      const customer = await findOrCreateCustomer(userId)
      if (!customer) continue

      const { data: order } = await supabaseAdmin.from('orders')
        .select('*')
        .eq('customer_id', customer.id)
        .in('status', ['pending', 'confirmed'])
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (!order) {
        const noOrderTpls = await getTemplatesByStep('slip_no_order')
        const noOrderMsgs = noOrderTpls.length > 0
          ? buildMessages(noOrderTpls, {})
          : [{ type: 'text', text: 'ไม่พบออเดอร์ที่รอชำระเงิน' }]
        await replyMessage(replyToken, noOrderMsgs)
        continue
      }

      const buffer = await getMessageContent(event.message.id)
      if (!buffer) {
         await replyMessage(replyToken, [{ type: 'text', text: 'ไม่สามารถดึงรูปสลิปได้' }])
         continue
      }
      
      const fileName = `${order.id}-${Date.now()}.jpg`
      const { error: uploadError } = await supabaseAdmin.storage
        .from('slips')
        .upload(fileName, buffer, { contentType: 'image/jpeg' })

      if (uploadError) {
        console.error('Upload Error:', uploadError)
        await replyMessage(replyToken, [{ type: 'text', text: 'อัปโหลดสลิปไม่สำเร็จ กรุณาลองใหม่' }])
        continue
      }
      
      const { data: publicUrlData } = supabaseAdmin.storage.from('slips').getPublicUrl(fileName)
      const slipUrl = publicUrlData.publicUrl

      await supabaseAdmin.from('payments').insert([{
        order_id: order.id,
        method: 'transfer',
        amount: order.total,
        slip_url: slipUrl,
        status: 'pending'
      }])

      await supabaseAdmin.from('orders').update({ status: 'confirmed' }).eq('id', order.id)

      const slipTpls = await getTemplatesByStep('slip_received')
      const slipMsgs = slipTpls.length > 0
        ? buildMessages(slipTpls, {
            order_number: order.order_number || '',
            amount: String(order.total || ''),
          })
        : [{ type: 'text', text: 'ได้รับสลิปแล้ว รอแอดมินตรวจสอบ' }]
      await replyMessage(replyToken, slipMsgs)

      // ─── Auto-ship trigger (ถ้า auto_confirm + auto_ship เปิดอยู่) ───
      if (settings.auto_confirm_payment && settings.auto_ship_on_payment) {
        // ยืนยัน payment ทันที
        await supabaseAdmin
          .from('payments')
          .update({ status: 'confirmed', confirmed_at: new Date().toISOString() })
          .eq('order_id', order.id)
          .eq('status', 'pending')
        await supabaseAdmin.from('orders').update({ status: 'paid' }).eq('id', order.id)

        const { data: customerData } = await supabaseAdmin
          .from('customers').select('*').eq('id', order.customer_id).single()

        if (customerData && hasCompleteAddress(customerData)) {
          await createOrderShipment(order.id)
        } else if (customerData?.line_user_id) {
          const checkoutUrl = import.meta.env.PUBLIC_CHECKOUT_URL || ''
          await pushMessage(customerData.line_user_id, [{
            type: 'text',
            text:
              `✅ ยืนยันการชำระเงินแล้ว!\n\n` +
              `กรุณากรอกที่อยู่จัดส่งเพื่อให้ระบบจัดส่งพัสดุให้คุณ:\n` +
              `${checkoutUrl}?order=${order.id}`
          }])
        }
      }

      continue
    }

    // -- Handle Text Message (CF) --
    if (event.message.type === 'text') {
      const text = event.message.text
      const parsed = parseCFMessage(text)

      if (!parsed) continue

      const customer = await findOrCreateCustomer(userId)
      if (!customer) continue

      const liveSession = await getActiveLiveSession()
      if (!liveSession) {
        const noLiveTpls = await getTemplatesByStep('cf_no_live')
        const noLiveMsgs = noLiveTpls.length > 0
          ? buildMessages(noLiveTpls, {})
          : [{ type: 'text', text: 'ขออภัย ตอนนี้ยังไม่มีไลฟ์เปิดขาย' }]
        await replyMessage(replyToken, noLiveMsgs)
        await logCF(userId, text, parsed.cf_code, null, false, 'no_active_session')
        continue
      }

      let liveProduct: any = null
      let availableKey: any = null

      // ค้นหา product_key ที่ key_code ตรงกับ parsed.cf_code (case insensitive)
      const { data: keys } = await supabaseAdmin
        .from('product_keys')
        .select('*, products(*)')
        .ilike('key_code', parsed.cf_code)
        .eq('status', 'available')
        .limit(10) // fetch เผื่อเช็คว่า product อยู่ใน live นี้ไหม

      if (keys && keys.length > 0) {
        // หา key ที่ product ของมันอยู่ใน live session นี้
        for (const k of keys) {
          const { data: lp } = await supabaseAdmin
            .from('live_products')
            .select('*')
            .eq('live_session_id', liveSession.id)
            .eq('product_id', k.product_id)
            .maybeSingle()
          
          if (lp) {
            liveProduct = { ...lp, products: k.products }
            availableKey = k
            break
          }
        }
      }

      // ถ้าไม่เจอ key ลองหาจาก live_products.cf_code (backward compatible)
      if (!liveProduct) {
        liveProduct = await findLiveProduct(liveSession.id, parsed.cf_code)
        if (!liveProduct) {
          const notFoundTpls = await getTemplatesByStep('cf_not_found')
          const notFoundMsgs = notFoundTpls.length > 0
            ? buildMessages(notFoundTpls, { cf_code: parsed.cf_code })
            : [{ type: 'text', text: settings.cf_error_message || `ไม่พบรหัส ${parsed.cf_code} ในไลฟ์นี้` }]
          await replyMessage(replyToken, notFoundMsgs)
          await logCF(userId, text, parsed.cf_code, liveSession.id, false, 'product_not_found')
          continue
        }
        
        // ถ้าหาเจอแต่ liveProduct, ให้ลองหา availableKey อันไหนก็ได้ของสินค้านั้น
        const { data: firstKey } = await supabaseAdmin
          .from('product_keys')
          .select('*, products(*)')
          .eq('product_id', liveProduct.products.id)
          .eq('status', 'available')
          .order('key_code', { ascending: true })
          .limit(1)
          .maybeSingle()
        if (firstKey) availableKey = firstKey
      }

      if (!availableKey && liveProduct.products.stock < 1) {
        const outOfStockTpls = await getTemplatesByStep('cf_out_of_stock')
        const outOfStockMsgs = outOfStockTpls.length > 0
          ? buildMessages(outOfStockTpls, {
              product_name: liveProduct.products.name,
              quantity: String(liveProduct.products.stock),
            })
          : [{ type: 'text', text: `ขออภัย ${liveProduct.products.name} สินค้าหมดแล้ว` }]
        await replyMessage(replyToken, outOfStockMsgs)
        await logCF(userId, text, parsed.cf_code, liveSession.id, false, 'out_of_stock')
        continue
      }

      // ดึง free_shipping + shipping_fee จาก product (shipping_fee เก็บใน products.price)
      const productFreeShipping = (liveProduct.products as any).free_shipping === true
      const productShippingFee  = (liveProduct.products as any).price ?? 0
      const shippingFee = productFreeShipping ? 0 : productShippingFee

      // ใช้ราคาจาก key ถ้ามี ไม่งั้น fallback to live_price
      const keyPrice = availableKey
        ? (availableKey.price ?? (liveProduct.live_price || liveProduct.products.price))
        : (liveProduct.live_price || liveProduct.products.price)
      const price = keyPrice

      const orderNumber = await generateOrderNumber()
      const total = price + shippingFee

      const { data: order, error: orderError } = await supabaseAdmin.from('orders').insert([{
        order_number: orderNumber,
        customer_id: customer.id,
        live_session_id: liveSession.id,
        status: 'pending',
        total: total,
        shipping_fee: shippingFee
      }]).select().single()

      if (orderError || !order) {
        console.error('Failed to create order', orderError)
        continue
      }

      await supabaseAdmin.from('order_items').insert([{
        order_id: order.id,
        product_id: liveProduct.products.id,
        product_name: liveProduct.products.name,
        price: price,
        quantity: 1
      }])

      if (!availableKey) {
        // ถ้า keys ไม่พอ (fallback: ใช้ stock ปกติ)
        await supabaseAdmin.from('products').update({
          stock: Math.max(0, liveProduct.products.stock - 1)
        }).eq('id', liveProduct.products.id)
      } else {
        await supabaseAdmin
          .from('product_keys')
          .update({ status: 'reserved', order_id: order.id })
          .eq('id', availableKey.id)
        
        // อัปเดต stock จาก available keys ที่เหลือ
        const { count } = await supabaseAdmin
          .from('product_keys')
          .select('*', { count: 'exact', head: true })
          .eq('product_id', liveProduct.products.id)
          .eq('status', 'available')
        await supabaseAdmin
          .from('products')
          .update({ stock: count || 0 })
          .eq('id', liveProduct.products.id)
      }

      // ชื่อ key ที่ reserve ได้
      const reservedKeyCode = availableKey ? availableKey.key_code : null

      const shippingText = productFreeShipping ? 'ฟรี!' : `฿${shippingFee}`

      // ─── ส่งข้อความ CF สำเร็จ ─────────────────────────────────────────────
      const cfSuccessTpls = await getTemplatesByStep('cf_success')
      let replyMessages: any[]

      if (cfSuccessTpls.length > 0) {
        replyMessages = buildMessages(cfSuccessTpls, {
          product_name: liveProduct.products.name + (reservedKeyCode ? ` — ${reservedKeyCode}` : ''),
          quantity: '1',
          price: price.toLocaleString(),
          total: total.toLocaleString(),
          order_number: orderNumber,
          shipping_text: shippingText,
          customer_name: customer.display_name || 'ลูกค้า',
          cf_code: parsed.cf_code,
        })
      } else {
        // Fallback: hardcoded text + PromptPay QR
        const shippingLine = productFreeShipping
          ? '🚚 ค่าส่ง: ฟรี!'
          : `🚚 ค่าส่ง: ฿${shippingFee}`

        replyMessages = [
          {
            type: 'text',
            text: (settings.cf_success_message || `✅ สั่งซื้อสำเร็จ!`) + `\n` +
              `📦 ${liveProduct.products.name}${reservedKeyCode ? ` — ${reservedKeyCode}` : ''} — ฿${price.toLocaleString()}\n` +
              `${shippingLine}\n` +
              `💰 รวม: ฿${total.toLocaleString()}\n` +
              `📋 เลขออเดอร์: ${orderNumber}\n`
          }
        ]

        if (settings.promptpay_number) {
          replyMessages.push({
            type: 'flex',
            altText: 'สแกนจ่ายเงิน',
            contents: {
              type: 'bubble',
              body: {
                type: 'box',
                layout: 'vertical',
                contents: [
                  { type: 'text', text: 'สแกนจ่ายเงิน', weight: 'bold', size: 'lg' },
                  { type: 'image', url: `https://promptpay.io/${settings.promptpay_number}/${total}.png`, size: 'full', aspectRatio: '1:1' },
                  { type: 'text', text: `฿${total.toLocaleString()}`, weight: 'bold', size: 'xl', align: 'center' },
                  { type: 'text', text: `ออเดอร์: ${orderNumber}`, size: 'sm', color: '#888888', align: 'center' }
                ]
              }
            }
          })
        }
      }


      await replyMessage(replyToken, replyMessages)
      await logCF(userId, text, parsed.cf_code, liveSession.id, true, null)
    }
  }
}

// Helper functions
async function findOrCreateCustomer(lineUserId: string) {
  if (!supabaseAdmin) return null
  const { data } = await supabaseAdmin.from('customers').select('*').eq('line_user_id', lineUserId).single()
  if (data) return data
  
  let displayName = 'ลูกค้า (LINE)'
  const profile = await getProfile(lineUserId)
  if (profile && profile.displayName) {
    displayName = profile.displayName
  }

  const { data: newCustomer } = await supabaseAdmin.from('customers').insert([{
    line_user_id: lineUserId,
    display_name: displayName
  }]).select().single()
  
  return newCustomer
}

async function getActiveLiveSession() {
  if (!supabaseAdmin) return null
  const { data } = await supabaseAdmin.from('live_sessions').select('*').eq('status', 'live').limit(1).maybeSingle()
  return data
}

async function findLiveProduct(sessionId: string, cfCode: string) {
  if (!supabaseAdmin) return null
  const { data } = await supabaseAdmin.from('live_products')
    .select('*, products(*)')
    .eq('live_session_id', sessionId)
    .ilike('cf_code', cfCode)
    .single()
  return data
}

async function logCF(userId: string, raw: string, cfCode: string, sessionId: string | null, isValid: boolean, error: string | null) {
  if (!supabaseAdmin) return null
  await supabaseAdmin.from('cf_logs').insert([{
    line_user_id: userId,
    raw_message: raw,
    parsed_cf_code: cfCode,
    live_session_id: sessionId,
    is_valid: isValid,
    error_reason: error
  }])
}

// ─── Product Key Lifecycle (called from admin order status changes) ──────────

/** เมื่อ order completed: reserved → sold */
export async function markOrderKeysSold(orderId: string) {
  if (!supabaseAdmin) return
  await supabaseAdmin
    .from('product_keys')
    .update({ status: 'sold', sold_at: new Date().toISOString() })
    .eq('order_id', orderId)
    .eq('status', 'reserved')
}

/** เมื่อ order cancelled: reserved → available */
export async function releaseOrderKeys(orderId: string) {
  if (!supabaseAdmin) return
  // ดึง product_ids ก่อนเพื่ออัปเดต stock
  const { data: keys } = await supabaseAdmin
    .from('product_keys')
    .select('product_id')
    .eq('order_id', orderId)
    .eq('status', 'reserved')

  await supabaseAdmin
    .from('product_keys')
    .update({ status: 'available', order_id: null })
    .eq('order_id', orderId)
    .eq('status', 'reserved')

  // อัปเดต stock ของทุก product ที่เกี่ยวข้อง
  const productIds = [...new Set(keys?.map(k => k.product_id) || [])]
  for (const pid of productIds) {
    const { count } = await supabaseAdmin
      .from('product_keys')
      .select('*', { count: 'exact', head: true })
      .eq('product_id', pid)
      .eq('status', 'available')
    await supabaseAdmin
      .from('products')
      .update({ stock: count || 0 })
      .eq('id', pid)
  }
}
