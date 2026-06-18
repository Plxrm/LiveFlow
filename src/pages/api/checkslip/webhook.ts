import type { APIRoute } from 'astro'
import { getSupabaseAdmin } from '../../../lib/supabase/admin'
import { getSettings } from '../../../lib/api/settings'
import { verifyWebhookSignatureAsync } from '../../../lib/checkslip/client'
import { pushMessage } from '../../../lib/line/client'
import { getTemplatesByStep, buildMessages } from '../../../lib/api/messages'

/**
 * POST /api/checkslip/webhook
 * Receives payment result callbacks from Check-Slip.
 * Verifies HMAC signature, updates payment + order, notifies customer via LINE.
 */
export const POST: APIRoute = async ({ request }) => {
  const supabaseAdmin = getSupabaseAdmin()
  if (!supabaseAdmin) {
    return new Response('Service Unavailable', { status: 503 })
  }

  try {
    const rawBody = await request.text()

    // ─── Verify HMAC signature ───────────────────────────────────────────────
    const timestamp = request.headers.get('x-checkslip-timestamp') || ''
    const signature = request.headers.get('x-checkslip-signature') || ''

    const settings = await getSettings()
    const secret = settings.checkslip_webhook_secret

    if (secret) {
      const isValid = await verifyWebhookSignatureAsync(rawBody, timestamp, signature, secret)
      if (!isValid) {
        console.warn('Check-Slip webhook: invalid signature')
        return new Response(JSON.stringify({ error: 'Invalid signature' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        })
      }
    }

    // ─── Parse body ──────────────────────────────────────────────────────────
    let payload: any
    try {
      payload = JSON.parse(rawBody)
    } catch {
      return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const orderId: string = payload.orderId || payload.order_id || ''
    const isApproved: boolean =
      payload.status === 'success' || payload.data?.status === 'success'
    const verifyData = payload.data || {}

    if (!orderId) {
      return new Response(JSON.stringify({ error: 'Missing orderId' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // ─── Find payment ────────────────────────────────────────────────────────
    const { data: payment } = await supabaseAdmin
      .from('payments')
      .select('id, order_id')
      .eq('order_id', orderId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (payment) {
      const paymentUpdate: Record<string, any> = {
        checkslip_status: isApproved ? 'verified' : 'failed',
        checkslip_data: JSON.stringify(verifyData),
        verify_method: 'auto',
        transfer_amount: verifyData.transfer_amount ?? null,
        diff_amount: verifyData.diff_amount ?? null,
        sender_name: verifyData.sender_name ?? null,
        sender_bank: verifyData.sender_bank ?? null,
      }

      if (isApproved) {
        paymentUpdate.status = 'confirmed'
        paymentUpdate.confirmed_at = new Date().toISOString()
      } else {
        paymentUpdate.status = 'rejected'
      }

      await supabaseAdmin
        .from('payments')
        .update(paymentUpdate as any)
        .eq('id', payment.id)
    }

    // ─── Update order ────────────────────────────────────────────────────────
    const { data: order } = await supabaseAdmin
      .from('orders')
      .select('*, customers(line_user_id, display_name)')
      .eq('id', orderId)
      .single()

    if (order) {
      if (isApproved) {
        await supabaseAdmin
          .from('orders')
          .update({ status: 'paid' })
          .eq('id', orderId)
      }

      // ─── Notify customer via LINE ──────────────────────────────────────────
      const lineId = (order as any).customers?.line_user_id
      if (lineId) {
        try {
          if (isApproved) {
            const tpls = await getTemplatesByStep('payment_confirmed')
            if (tpls.length > 0) {
              const msgs = buildMessages(tpls, {
                order_number: order.order_number,
                amount: String(order.total),
              })
              await pushMessage(lineId, msgs)
            } else {
              await pushMessage(lineId, [
                {
                  type: 'text',
                  text:
                    `✅ ยืนยันการชำระเงินแล้ว!\n` +
                    `📋 ออเดอร์: ${order.order_number}\n` +
                    `💰 ยอด: ฿${Number(order.total).toLocaleString()}\n` +
                    `ขอบคุณที่ซื้อสินค้านะคะ 🙏`,
                },
              ])
            }
          } else {
            await pushMessage(lineId, [
              {
                type: 'text',
                text:
                  `❌ ตรวจสอบสลิปไม่ผ่าน\n` +
                  `📋 ออเดอร์: ${order.order_number}\n` +
                  `${verifyData.message || 'กรุณาส่งสลิปใหม่หรือติดต่อแอดมิน'}`,
              },
            ])
          }
        } catch (notifyErr) {
          console.error('LINE notify error (webhook):', notifyErr)
        }
      }
    }

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error: any) {
    console.error('checkslip/webhook error:', error)
    return new Response(
      JSON.stringify({ ok: false, error: error?.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}
