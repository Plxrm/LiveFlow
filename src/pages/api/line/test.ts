import type { APIRoute } from 'astro'

export const POST: APIRoute = async ({ request }) => {
  try {
    const { token } = await request.json()

    if (!token) {
      return new Response(
        JSON.stringify({ error: 'กรุณากรอก Access Token' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const res = await fetch('https://api.line.me/v2/bot/info', {
      headers: { Authorization: `Bearer ${token}` }
    })

    if (!res.ok) {
      return new Response(
        JSON.stringify({ error: 'Token ไม่ถูกต้อง' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const data = await res.json()
    return new Response(JSON.stringify(data), {
      headers: { 'Content-Type': 'application/json' }
    })
  } catch (err) {
    return new Response(
      JSON.stringify({ error: 'เชื่อมต่อไม่สำเร็จ' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}
