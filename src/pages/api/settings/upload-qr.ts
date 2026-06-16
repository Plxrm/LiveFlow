import type { APIRoute } from 'astro'
import { getSupabaseAdmin } from '../../../lib/supabase/admin'

export const POST: APIRoute = async ({ request }) => {
  try {
    const supabase = getSupabaseAdmin()
    if (!supabase) {
      return new Response(JSON.stringify({ error: 'Supabase not configured' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return new Response(JSON.stringify({ error: 'No file provided' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    const ext = file.name.split('.').pop() || 'jpg'
    const fileName = `qr-${Date.now()}.${ext}`

    const arrayBuffer = await file.arrayBuffer()
    const buffer = new Uint8Array(arrayBuffer)

    const { error: uploadError } = await supabase.storage
      .from('payment')
      .upload(fileName, buffer, {
        contentType: file.type || 'image/jpeg',
        upsert: true
      })

    if (uploadError) {
      console.error('QR upload error:', uploadError)
      return new Response(JSON.stringify({ error: uploadError.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    const { data: publicUrlData } = supabase.storage
      .from('payment')
      .getPublicUrl(fileName)

    return new Response(JSON.stringify({ url: publicUrlData.publicUrl }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })
  } catch (error: any) {
    console.error('upload-qr error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}
