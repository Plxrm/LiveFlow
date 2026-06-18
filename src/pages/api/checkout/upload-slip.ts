import type { APIRoute } from 'astro'
import { getSupabaseAdmin } from '../../../lib/supabase/admin'

/**
 * POST /api/checkout/upload-slip
 * FormData: { file: File }
 * Uploads slip image to Supabase Storage and returns public URL.
 */
export const POST: APIRoute = async ({ request }) => {
  const supabaseAdmin = getSupabaseAdmin()
  if (!supabaseAdmin) {
    return new Response(JSON.stringify({ error: 'Service unavailable' }), { status: 503 })
  }

  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return new Response(JSON.stringify({ error: 'No file provided' }), { status: 400 })
    }

    const ext = file.name.split('.').pop() || 'jpg'
    const fileName = `slip-${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

    const arrayBuffer = await file.arrayBuffer()
    const buffer = new Uint8Array(arrayBuffer)

    const { error: uploadError } = await supabaseAdmin.storage
      .from('slips')
      .upload(fileName, buffer, {
        contentType: file.type || 'image/jpeg',
        upsert: false,
      })

    if (uploadError) {
      console.error('Upload error:', uploadError)
      return new Response(JSON.stringify({ error: 'Upload failed: ' + uploadError.message }), { status: 500 })
    }

    const { data: urlData } = supabaseAdmin.storage.from('slips').getPublicUrl(fileName)
    const url = urlData.publicUrl

    return new Response(JSON.stringify({ url, fileName }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (err: any) {
    console.error('upload-slip error:', err)
    return new Response(JSON.stringify({ error: err.message }), { status: 500 })
  }
}
