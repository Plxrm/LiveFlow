import type { APIRoute } from 'astro'
import { verifySlip } from '../../../lib/checkslip/client'
import { getSupabaseAdmin } from '../../../lib/supabase/admin'

/**
 * POST /api/checkslip/verify
 * FormData: { file: File, orderId: string, amount: number }
 * Verifies a payment slip via Check-Slip API and records the result.
 */
export const POST: APIRoute = async ({ request }) => {
  const supabaseAdmin = getSupabaseAdmin()
  if (!supabaseAdmin) {
    return new Response(
      JSON.stringify({ success: false, error: 'Supabase not configured' }),
      { status: 503, headers: { 'Content-Type': 'application/json' } }
    )
  }

  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const orderId = formData.get('orderId') as string | null
    const amount = Number(formData.get('amount') || 0)

    if (!file || !orderId) {
      return new Response(
        JSON.stringify({ success: false, error: 'ต้องระบุ file และ orderId' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Call Check-Slip API
    const result = await verifySlip(file, amount, orderId)

    // Find the payment record for this order
    const { data: payment } = await supabaseAdmin
      .from('payments')
      .select('id')
      .eq('order_id', orderId)
      .in('status', ['pending'])
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (payment) {
      // Update payment with verify result
      const updateData: Record<string, any> = {
        verify_method: 'auto',
        checkslip_status: result.success ? 'verified' : 'failed',
        checkslip_data: result.data ? JSON.stringify(result.data) : null,
      }

      if (result.data) {
        updateData.transfer_amount = result.data.transfer_amount
        updateData.diff_amount = result.data.diff_amount
        updateData.sender_name = result.data.sender_name
        updateData.sender_bank = result.data.sender_bank
      }

      // Auto-confirm if verified
      if (result.success && result.data?.status === 'success') {
        updateData.status = 'confirmed'
        updateData.confirmed_at = new Date().toISOString()

        // Update order status to paid
        await supabaseAdmin
          .from('orders')
          .update({ status: 'paid' })
          .eq('id', orderId)
      }

      await supabaseAdmin
        .from('payments')
        .update(updateData as any)
        .eq('id', payment.id)
    }

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error: any) {
    console.error('checkslip/verify error:', error)
    return new Response(
      JSON.stringify({ success: false, error: error?.message || 'Unknown error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}
