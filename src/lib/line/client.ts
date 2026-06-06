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
  const token = await getLineToken()
  if (!token) return null
  const res = await fetch(`${LINE_API}/message/reply`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ replyToken, messages })
  })
  return res.json()
}

export async function pushMessage(
  to: string,
  messages: Array<any>
) {
  const token = await getLineToken()
  if (!token) return null
  const res = await fetch(`${LINE_API}/message/push`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ to, messages })
  })
  return res.json()
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
