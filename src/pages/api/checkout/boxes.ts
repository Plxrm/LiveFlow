import type { APIRoute } from 'astro'
import { getSupabaseAdmin } from '../../../lib/supabase/admin'

/**
 * GET /api/checkout/boxes?order_ids=id1,id2
 * Returns boxes with item names for AddressStep
 *
 * POST /api/checkout/boxes
 * Body: { order_ids: string[], boxes: Array<{ items: string[] }> }
 * Saves packing configuration — each box becomes a separate shipment.
 */

export const GET: APIRoute = async ({ request }) => {
  const supabaseAdmin = getSupabaseAdmin()
  if (!supabaseAdmin) {
    return new Response(JSON.stringify({ error: 'Service unavailable' }), { status: 503 })
  }

  try {
    const url = new URL(request.url)
    const orderIdsParam = url.searchParams.get('order_ids')
    if (!orderIdsParam) {
      return new Response(JSON.stringify({ boxes: [] }), { status: 200 })
    }

    const orderIds = orderIdsParam.split(',').filter(Boolean)
    const primaryOrderId = orderIds[0]

    const { data: boxesRaw } = await supabaseAdmin
      .from('order_boxes')
      .select('*, order_box_items(*, order_items(product_name))')
      .eq('order_id', primaryOrderId)
      .order('box_number', { ascending: true })

    const boxes = ((boxesRaw as any[]) || []).map((box: any) => ({
      box_id: box.id,
      box_number: box.box_number,
      item_names: ((box.order_box_items as any[]) || [])
        .map((bi: any) => bi.order_items?.product_name)
        .filter(Boolean),
    }))

    return new Response(
      JSON.stringify({ boxes }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    )
  } catch (err: any) {
    console.error('checkout/boxes GET error:', err)
    return new Response(JSON.stringify({ error: err.message }), { status: 500 })
  }
}

export const POST: APIRoute = async ({ request }) => {
  const supabaseAdmin = getSupabaseAdmin()
  if (!supabaseAdmin) {
    return new Response(JSON.stringify({ error: 'Service unavailable' }), { status: 503 })
  }

  try {
    const body = await request.json()
    const { order_ids, boxes } = body as {
      order_ids: string[]
      boxes: Array<{ items: Array<{ order_item_id: string; quantity: number }> }>
    }

    if (!order_ids?.length || !boxes?.length) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), { status: 400 })
    }

    const primaryOrderId = order_ids[0]

    // Delete existing boxes for this order
    const { data: existingBoxes } = await supabaseAdmin
      .from('order_boxes')
      .select('id')
      .eq('order_id', primaryOrderId)

    if (existingBoxes && (existingBoxes as any[]).length > 0) {
      const boxIds = (existingBoxes as any[]).map((b: any) => b.id)
      await supabaseAdmin.from('order_box_items').delete().in('box_id', boxIds)
      await supabaseAdmin.from('order_boxes').delete().eq('order_id', primaryOrderId)
    }

    // Insert new boxes
    const createdBoxes: any[] = []
    for (let i = 0; i < boxes.length; i++) {
      const box = boxes[i]
      const { data: newBox } = await supabaseAdmin
        .from('order_boxes')
        .insert({
          order_id: primaryOrderId,
          box_number: i + 1,
        } as any)
        .select()
        .single()

      if (newBox && box.items.length > 0) {
        const boxItemsPayload = box.items.map((item) => ({
          box_id: (newBox as any).id,
          order_item_id: item.order_item_id,
          quantity: item.quantity,
        }))
        await supabaseAdmin.from('order_box_items').insert(boxItemsPayload as any)
      }

      createdBoxes.push(newBox)
    }

    return new Response(
      JSON.stringify({ success: true, boxes: createdBoxes }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    )
  } catch (err: any) {
    console.error('checkout/boxes error:', err)
    return new Response(JSON.stringify({ error: err.message }), { status: 500 })
  }
}
