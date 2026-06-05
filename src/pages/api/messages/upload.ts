import type { APIRoute } from 'astro'
import { supabaseAdmin } from '../../../../lib/supabase/admin'

export const POST: APIRoute = async ({ request }) => {
  if (!supabaseAdmin) {
    return new Response(JSON.stringify({ error: 'Supabase not configured' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return new Response(JSON.stringify({ error: 'No file provided' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      return new Response(
        JSON.stringify({ error: 'Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Validate file size (5MB max)
    const MAX_SIZE = 5 * 1024 * 1024
    if (file.size > MAX_SIZE) {
      return new Response(
        JSON.stringify({ error: 'File too large. Maximum size is 5MB.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const ext = file.name.split('.').pop() || 'jpg'
    const fileName = `msg-${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

    const arrayBuffer = await file.arrayBuffer()
    const buffer = new Uint8Array(arrayBuffer)

    const { error: uploadError } = await supabaseAdmin.storage
      .from('messages')
      .upload(fileName, buffer, {
        contentType: file.type,
        upsert: false,
      })

    if (uploadError) {
      console.error('Upload error:', uploadError)
      return new Response(
        JSON.stringify({ error: 'Failed to upload image: ' + uploadError.message }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const { data: publicUrlData } = supabaseAdmin.storage
      .from('messages')
      .getPublicUrl(fileName)

    return new Response(JSON.stringify({ url: publicUrlData.publicUrl }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error: any) {
    console.error('Upload endpoint error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}
