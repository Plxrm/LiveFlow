import type { APIRoute } from 'astro'
import { getSupabaseAdmin } from '../../../lib/supabase/admin'
import { getSettings } from '../../../lib/api/settings'
import { verifySlip } from '../../../lib/checkslip/client'

/**
 * POST /api/checkout/submit-slip
 * Body JSON: { slip_url, slip_file_name, amount, customer_id, order_ids: string[] }
 *
 * - If slip_verify_method = 'auto': uploads blob from storage → Check-Slip API → returns result
 * - If slip_verify_method = 'manual': creates payment records with status 'pending' → admin confirms
 */
export const POST: APIRoute = async ({ request }) => {
  const supabaseAdmin = getSupabaseAdmin()
  if (!supabaseAdmin) {
    return new Response(JSON.stringify({ error: 'Service unavailable' }), { status: 503 })
  }

  try {
    const body = await request.json()
    const { slip_url, slip_file_name, amount, customer_id, order_ids } = body as {
      slip_url: string
      slip_file_name: string
      amount: number
      customer_id: string
      order_ids: string[]
    }

    if (!slip_url || !order_ids?.length) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), { status: 400 })
    }

    const settings = await getSettings()
    const primaryOrderId = order_ids[0]

    // ─── Create payment records for all orders ────────────────────────────
    const paymentRecords = order_ids.map((orderId) => ({
      order_id: orderId,
      method: 'transfer' as const,
      slip_url,
      amount,
      status: 'pending' as const,
      verify_method: settings.slip_verify_method === 'auto' ? 'auto' : 'manual',
    }))

    const { data: payments, error: insertError } = await supabaseAdmin
      .from('payments')
      .insert(paymentRecords as any)
      .select()

    if (insertError) {
      console.error('Payment insert error:', insertError)
      return new Response(JSON.stringify({ error: 'Failed to create payment records' }), { status: 500 })
    }

    // Update orders to 'confirmed'
    await supabaseAdmin
      .from('orders')
      .update({ status: 'confirmed' } as any)
      .in('id', order_ids)

    // ─── Manual mode: return pending ─────────────────────────────────────
    if (settings.slip_verify_method !== 'auto') {
      return new Response(
        JSON.stringify({
          method: 'manual',
          status: 'pending',
          message: 'ส่งสลิปสำเร็จ รอ admin ตรวจสอบ',
          payment_ids: (payments as any[])?.map((p: any) => p.id) || [],
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // ─── Auto mode: call Check-Slip API ──────────────────────────────────
    // Download the slip file from Supabase Storage to send to Check-Slip
    const { data: fileData, error: downloadError } = await supabaseAdmin.storage
      .from('slips')
      .download(slip_file_name)

    if (downloadError || !fileData) {
      // Fallback: return manual-pending if we can't download the file
      console.error('Failed to download slip for verification:', downloadError)
      return new Response(
        JSON.stringify({
          method: 'manual',
          status: 'pending',
          message: 'ส่งสลิปสำเร็จ รอ admin ตรวจสอบ (auto verify unavailable)',
          payment_ids: (payments as any[])?.map((p: any) => p.id) || [],
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const verifyResult = await verifySlip(fileData, amount, primaryOrderId)

    // Update payment record with verify result
    if (payments && (payments as any[]).length > 0) {
      const primaryPaymentId = (payments as any[])[0].id
      const updateData: Record<string, any> = {
        checkslip_status: verifyResult.success ? 'verified' : 'failed',
        checkslip_data: verifyResult.data ? JSON.stringify(verifyResult.data) : null,
      }
      if (verifyResult.success && verifyResult.data) {
        updateData.transfer_amount = verifyResult.data.transfer_amount
        updateData.diff_amount = verifyResult.data.diff_amount
        updateData.sender_name = verifyResult.data.sender_name
        updateData.sender_bank = verifyResult.data.sender_bank
      }
      if (verifyResult.success) {
        updateData.status = 'confirmed'
        updateData.confirmed_at = new Date().toISOString()
        // Mark all orders as paid
        await supabaseAdmin
          .from('orders')
          .update({ status: 'paid' } as any)
          .in('id', order_ids)
      }
      await supabaseAdmin
        .from('payments')
        .update(updateData as any)
        .eq('id', primaryPaymentId)
    }

    return new Response(
      JSON.stringify({
        method: 'auto',
        ...verifyResult,
        payment_ids: (payments as any[])?.map((p: any) => p.id) || [],
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    )
  } catch (err: any) {
    console.error('submit-slip error:', err)
    return new Response(JSON.stringify({ error: err.message }), { status: 500 })
  }
}
