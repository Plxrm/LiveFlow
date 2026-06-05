interface ParsedCF {
  cf_code: string
  quantity: number
  raw: string
}

export function parseCFMessage(message: string): ParsedCF | null {
  const text = message.trim().toUpperCase()
  // regex: CF แล้วตามด้วยตัวเลข อาจมีช่องว่าง อาจมีจำนวน
  const match = text.match(/^CF\s*(\d+)\s*(\d+)?\s*(ชิ้น|PCS|EA)?$/i)
  if (!match) return null
  return {
    cf_code: `CF${match[1]}`,
    quantity: match[2] ? parseInt(match[2]) : 1,
    raw: message.trim()
  }
}
