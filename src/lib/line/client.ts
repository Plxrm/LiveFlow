const LINE_API = 'https://api.line.me/v2/bot'

import { getSettings } from '../api/settings'

async function getLineToken() {
  const settings = await getSettings()
  return settings.line_channel_access_token || ''
}

export async function replyMessage(
  replyToken: string,
  messages: Array<any>
) {
  try {
    const token = await getLineToken()

    console.log('LINE replyMessage:', {
      hasToken: !!token,
      tokenLength: token?.length || 0,
      replyToken: replyToken ? replyToken.substring(0, 10) + '...' : '(empty)',
      messageCount: messages.length
    })

    if (!token) {
      console.error('LINE: No access token configured')
      return null
    }

    const res = await fetch(`${LINE_API}/message/reply`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ replyToken, messages })
    })

    const data = await res.json()
    console.log('LINE reply response:', {
      status: res.status,
      data: data
    })

    if (!res.ok) {
      console.error('LINE reply failed:', data)
    }

    return data
  } catch (err) {
    console.error('LINE replyMessage error:', err)
    return null
  }
}

export async function pushMessage(
  to: string,
  messages: Array<any>
) {
  try {
    const token = await getLineToken()

    console.log('LINE pushMessage:', {
      hasToken: !!token,
      tokenLength: token?.length || 0,
      to: to ? to.substring(0, 10) + '...' : '(empty)',
      messageCount: messages.length
    })

    if (!token) {
      console.error('LINE: No access token configured')
      return null
    }

    const res = await fetch(`${LINE_API}/message/push`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ to, messages })
    })

    const data = await res.json()
    console.log('LINE push response:', {
      status: res.status,
      data: data
    })

    if (!res.ok) {
      console.error('LINE push failed:', data)
    }

    return data
  } catch (err) {
    console.error('LINE pushMessage error:', err)
    return null
  }
}

export async function getProfile(userId: string) {
  const token = await getLineToken()
  if (!token) return null
  const res = await fetch(`${LINE_API}/profile/${userId}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  })
  if (!res.ok) return null
  return res.json()
}

export async function getMessageContent(messageId: string): Promise<ArrayBuffer | null> {
  const token = await getLineToken()
  if (!token) return null
  const res = await fetch(`https://api-data.line.me/v2/bot/message/${messageId}/content`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  })
  if (!res.ok) return null
  return res.arrayBuffer()
}
